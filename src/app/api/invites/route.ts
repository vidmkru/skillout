import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateToken } from '@/shared/auth/utils'
import { getUserBySession } from '@/shared/auth/utils'
import { getFallbackSession, getFallbackUser, setFallbackInvite, getFallbackInvitesByUser } from '@/shared/db/fallback'
import type { ApiResponse, Invite, CreateInviteRequest, InviteStats } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

// GET - List user's invites
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
			user = await getUserBySession(sessionToken)
		} catch (error) {
			const session = getFallbackSession(sessionToken)
			if (session) {
				user = getFallbackUser(session.userId)
			}
		}

		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid session'
			}, { status: 401 })
		}

		// Get user's invites
		let invites: Invite[] = []
		try {
			invites = await db.getInvitesByUser(user.id)
		} catch (error) {
			invites = getFallbackInvitesByUser(user.id)
		}

		return NextResponse.json<ApiResponse<Invite[]>>({
			success: true,
			data: invites
		})

	} catch (error) {
		console.error('Get invites error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}

// POST - Create new invite
export async function POST(request: NextRequest) {
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
			user = await getUserBySession(sessionToken)
		} catch (error) {
			const session = getFallbackSession(sessionToken)
			if (session) {
				user = getFallbackUser(session.userId)
			}
		}

		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid session'
			}, { status: 401 })
		}

		const body: CreateInviteRequest = await request.json()
		const { role, quantity = 1 } = body

		// Check if user has quota for this role
		const userQuota = user.inviteQuota[role] || 0
		const userUsed = user.invitesUsed[role] || 0

		if (userUsed >= userQuota) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: `No invites left for ${role} role`
			}, { status: 403 })
		}

		// Create invites
		const invites: Invite[] = []
		const now = new Date()
		const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

		for (let i = 0; i < Math.min(quantity, userQuota - userUsed); i++) {
			const invite: Invite = {
				id: generateToken(16),
				code: generateToken(8).toUpperCase(),
				createdBy: user.id,
				createdFor: role,
				status: 'active',
				createdAt: now.toISOString(),
				expiresAt: expiresAt.toISOString()
			}

			// Save invite
			try {
				await db.setInvite(invite.id, invite)
			} catch (error) {
				setFallbackInvite(invite.id, invite)
			}

			invites.push(invite)
		}

		// Update user's used invites
		user.invitesUsed[role] = (user.invitesUsed[role] || 0) + invites.length
		try {
			await db.setUser(user.id, user)
		} catch (error) {
			// Update fallback user
			const fallbackUser = getFallbackUser(user.id)
			if (fallbackUser) {
				fallbackUser.invitesUsed[role] = user.invitesUsed[role]
				setFallbackUser(user.id, fallbackUser)
			}
		}

		return NextResponse.json<ApiResponse<Invite[]>>({
			success: true,
			data: invites
		})

	} catch (error) {
		console.error('Create invite error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
