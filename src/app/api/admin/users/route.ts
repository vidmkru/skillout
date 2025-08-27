import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole } from '@/shared/types/enums'

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

		return NextResponse.json({
			users: allUsers
		})
	} catch (error) {
		console.error('Get users error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch users' },
			{ status: 500 }
		)
	}
}
