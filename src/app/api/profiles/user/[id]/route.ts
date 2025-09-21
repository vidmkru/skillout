import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { CreatorProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

// GET - Get user profile by user ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		console.log('🔍 Get User Profile API: Request received for user:', params.id)

		const userId = params.id

		// Get all profiles from Redis
		const profiles = await db.lrange('profiles', 0, -1)
		console.log('🔍 Get User Profile API: Found profiles:', profiles.length)

		// Find profile by userId
		const profileData = profiles.find((profileStr: string) => {
			try {
				const profile = JSON.parse(profileStr) as CreatorProfile
				return profile.userId === userId
			} catch {
				return false
			}
		})

		if (!profileData) {
			console.log('❌ Get User Profile API: Profile not found for user:', userId)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'Profile not found'
			}, { status: 404 })
		}

		const profile = JSON.parse(profileData) as CreatorProfile
		console.log('✅ Get User Profile API: Profile found:', profile.id)

		return NextResponse.json<ApiResponse<CreatorProfile>>({
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

		// Get all profiles from Redis
		const profiles = await db.lrange('profiles', 0, -1)
		console.log('📝 Update User Profile API: Found profiles:', profiles.length)

		// Find profile by userId
		const profileIndex = profiles.findIndex((profileStr: string) => {
			try {
				const profile = JSON.parse(profileStr) as CreatorProfile
				return profile.userId === userId
			} catch {
				return false
			}
		})

		if (profileIndex === -1) {
			console.log('❌ Update User Profile API: Profile not found for user:', userId)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				message: 'Profile not found'
			}, { status: 404 })
		}

		// Parse existing profile
		const existingProfile = JSON.parse(profiles[profileIndex]) as CreatorProfile

		// Update profile with new data
		const updatedProfile: CreatorProfile = {
			...existingProfile,
			...updateData,
			updatedAt: new Date().toISOString()
		}

		// Update the profile in Redis
		await db.lset('profiles', profileIndex, JSON.stringify(updatedProfile))

		console.log('✅ Update User Profile API: Profile updated:', updatedProfile.id)

		return NextResponse.json<ApiResponse<CreatorProfile>>({
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
