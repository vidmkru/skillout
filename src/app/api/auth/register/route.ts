import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, SubscriptionTier, ExperienceLevel } from '@/shared/types/enums'
import { setFallbackUser, setFallbackSession } from '@/shared/db/fallback'
import type { User, Session, ApiResponse, Invite, CreatorProfile } from '@/shared/types/database'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const {
			email,
			role,
			inviteCode,
			// Creator-specific fields
			name,
			bio,
			specialization,
			tools,
			clients,
			contacts
		} = body

		if (!email || !role) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Email and role are required'
			}, { status: 400 })
		}

		// Check if invite code is required for creators (only Creator needs invite, CreatorPro can register freely)
		if (role === UserRole.Creator && !inviteCode) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invite code is required for Creator registration'
			}, { status: 400 })
		}

		// Validate invite code if provided or required (Redis only)
		let invite: Invite | null = null
		if (inviteCode) {
			try {
				invite = await db.getInviteByCode(inviteCode)
			} catch (error) {
				console.error('Failed to check invite in Redis:', error)
				invite = null
			}

			if (!invite) {
				return NextResponse.json<ApiResponse<null>>({
					success: false,
					error: 'Invalid invite code'
				}, { status: 400 })
			}

			if (invite.status === 'used') {
				return NextResponse.json<ApiResponse<null>>({
					success: false,
					error: 'Invite code has already been used'
				}, { status: 400 })
			}

			if (new Date() > new Date(invite.expiresAt)) {
				return NextResponse.json<ApiResponse<null>>({
					success: false,
					error: 'Invite code has expired'
				}, { status: 400 })
			}

			if (invite.type !== role) {
				return NextResponse.json<ApiResponse<null>>({
					success: false,
					error: `Invite code is for ${invite.type} role, not ${role}`
				}, { status: 400 })
			}
		} else if (role === UserRole.Creator) {
			// This should not happen due to the check above, but just in case
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invite code is required for Creator registration'
			}, { status: 400 })
		}

		// Check if user already exists (Redis only)
		let existingUser = null
		try {
			existingUser = await db.getUserByEmail(email)
		} catch (error) {
			console.error('Failed to check user existence in Redis:', error)
			existingUser = null
		}

		if (existingUser) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User with this email already exists'
			}, { status: 409 })
		}

		// Create new user
		const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		const now = new Date().toISOString()

		// Set initial invite quotas based on role
		const getInitialQuota = (userRole: UserRole) => {
			switch (userRole) {
				case UserRole.Admin:
					return { creator: 1000, production: 500, producer: 2000 }
				case UserRole.CreatorPro:
					return { creator: 10, production: 2, producer: 20 }
				case UserRole.Creator:
					return { creator: 2, production: 0, producer: 5 }
				case UserRole.Producer:
					return { creator: 0, production: 0, producer: 0 }
				default:
					return { creator: 0, production: 0, producer: 0 }
			}
		}

		const newUser: User = {
			id: userId,
			email: email.toLowerCase(),
			role,
			createdAt: now,
			updatedAt: now,
			isVerified: false, // New users need admin verification
			subscriptionTier: role === UserRole.CreatorPro ? SubscriptionTier.CreatorPro : SubscriptionTier.Free,
			inviteQuota: getInitialQuota(role),
			invitesUsed: { creator: 0, production: 0, producer: 0 },
			invitesCreated: [],
			quotaLastReset: now
		}

		// Save user
		try {
			await db.setUser(userId, newUser)
		} catch (error) {
			setFallbackUser(userId, newUser)
		}

		// Create profile for creators (Creator and CreatorPro roles)
		if (role === UserRole.Creator || role === UserRole.CreatorPro) {
			const productionfile: CreatorProfile = {
				id: userId,
				userId: userId,
				name: name || email.split('@')[0], // Use provided name or email prefix
				bio: bio || 'Креативный специалист',
				avatar: undefined,
				specialization: specialization || ['Видеомонтаж'],
				tools: tools || ['Adobe Premiere Pro'],
				experience: ExperienceLevel.OneToTwo,
				clients: clients || [],
				portfolio: [],
				achievements: [],
				rating: 4.5,
				recommendations: [],
				badges: [],
				contacts: contacts || {
					telegram: '',
					instagram: '',
					behance: '',
					linkedin: ''
				},
				isPublic: true,
				isPro: role === UserRole.CreatorPro,
				createdAt: now,
				updatedAt: now
			}

			try {
				await db.setProfile(userId, productionfile)
				console.log(`✅ Profile created for creator ${email}`)
			} catch (error) {
				console.error(`❌ Failed to create profile for ${email}:`, error)
			}
		}

		// Mark invite as used if provided (required for creators)
		if (invite && inviteCode) {
			const updatedInvite: Invite = {
				...invite,
				status: 'used' as const,
				usedBy: userId,
				usedAt: now,
				usedEmail: email
			}

			try {
				await db.setInvite(invite.id, updatedInvite)
				console.log(`✅ Invite ${inviteCode} marked as used by ${email}`)
			} catch (error) {
				console.error(`❌ Failed to mark invite as used:`, error)
				// Don't use fallback for invites, just log the error
			}
		}

		// Create session
		const sessionToken = crypto.randomBytes(32).toString('hex')
		const session: Session = {
			id: sessionToken,
			userId,
			createdAt: now,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
		}

		try {
			await db.setSession(sessionToken, session)
		} catch (error) {
			setFallbackSession(sessionToken, session)
		}

		// Set session cookie
		const response = NextResponse.json<ApiResponse<{ user: User }>>({
			success: true,
			data: { user: newUser }
		})

		response.cookies.set('session', sessionToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 24 * 60 * 60 // 24 hours
		})

		return response
	} catch (error) {
		console.error('Registration error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Registration failed'
		}, { status: 500 })
	}
}
