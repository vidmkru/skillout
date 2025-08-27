import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateToken } from '@/shared/auth/utils'
import type { ApiResponse, Invite, InviteRequest, InviteResponse } from '@/shared/types/database'

export async function GET(request: NextRequest) {
	try {
		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Unauthorized'
			}, { status: 401 })
		}

		// Get user's subscription to determine invite quota
		const subscription = await db.getSubscription(userId)
		const user = await db.getUser(userId)

		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		// Calculate invite quota based on role and subscription
		let quota = 0
		if (user.role === 'admin') {
			quota = 50
		} else if (user.role === 'producer') {
			quota = subscription?.tier === 'producer' ? 10 : 2
		} else {
			quota = 2 // Default for creators
		}

		// Get all invites issued by this user
		const allInvites = await db.getAllInvites()
		const userInvites = allInvites.filter((invite: Invite) => invite.issuedBy === userId)

		return NextResponse.json<ApiResponse<{ quota: number; invites: Invite[] }>>({
			success: true,
			data: {
				quota,
				invites: userInvites
			}
		})

	} catch (error) {
		console.error('Get invites error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const body: InviteRequest = await request.json()
		const { email } = body

		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Unauthorized'
			}, { status: 401 })
		}

		const user = await db.getUser(userId)
		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		// Check if user can issue invites
		if (user.role === 'creator') {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Creators cannot issue invites'
			}, { status: 403 })
		}

		// Get user's current invites to check quota
		const allInvites = await db.getAllInvites()
		const userInvites = allInvites.filter((invite: Invite) => invite.issuedBy === userId)
		const usedInvites = userInvites.filter((invite: Invite) => invite.used)

		// Calculate quota
		const subscription = await db.getSubscription(userId)
		let quota = 0
		if (user.role === 'admin') {
			quota = 50
		} else if (user.role === 'producer') {
			quota = subscription?.tier === 'producer' ? 10 : 2
		}

		if (usedInvites.length >= quota) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invite quota exceeded'
			}, { status: 429 })
		}

		// Generate invite code
		const code = generateToken(8).toUpperCase()
		const now = new Date()
		const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

		const invite: Invite = {
			code,
			issuedBy: userId,
			issuedTo: email,
			used: false,
			expiresAt: expiresAt.toISOString(),
			createdAt: now.toISOString(),
		}

		await db.setInvite(code, invite)

		const response: InviteResponse = {
			code,
			expiresAt: expiresAt.toISOString(),
		}

		return NextResponse.json<ApiResponse<InviteResponse>>({
			success: true,
			message: 'Invite created successfully',
			data: response
		})

	} catch (error) {
		console.error('Create invite error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
