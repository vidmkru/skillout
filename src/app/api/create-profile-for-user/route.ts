import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { ExperienceLevel, UserRole } from '@/shared/types/enums'
import type { CreatorProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { userId } = body

		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User ID is required'
			}, { status: 400 })
		}

		// Get user to check if they exist and are a creator
		const user = await db.getUser(userId)
		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		// Check if user is a creator
		if (user.role !== UserRole.Creator && user.role !== UserRole.CreatorPro) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User is not a creator'
			}, { status: 400 })
		}

		// Check if profile already exists
		const existingProfile = await db.getProfile(userId)
		if (existingProfile) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Profile already exists for this user'
			}, { status: 400 })
		}

		const now = new Date().toISOString()

		// Create profile
		const profile: CreatorProfile = {
			id: userId,
			userId: userId,
			name: user.email.split('@')[0], // Use email prefix as name
			bio: 'Креативный специалист',
			avatar: undefined,
			specialization: ['Видеомонтаж'],
			tools: ['Adobe Premiere Pro'],
			experience: ExperienceLevel.OneToTwo,
			clients: [],
			portfolio: [],
			achievements: [],
			rating: 4.5,
			recommendations: [],
			badges: [],
			contacts: {
				telegram: '',
				instagram: '',
				behance: '',
				linkedin: ''
			},
			isPublic: true,
			isPro: user.role === UserRole.CreatorPro,
			createdAt: now,
			updatedAt: now
		}

		// Save profile to Redis
		await db.setProfile(userId, profile)
		console.log(`✅ Profile created for user ${user.email}`)

		return NextResponse.json<ApiResponse<{ profile: CreatorProfile }>>({
			success: true,
			data: { profile },
			message: 'Profile created successfully'
		})

	} catch (error) {
		console.error('Create profile error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to create profile'
		}, { status: 500 })
	}
}
