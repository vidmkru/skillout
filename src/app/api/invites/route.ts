import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { InviteType } from '@/shared/types/enums'
import { getFallbackUser, getFallbackSession, setFallbackInvite, setFallbackUser } from '@/shared/db/fallback'
import type { Invite, ApiResponse } from '@/shared/types/database'
import { checkAndUpdateQuota, canCreateInvite, getTypeKey } from '@/shared/utils/quotaUtils'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Generate secure invite code
function generateInviteCode(): string {
	return crypto.randomBytes(16).toString('hex').toUpperCase()
}

// GET - Get user's invites
export async function GET(request: NextRequest) {
	try {
		console.log('🔍 API GET: Starting GET request')
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

		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		// Get user's invites from Redis only
		let userInvites: Invite[] = []
		try {
			userInvites = await db.getInvitesByUser(user.id)
			console.log('🔍 API: User invites loaded from Redis:', userInvites.length)
		} catch (error) {
			console.error('Failed to load invites from Redis:', error)
			userInvites = []
		}

		console.log('🔍 API: User ID:', user.id)
		console.log('🔍 API: User email:', user.email)
		console.log('🔍 API: User invites from fallback:', userInvites)
		console.log('🔍 API: User inviteQuota:', user.inviteQuota)
		console.log('🔍 API: User invitesUsed:', user.invitesUsed)
		console.log('🔍 API: User invitesCreated length:', user.invitesCreated?.length || 0)

		// Check and update quota if needed
		const updatedUser = checkAndUpdateQuota(user)

		// Calculate remaining quota
		const remainingQuota = {
			creator: Math.max(0, updatedUser.inviteQuota.creator - updatedUser.invitesUsed.creator),
			production: Math.max(0, updatedUser.inviteQuota.production - updatedUser.invitesUsed.production),
			producer: Math.max(0, updatedUser.inviteQuota.producer - updatedUser.invitesUsed.producer)
		}

		return NextResponse.json<ApiResponse<{
			invites: Invite[]
			quota: typeof updatedUser.inviteQuota
			used: typeof updatedUser.invitesUsed
			remaining: typeof remainingQuota
			nextReset: string
		}>>({
			success: true,
			data: {
				invites: userInvites,
				quota: updatedUser.inviteQuota,
				used: updatedUser.invitesUsed,
				remaining: remainingQuota,
				nextReset: updatedUser.quotaLastReset || updatedUser.createdAt
			}
		})
	} catch (error) {
		console.error('Get invites error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to fetch invites'
		}, { status: 500 })
	}
}

// POST - Create new invite
export async function POST(request: NextRequest) {
	try {
		console.log('🔍 API POST: Starting POST request')
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

		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		const body = await request.json()
		const { type } = body

		if (!type || !Object.values(InviteType).includes(type)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid invite type'
			}, { status: 400 })
		}

		// Check and update quota if needed
		const updatedUser = checkAndUpdateQuota(user)

		// Check if user can create this type of invite
		if (!canCreateInvite(updatedUser, type)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: `No ${type} invites remaining`
			}, { status: 403 })
		}

		// Generate invite
		const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		const inviteCode = generateInviteCode()
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

		// Get base URL from environment or use default
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skillout-o7c7.vercel.app'

		const newInvite: Invite = {
			id: inviteId,
			code: inviteCode,
			type,
			createdBy: user.id,
			createdAt: new Date().toISOString(),
			expiresAt,
			status: 'active',
			qrCode: `${baseUrl}/register?code=${inviteCode}&type=${type}`
		}

		// Save invite to Redis and fallback
		try {
			await db.setInvite(inviteCode, newInvite)
			console.log('Invite saved to Redis:', newInvite)
		} catch (error) {
			console.error('Failed to save invite to Redis, using fallback:', error)
			setFallbackInvite(inviteId, newInvite)
		}

		// Update user's invite usage and add invite to user's created invites
		const typeKey = getTypeKey(type)
		const finalUpdatedUser = {
			...updatedUser,
			invitesUsed: {
				...updatedUser.invitesUsed,
				[typeKey]: updatedUser.invitesUsed[typeKey] + 1
			},
			invitesCreated: [...(updatedUser.invitesCreated || []), newInvite]
		}

		console.log('🔍 API: Updated user data:', {
			id: updatedUser.id,
			email: updatedUser.email,
			invitesUsed: updatedUser.invitesUsed,
			invitesCreated: updatedUser.invitesCreated?.length || 0
		})

		// Update user in Redis and fallback storage
		try {
			await db.setUser(user.id, finalUpdatedUser)
			console.log('🔍 API: User updated in Redis')
		} catch (error) {
			console.error('Failed to update user in Redis, using fallback:', error)
			setFallbackUser(user.id, finalUpdatedUser)
		}

		return NextResponse.json<ApiResponse<{ invite: Invite }>>({
			success: true,
			data: { invite: newInvite }
		})
	} catch (error) {
		console.error('Create invite error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to create invite'
		}, { status: 500 })
	}
}

// PUT - Validate invite code
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json()
		const { code } = body

		if (!code) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invite code is required'
			}, { status: 400 })
		}

		// Find invite by code (Redis only)
		let invite: Invite | null = null
		try {
			invite = await db.getInviteByCode(code)
		} catch (error) {
			console.error('Failed to get invite from Redis:', error)
			invite = null
		}

		if (!invite) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid invite code'
			}, { status: 404 })
		}

		// Check if invite is expired
		if (new Date() > new Date(invite.expiresAt)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invite code has expired'
			}, { status: 400 })
		}

		// Check if invite is already used
		if (invite.status === 'used') {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invite code has already been used'
			}, { status: 400 })
		}

		return NextResponse.json<ApiResponse<{ invite: Invite }>>({
			success: true,
			data: { invite }
		})
	} catch (error) {
		console.error('Validate invite error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to validate invite'
		}, { status: 500 })
	}
}
