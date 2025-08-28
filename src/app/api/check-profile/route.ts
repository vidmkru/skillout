import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { ApiResponse, CreatorProfile, User } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('userId')

		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User ID is required'
			}, { status: 400 })
		}

		// Check if profile exists
		const profile = await db.getProfile(userId)

		// Check if user exists
		const user = await db.getUser(userId)

		return NextResponse.json<ApiResponse<{
			hasProfile: boolean
			hasUser: boolean
			profile: CreatorProfile | null
			user: User | null
		}>>({
			success: true,
			data: {
				hasProfile: !!profile,
				hasUser: !!user,
				profile,
				user
			}
		})

	} catch (error) {
		console.error('Check profile error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to check profile'
		}, { status: 500 })
	}
}
