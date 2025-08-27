import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateToken } from '@/shared/auth/utils'
import { UserRole, SubscriptionTier } from '@/shared/types/enums'
import { getFallbackUserByEmail, setFallbackUser, getFallbackInviteByCode, updateFallbackInvite } from '@/shared/db/fallback'
import type { User } from '@/shared/types/database'

export async function POST(request: NextRequest) {
	try {
		console.log('🔍 Registration attempt started')
		console.log('📋 Environment check:', {
			REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
			NODE_ENV: process.env.NODE_ENV,
			hasRedisUrl: !!process.env.REDIS_URL
		})

		const body = await request.json()
		const { email, role, inviteCode } = body

		console.log('📝 Registration data:', { email, role, inviteCode })

		// Validate email
		if (!email || !email.includes('@')) {
			console.log('❌ Invalid email:', email)
			return NextResponse.json(
				{ error: 'Valid email is required' },
				{ status: 400 }
			)
		}

		// Validate role
		if (!Object.values(UserRole).includes(role)) {
			console.log('❌ Invalid role:', role)
			return NextResponse.json(
				{ error: 'Invalid role' },
				{ status: 400 }
			)
		}

		// Check if user already exists (try Redis first, then fallback)
		console.log('🔍 Checking if user exists...')
		let existingUser = null

		try {
			existingUser = await db.getUserByEmail(email)
		} catch (error) {
			console.log('⚠️ Redis failed, checking fallback storage...')
			existingUser = getFallbackUserByEmail(email)
		}

		if (existingUser) {
			console.log('❌ User already exists:', email)
			return NextResponse.json(
				{ error: 'User already exists' },
				{ status: 409 }
			)
		}
		console.log('✅ User does not exist, proceeding...')

		// Handle invite validation for creators
		if (role === UserRole.Creator || role === UserRole.CreatorPro) {
			if (!inviteCode) {
				console.log('❌ Missing invite code for creator role')
				return NextResponse.json(
					{ error: 'Invite code is required for creators' },
					{ status: 400 }
				)
			}

			// Validate invite code
			console.log('🔍 Validating invite code:', inviteCode)
			let invite = null
			try {
				invite = await db.getInviteByCode(inviteCode)
			} catch (error) {
				console.log('⚠️ Redis failed, checking fallback storage...')
				invite = getFallbackInviteByCode(inviteCode)
			}

			if (!invite) {
				console.log('❌ Invalid invite code:', inviteCode)
				return NextResponse.json(
					{ error: 'Invalid invite code' },
					{ status: 400 }
				)
			}

			if (invite.status !== 'active') {
				console.log('❌ Invite is not active:', invite.status)
				return NextResponse.json(
					{ error: 'Invite code has expired or already used' },
					{ status: 400 }
				)
			}

			if (invite.createdFor !== role) {
				console.log('❌ Invite is for different role:', invite.createdFor, 'expected:', role)
				return NextResponse.json(
					{ error: 'Invite code is for different role' },
					{ status: 400 }
				)
			}

			// Check if invite is expired
			if (new Date(invite.expiresAt) < new Date()) {
				console.log('❌ Invite has expired:', invite.expiresAt)
				return NextResponse.json(
					{ error: 'Invite code has expired' },
					{ status: 400 }
				)
			}

			console.log('✅ Invite code is valid')
		}

		// Create user
		console.log('👤 Creating user...')
		const userId = generateToken(16)
		const now = new Date().toISOString()

		// Set initial invite quotas based on role
		const getInitialQuota = (userRole: UserRole) => {
			switch (userRole) {
				case UserRole.Admin:
					return { creator: 50, creatorPro: 20, producer: 100 }
				case UserRole.CreatorPro:
					return { creator: 5, creatorPro: 2, producer: 10 }
				case UserRole.Creator:
					return { creator: 2, creatorPro: 0, producer: 5 }
				case UserRole.Producer:
					return { creator: 0, creatorPro: 0, producer: 0 }
				default:
					return { creator: 0, creatorPro: 0, producer: 0 }
			}
		}

		const user: User = {
			id: userId,
			email: email.toLowerCase(),
			role,
			createdAt: now,
			updatedAt: now,
			isVerified: false,
			subscriptionTier: role === UserRole.Producer ? SubscriptionTier.Free : SubscriptionTier.Free,
			inviteQuota: getInitialQuota(role),
			invitesUsed: { creator: 0, creatorPro: 0, producer: 0 }
		}

		// Try to save to Redis, fallback to memory if it fails
		console.log('💾 Saving user...')
		let storageType = 'redis'
		try {
			await db.setUser(userId, user)
			console.log('✅ User saved to Redis successfully')
		} catch (error) {
			console.log('⚠️ Redis failed, saving to fallback storage...')
			setFallbackUser(userId, user)
			storageType = 'fallback'
			console.log('✅ User saved to fallback storage')
		}

		// Mark invite as used if it was provided
		if (inviteCode) {
			console.log('🔍 Marking invite as used:', inviteCode)
			try {
				const invite = await db.getInviteByCode(inviteCode)
				if (invite) {
					invite.status = 'used'
					invite.usedBy = userId
					invite.usedAt = now
					await db.setInvite(invite.id, invite)
					console.log('✅ Invite marked as used in Redis')
				}
			} catch (error) {
				console.log('⚠️ Redis failed, updating fallback invite...')
				const fallbackInvite = getFallbackInviteByCode(inviteCode)
				if (fallbackInvite) {
					updateFallbackInvite(fallbackInvite.id, {
						status: 'used',
						usedBy: userId,
						usedAt: now
					})
					console.log('✅ Invite marked as used in fallback')
				}
			}
		}

		// Create initial subscription
		console.log('💳 Creating subscription...')
		const subscription = {
			userId,
			tier: SubscriptionTier.Free,
			status: 'active' as const,
			startsAt: now,
			expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
			autoRenew: false
		}

		try {
			await db.setSubscription(userId, subscription)
			console.log('✅ Subscription saved to Redis')
		} catch (error) {
			console.log('⚠️ Redis failed, subscription not saved (demo mode)')
		}

		console.log('🎉 Registration completed successfully:', { userId, email, role, storageType })

		return NextResponse.json({
			success: true,
			message: 'User registered successfully',
			user: {
				id: user.id,
				email: user.email,
				role: user.role
			},
			storage: storageType
		})
	} catch (error) {
		console.error('💥 Registration error:', error)
		console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
		return NextResponse.json(
			{ error: 'Registration failed', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
