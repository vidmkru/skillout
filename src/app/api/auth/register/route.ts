import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateToken } from '@/shared/auth/utils'
import { UserRole, SubscriptionTier, InviteType } from '@/shared/types/enums'
import type { User } from '@/shared/types/database'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { email, role, inviteCode } = body

		// Validate email
		if (!email || !email.includes('@')) {
			return NextResponse.json(
				{ error: 'Valid email is required' },
				{ status: 400 }
			)
		}

		// Validate role
		if (!Object.values(UserRole).includes(role)) {
			return NextResponse.json(
				{ error: 'Invalid role' },
				{ status: 400 }
			)
		}

		// Check if user already exists
		const existingUser = await db.getUserByEmail(email)
		if (existingUser) {
			return NextResponse.json(
				{ error: 'User already exists' },
				{ status: 409 }
			)
		}

		// Handle invite validation for creators
		if (role === UserRole.Creator || role === UserRole.CreatorPro) {
			if (!inviteCode) {
				return NextResponse.json(
					{ error: 'Invite code is required for creators' },
					{ status: 400 }
				)
			}

			// Validate invite
			const invite = await db.getInvite(inviteCode)
			if (!invite) {
				return NextResponse.json(
					{ error: 'Invalid invite code' },
					{ status: 400 }
				)
			}

			if (invite.used) {
				return NextResponse.json(
					{ error: 'Invite code already used' },
					{ status: 400 }
				)
			}

			// Check if invite type matches role
			const expectedInviteType = role === UserRole.CreatorPro ? InviteType.CreatorPro : InviteType.Creator
			if (invite.inviteType !== expectedInviteType) {
				return NextResponse.json(
					{ error: 'Invite code is not valid for this role' },
					{ status: 400 }
				)
			}

			// Mark invite as used
			invite.used = true
			invite.usedAt = new Date().toISOString()
			invite.issuedTo = email
			await db.setInvite(inviteCode, invite)

			// Update invite quota for issuer
			const issuer = await db.getUser(invite.issuedBy)
			if (issuer) {
				const inviteType = invite.inviteType as keyof typeof issuer.invitesUsed
				issuer.invitesUsed[inviteType]++
				await db.setUser(issuer.id, issuer)
			}
		}

		// Create user
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

		await db.setUser(userId, user)

		// Create initial subscription
		const subscription = {
			userId,
			tier: SubscriptionTier.Free,
			status: 'active' as const,
			startsAt: now,
			expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
			autoRenew: false
		}

		await db.setSubscription(userId, subscription)

		return NextResponse.json({
			success: true,
			message: 'User registered successfully',
			user: {
				id: user.id,
				email: user.email,
				role: user.role
			}
		})
	} catch (error) {
		console.error('Registration error:', error)
		return NextResponse.json(
			{ error: 'Registration failed' },
			{ status: 500 }
		)
	}
}
