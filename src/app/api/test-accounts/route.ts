import { NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateToken } from '@/shared/auth/utils'
import { UserRole, SubscriptionTier } from '@/shared/types/enums'
import { setFallbackUser } from '@/shared/db/fallback'
import type { User, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST() {
	try {
		const now = new Date().toISOString()
		const testAccounts: User[] = []

		// Create test accounts for each role
		const roles = [
			{ role: UserRole.Admin, email: 'admin@skillout.pro' },
			{ role: UserRole.Production, email: 'production@skillout.pro' },
			{ role: UserRole.Creator, email: 'creator@skillout.pro' },
			{ role: UserRole.Producer, email: 'producer@skillout.pro' }
		]

		for (const { role, email } of roles) {
			const userId = generateToken(16)

			// Set initial invite quotas based on role
			const getInitialQuota = (userRole: UserRole) => {
				switch (userRole) {
					case UserRole.Admin:
						return { creator: 50, production: 20, producer: 100 }
					case UserRole.Production:
						return { creator: 5, production: 2, producer: 10 }
					case UserRole.Creator:
						return { creator: 2, production: 0, producer: 5 }
					case UserRole.Producer:
						return { creator: 0, production: 0, producer: 0 }
					default:
						return { creator: 0, production: 0, producer: 0 }
				}
			}

			const user: User = {
				id: userId,
				email: email.toLowerCase(),
				role,
				createdAt: now,
				updatedAt: now,
				isVerified: true,
				subscriptionTier: role === UserRole.Producer ? SubscriptionTier.Free : SubscriptionTier.Free,
				inviteQuota: getInitialQuota(role),
				invitesUsed: { creator: 0, production: 0, producer: 0 },
				invitesCreated: [],
				quotaLastReset: now
			}

			// Try to save to Redis, fallback to memory
			try {
				await db.setUser(userId, user)
				console.log(`Test user ${email} saved to Redis`)
			} catch (error) {
				console.error(`Failed to save test user ${email} to Redis, using fallback:`, error)
				setFallbackUser(userId, user)
			}

			testAccounts.push(user)
		}

		return NextResponse.json<ApiResponse<User[]>>({
			success: true,
			data: testAccounts,
			message: 'Test accounts created successfully'
		})

	} catch (error) {
		console.error('Create test accounts error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to create test accounts'
		}, { status: 500 })
	}
}
