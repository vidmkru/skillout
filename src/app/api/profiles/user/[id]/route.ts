import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, ExperienceLevel } from '@/shared/types/enums'
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

			// Check if user exists and create profile if needed
			const user = await db.getUser(userId)
			if (!user) {
				return NextResponse.json<ApiResponse<null>>({
					success: false,
					message: 'User not found'
				}, { status: 404 })
			}

			// If user is a creator or production, create a default profile
			if (user.role === UserRole.Creator || user.role === UserRole.Production) {
				console.log('🔧 Creating default profile for user:', userId)
				const now = new Date().toISOString()
				const defaultProfile: ProductionProfile = {
					id: userId,
					userId: userId,
					name: user.email.split('@')[0],
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
					isPro: user.role === 'production',
					createdAt: now,
					updatedAt: now
				}

				await db.setProfile(userId, defaultProfile)
				console.log('✅ Default profile created for user:', userId)

				return NextResponse.json<ApiResponse<ProductionProfile>>({
					success: true,
					data: defaultProfile
				})
			}

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
