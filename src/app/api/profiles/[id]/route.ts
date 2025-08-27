import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { ApiResponse, CreatorProfile } from '@/shared/types/database'

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params

		if (!id) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Profile ID is required'
			}, { status: 400 })
		}

		const profile = await db.getProfile(id)

		if (!profile) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Profile not found'
			}, { status: 404 })
		}

		// Check if profile is public
		if (!profile.isPublic) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Profile is not public'
			}, { status: 403 })
		}

		return NextResponse.json<ApiResponse<CreatorProfile>>({
			success: true,
			data: profile
		})

	} catch (error) {
		console.error('Get profile error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
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
