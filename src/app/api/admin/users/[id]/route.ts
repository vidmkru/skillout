import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole } from '@/shared/types/enums'

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params
		const body = await request.json()
		const { role } = body

		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const adminUser = await db.getUser(userId)
		if (!adminUser || adminUser.role !== UserRole.Admin) {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		// Validate role
		if (!Object.values(UserRole).includes(role)) {
			return NextResponse.json(
				{ error: 'Invalid role' },
				{ status: 400 }
			)
		}

		// Get user to update
		const user = await db.getUser(id)
		if (!user) {
			return NextResponse.json(
				{ error: 'User not found' },
				{ status: 404 }
			)
		}

		// Update user role
		user.role = role
		user.updatedAt = new Date().toISOString()

		// Update invite quotas based on new role
		const getQuotaForRole = (userRole: UserRole) => {
			switch (userRole) {
				case UserRole.Admin:
					return { creator: 50, production: 20, producer: 100 }
				case UserRole.CreatorPro:
					return { creator: 5, production: 2, producer: 10 }
				case UserRole.Creator:
					return { creator: 2, production: 0, producer: 5 }
				case UserRole.Producer:
					return { creator: 0, production: 0, producer: 0 }
				default:
					return { creator: 0, production: 0, producer: 0 }
			}
		}

		user.inviteQuota = getQuotaForRole(role)

		// Save updated user
		await db.setUser(id, user)

		return NextResponse.json({
			success: true,
			message: 'User role updated successfully',
			user: {
				id: user.id,
				email: user.email,
				role: user.role
			}
		})
	} catch (error) {
		console.error('Update user error:', error)
		return NextResponse.json(
			{ error: 'Failed to update user' },
			{ status: 500 }
		)
	}
}
