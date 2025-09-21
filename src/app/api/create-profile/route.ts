import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { ExperienceLevel } from '@/shared/types/enums'
import type { ProductionProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { userId, name, bio, specialization, tools, clients, contacts } = body

		if (!userId || !name) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User ID and name are required'
			}, { status: 400 })
		}

		// Check if user exists
		const user = await db.getUser(userId)
		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
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
		const profile: ProductionProfile = {
			id: userId,
			userId: userId,
			name: name,
			bio: bio || 'Креативный специалист',
			avatar: undefined,
			specialization: specialization || ['Видеомонтаж'],
			tools: tools || ['Adobe Premiere Pro'],
			experience: ExperienceLevel.OneToTwo,
			clients: clients || [],
			portfolio: [],
			achievements: [],
			rating: 4.5,
			recommendations: [],
			badges: [],
			contacts: contacts || {
				telegram: '',
				instagram: '',
				behance: '',
				linkedin: ''
			},
			isPublic: true,
			isPro: false,
			createdAt: now,
			updatedAt: now
		}

		// Save profile to Redis
		await db.setProfile(userId, profile)
		console.log(`✅ Profile created for user ${userId}: ${name}`)

		return NextResponse.json<ApiResponse<{ profile: ProductionProfile }>>({
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
