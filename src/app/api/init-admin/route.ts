import { NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, SubscriptionTier } from '@/shared/types/enums'
import type { User, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST() {
	try {
		console.log('🔧 Initializing admin account in Redis...')
		const now = new Date().toISOString()

		// Create admin user
		const adminUser: User = {
			id: 'admin-test-123',
			email: 'admin@skillout.pro',
			role: UserRole.Admin,
			createdAt: now,
			updatedAt: now,
			isVerified: true,
			subscriptionTier: SubscriptionTier.Free,
			inviteQuota: { creator: 1000, production: 500, producer: 2000 },
			invitesUsed: { creator: 0, production: 0, producer: 0 },
			invitesCreated: [],
			quotaLastReset: now
		}

		// Save admin user to Redis
		try {
			await db.setUser(adminUser.id, adminUser)
			console.log(`✅ Admin user ${adminUser.email} saved to Redis`)
		} catch (error) {
			console.error(`❌ Failed to save admin user to Redis:`, error)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Failed to save admin user to Redis'
			}, { status: 500 })
		}

		console.log('✅ Admin account initialization completed')

		return NextResponse.json<ApiResponse<{ user: User }>>({
			success: true,
			data: { user: adminUser },
			message: 'Admin account initialized successfully in Redis'
		})

	} catch (error) {
		console.error('❌ Admin initialization error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to initialize admin account'
		}, { status: 500 })
	}
}
