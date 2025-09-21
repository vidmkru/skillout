import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole } from '@/shared/types/enums'
import type { User, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		console.log('🔄 Admin Migrate Roles API: Starting role migration')

		// Get current user from session
		const sessionToken = request.cookies.get('session')?.value
		if (!sessionToken) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'Unauthorized'
			}, { status: 401 })
		}

		// Get session and user
		const session = await db.getSession(sessionToken)
		if (!session) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'Invalid session'
			}, { status: 401 })
		}

		const adminUser = await db.getUser(session.userId)
		if (!adminUser || adminUser.role !== UserRole.Admin) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'Admin access required'
			}, { status: 403 })
		}

		// Get all users
		const allUsers = await db.getAllUsers()
		console.log('🔍 Found users:', allUsers.length)

		let migratedCount = 0
		const migrationResults = []

		for (const user of allUsers) {
			let needsUpdate = false
			const updatedUser = { ...user }

			// Check if user has old role values
			if (user.role === 'creator-pro' || user.role === 'CreatorPro') {
				updatedUser.role = UserRole.Production
				needsUpdate = true
				migrationResults.push({
					email: user.email,
					oldRole: user.role,
					newRole: UserRole.Production
				})
			}

			// Update subscription tier if needed
			if (user.subscriptionTier === 'creator-pro' || user.subscriptionTier === 'CreatorPro') {
				updatedUser.subscriptionTier = 'production'
				needsUpdate = true
			}

			// Update invite quotas if needed
			if (user.inviteQuota && (user.inviteQuota as any).creatorPro !== undefined) {
				const quota = user.inviteQuota as any
				updatedUser.inviteQuota = {
					creator: quota.creator || 0,
					production: quota.creatorPro || 0,
					producer: quota.producer || 0
				}
				needsUpdate = true
			}

			// Update invites used if needed
			if (user.invitesUsed && (user.invitesUsed as any).creatorPro !== undefined) {
				const invitesUsed = user.invitesUsed as any
				updatedUser.invitesUsed = {
					creator: invitesUsed.creator || 0,
					production: invitesUsed.creatorPro || 0,
					producer: invitesUsed.producer || 0
				}
				needsUpdate = true
			}

			if (needsUpdate) {
				updatedUser.updatedAt = new Date().toISOString()
				await db.setUser(user.id, updatedUser)
				migratedCount++
				console.log('✅ Migrated user:', user.email, 'from', user.role, 'to', updatedUser.role)
			}
		}

		console.log('✅ Admin Migrate Roles API: Migration completed. Migrated:', migratedCount, 'users')

		return NextResponse.json<ApiResponse<{ migratedCount: number; results: any[] }>>({
			success: true,
			data: {
				migratedCount,
				results: migrationResults
			},
			message: `Successfully migrated ${migratedCount} users`
		})

	} catch (error) {
		console.error('❌ Admin Migrate Roles API: Error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			message: 'Internal server error'
		}, { status: 500 })
	}
}
