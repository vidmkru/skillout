import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { ProductionProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

// GET - Get user profile by user ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		console.log('🔍 Get User Profile API: Request received for user:', params.id)

		const userId = params.id

		// Get profile by userId from Redis
		const profile = await db.getProfile(userId)
		if (!profile) {
			console.log('❌ Get User Profile API: Profile not found for user:', userId)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'Profile not found'
			}, { status: 404 })
		}
		console.log('✅ Get User Profile API: Profile found:', profile.id)

		return NextResponse.json<ApiResponse<ProductionProfile>>({
			success: true,
			data: profile
		})

	} catch (error) {
		console.error('❌ Get User Profile API: Error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			message: 'Internal server error'
		}, { status: 500 })
	}
}

// PUT - Update user profile
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		console.log('📝 Update User Profile API: Request received for user:', params.id)

		const userId = params.id
		const updateData = await request.json()

		// Get existing profile from Redis
		const existingProfile = await db.getProfile(userId)
		if (!existingProfile) {
			console.log('❌ Update User Profile API: Profile not found for user:', userId)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'Profile not found'
			}, { status: 404 })
		}

		// Update profile with new data
		const updatedProfile: ProductionProfile = {
			...existingProfile,
			...updateData,
			updatedAt: new Date().toISOString()
		}

		// Update the profile in Redis
		await db.setProfile(userId, updatedProfile)

		console.log('✅ Update User Profile API: Profile updated:', updatedProfile.id)

		return NextResponse.json<ApiResponse<ProductionProfile>>({
			success: true,
			data: updatedProfile,
			message: 'Profile updated successfully'
		})

	} catch (error) {
		console.error('❌ Update User Profile API: Error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			message: 'Internal server error'
		}, { status: 500 })
	}
}
