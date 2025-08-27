import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole } from '@/shared/types/enums'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const user = await db.getUser(userId)
		if (!user || user.role !== UserRole.Admin) {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		// Get all users
		const allUsers = await db.getAllUsers()

		// Get all invites
		const allInvites = await db.getAllInvites()

		// Calculate statistics
		const totalUsers = allUsers.length
		const usersByRole = {
			admin: allUsers.filter(u => u.role === UserRole.Admin).length,
			creator: allUsers.filter(u => u.role === UserRole.Creator).length,
			creatorPro: allUsers.filter(u => u.role === UserRole.CreatorPro).length,
			producer: allUsers.filter(u => u.role === UserRole.Producer).length
		}

		const totalInvites = allInvites.length
		const activeInvites = allInvites.filter(invite => invite.status === 'active').length
		const usedInvites = allInvites.filter(invite => invite.status === 'used').length

		return NextResponse.json({
			totalUsers,
			usersByRole,
			totalInvites,
			activeInvites,
			usedInvites
		})
	} catch (error) {
		console.error('Get admin stats error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch admin statistics' },
			{ status: 500 }
		)
	}
}
