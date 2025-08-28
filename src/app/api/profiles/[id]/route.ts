import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { CreatorProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		console.log('🔍 Profile API: Request received for ID:', params.id)
		console.log('🔍 Profile API: URL:', request.url)

		const profile = await db.getProfile(params.id)

		if (!profile) {
			console.log('❌ Profile API: Profile not found for ID:', params.id)
			return NextResponse.json<ApiResponse<null>>(
				{ success: false, error: 'Profile not found' },
				{ status: 404 }
			)
		}

		console.log('✅ Profile API: Profile found:', profile.name, 'ID:', profile.id)

		return NextResponse.json<ApiResponse<CreatorProfile>>({
			success: true,
			data: profile
		})
	} catch (error) {
		console.error('❌ Profile API error:', error)
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: 'Failed to fetch profile' },
			{ status: 500 }
		)
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params
		const body = await request.json()

		if (!id) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Profile ID is required'
			}, { status: 400 })
		}

		// Get current user from headers (set by middleware)
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Unauthorized'
			}, { status: 401 })
		}

		// Get existing profile from Redis
		const existingProfile = await db.getProfile(id)

		if (!existingProfile) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Profile not found'
			}, { status: 404 })
		}

		// Check if user owns this profile
		if (existingProfile.userId !== userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Forbidden'
			}, { status: 403 })
		}

		// Update profile
		const updatedProfile: CreatorProfile = {
			...existingProfile,
			...body,
			updatedAt: new Date().toISOString()
		}

		// Save to Redis
		await db.setProfile(id, updatedProfile)

		return NextResponse.json<ApiResponse<CreatorProfile>>({
			success: true,
			message: 'Profile updated successfully',
			data: updatedProfile
		})

	} catch (error) {
		console.error('Update profile error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
