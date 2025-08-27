import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole } from '@/shared/types/enums'
import { getFallbackUser, getFallbackSession, fallbackUsers, fallbackInvites } from '@/shared/db/fallback'
import type { ApiResponse } from '@/shared/types/database'

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
			user = await db.getUserBySession(sessionToken)
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
		let allUsers = []
		try {
			allUsers = await db.getAllUsers()
		} catch (error) {
			// Fallback to memory storage
			allUsers = Array.from(fallbackUsers.values())
		}

		// Get all invites
		let allInvites = []
		try {
			allInvites = await db.getAllInvites()
		} catch (error) {
			// Fallback to memory storage
			allInvites = Array.from(fallbackInvites.values())
		}

		// Calculate statistics
		const totalUsers = allUsers.length
		const usersByRole = {
			admin: allUsers.filter(u => u.role === UserRole.Admin).length,
			creator: allUsers.filter(u => u.role === UserRole.Creator).length,
			creatorPro: allUsers.filter(u => u.role === UserRole.CreatorPro).length,
			producer: allUsers.filter(u => u.role === UserRole.Producer).length
		}

		const totalInvites = allInvites.length
		const activeInvites = allInvites.filter(invite => invite.status === 'active').length
		const usedInvites = allInvites.filter(invite => invite.status === 'used').length

		return NextResponse.json<ApiResponse<{
			totalUsers: number
			usersByRole: typeof usersByRole
			totalInvites: number
			activeInvites: number
			usedInvites: number
		}>>({
			success: true,
			data: {
				totalUsers,
				usersByRole,
				totalInvites,
				activeInvites,
				usedInvites
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
