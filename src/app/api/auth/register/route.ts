import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateToken, isValidEmail, checkRateLimit } from '@/shared/auth/utils'
import type { RegisterRequest, ApiResponse, User } from '@/shared/types/database'

export async function POST(request: NextRequest) {
	try {
		const body: RegisterRequest = await request.json()
		const { email, role, inviteCode } = body

		// Validate email
		if (!email || !isValidEmail(email)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid email address'
			}, { status: 400 })
		}

		// Validate role
		if (!role || !['creator', 'producer'].includes(role)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid role'
			}, { status: 400 })
		}

		// Rate limiting
		const rateLimitKey = `register:${email}`
		if (!checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) { // 3 attempts per hour
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Too many registration attempts. Please try again later.'
			}, { status: 429 })
		}

		// Check if user already exists
		const existingUser = await db.getUserByEmail(email)
		if (existingUser) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User already exists'
			}, { status: 409 })
		}

		// Validate invite code if required
		if (role === 'producer' && !inviteCode) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invite code required for producer registration'
			}, { status: 400 })
		}

		if (inviteCode) {
			const invite = await db.getInvite(inviteCode)
			if (!invite || invite.used) {
				return NextResponse.json<ApiResponse<null>>({
					success: false,
					error: 'Invalid or used invite code'
				}, { status: 400 })
			}

			// Mark invite as used
			invite.used = true
			invite.usedAt = new Date().toISOString()
			invite.issuedTo = email
			await db.setInvite(inviteCode, invite)
		}

		// Create user
		const userId = generateToken(16)
		const now = new Date().toISOString()

		const user: User = {
			id: userId,
			email: email.toLowerCase(),
			role,
			createdAt: now,
			updatedAt: now,
			isVerified: false,
			subscriptionTier: 'free',
		}

		await db.setUser(userId, user)

		// Create initial subscription
		const subscription = {
			userId,
			tier: 'free' as const,
			status: 'active' as const,
			startsAt: now,
			expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
			autoRenew: false,
		}

		await db.setSubscription(userId, subscription)

		return NextResponse.json<ApiResponse<User>>({
			success: true,
			message: 'User registered successfully',
			data: user
		})

	} catch (error) {
		console.error('Register error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
