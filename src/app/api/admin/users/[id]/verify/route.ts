import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { User, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		console.log('🔐 Admin Verify User API: Request received for user:', params.id)

		const userId = params.id
		const { isVerified } = await request.json()

		if (typeof isVerified !== 'boolean') {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'isVerified must be a boolean'
			}, { status: 400 })
		}

		// Get user from Redis
		const user = await db.getUser(userId)
		if (!user) {
			console.log('❌ Admin Verify User API: User not found:', userId)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'User not found'
			}, { status: 404 })
		}

		// Update user verification status
		const updatedUser: User = {
			...user,
			isVerified,
			updatedAt: new Date().toISOString()
		}

		// Save updated user
		await db.setUser(userId, updatedUser)

		console.log('✅ Admin Verify User API: User verification updated:', userId, 'isVerified:', isVerified)

		return NextResponse.json<ApiResponse<User>>({
			success: true,
			data: updatedUser,
			message: `User ${isVerified ? 'verified' : 'unverified'} successfully`
		})

	} catch (error) {
		console.error('❌ Admin Verify User API: Error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			message: 'Internal server error'
		}, { status: 500 })
	}
}
