import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, InviteType } from '@/shared/types/enums'
import { getFallbackUser, getFallbackSession, fallbackUsers, fallbackInvites } from '@/shared/db/fallback'
import type { ApiResponse, User, Invite } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session')?.value

		if (!sessionToken) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Authentication required'
			}, { status: 401 })
		}

		// Get user from session
		let user = null
		try {
			try {
				// Get session first, then user
				const session = await db.getSession(sessionToken)
				if (session) {
					user = await db.getUser(session.userId)
				}
			} catch (error) {
				const session = getFallbackSession(sessionToken)
				if (session) {
					user = getFallbackUser(session.userId)
				}
			}
		} catch (error) {
			const session = getFallbackSession(sessionToken)
			if (session) {
				user = getFallbackUser(session.userId)
			}
		}

		if (!user || user.role !== UserRole.Admin) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Admin access required'
			}, { status: 403 })
		}

		// Get all users
		let allUsers: User[] = []
		try {
			allUsers = await db.getAllUsers()
		} catch (error) {
			// Fallback to memory storage
			allUsers = Array.from(fallbackUsers.values()) as User[]
		}

		// Get all invites
		let allInvites: Invite[] = []
		try {
			allInvites = await db.getAllInvites()
		} catch (error) {
			// Fallback to memory storage
			allInvites = Array.from(fallbackInvites.values()) as Invite[]
		}

		// Calculate statistics
		const totalUsers = allUsers.length
		const usersByRole = {
			admin: allUsers.filter(u => u.role === UserRole.Admin).length,
			creator: allUsers.filter(u => u.role === UserRole.Creator).length,
			production: allUsers.filter(u => u.role === UserRole.Production).length,
			producer: allUsers.filter(u => u.role === UserRole.Producer).length
		}

		const totalInvites = allInvites.length
		const activeInvites = allInvites.filter(invite => invite.status === 'active').length
		const usedInvites = allInvites.filter(invite => invite.status === 'used').length
		const expiredInvites = allInvites.filter(invite => invite.status === 'expired').length

		// Calculate invite usage by type
		const invitesByType = {
			creator: allInvites.filter(invite => invite.type === InviteType.Creator).length,
			production: allInvites.filter(invite => invite.type === InviteType.Production).length,
			producer: allInvites.filter(invite => invite.type === InviteType.Producer).length
		}

		return NextResponse.json<ApiResponse<{
			totalUsers: number
			usersByRole: typeof usersByRole
			totalInvites: number
			activeInvites: number
			usedInvites: number
			expiredInvites: number
			invitesByType: typeof invitesByType
		}>>({
			success: true,
			data: {
				totalUsers,
				usersByRole,
				totalInvites,
				activeInvites,
				usedInvites,
				expiredInvites,
				invitesByType
			}
		})
	} catch (error) {
		console.error('Get admin stats error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to fetch admin statistics'
		}, { status: 500 })
	}
}
