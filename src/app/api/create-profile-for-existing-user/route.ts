import { NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { ExperienceLevel } from '@/shared/types/enums'
import type { CreatorProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST() {
	try {
		console.log('🔧 Creating profile for existing user babijonchik@mail.ru...')
		const now = new Date().toISOString()
		const userId = 'user-1756403002448-48pgsrpmh'

		// Create profile for existing user
		const productionfile: CreatorProfile = {
			id: userId,
			userId: userId,
			name: 'Babijonchik',
			bio: 'Креативный специалист по видеомонтажу и созданию контента',
			avatar: undefined,
			specialization: ['Видеомонтаж', 'Создание контента', 'Социальные сети'],
			tools: ['Adobe Premiere Pro', 'After Effects', 'CapCut'],
			experience: ExperienceLevel.OneToTwo,
			clients: ['Personal Projects', 'Social Media'],
			portfolio: [
				{
					id: 'portfolio-1',
					title: 'Демо проект',
					videoUrl: 'https://example.com/demo',
					thumbnail: undefined,
					tags: ['демо', 'видео'],
					createdAt: now
				}
			],
			achievements: [],
			rating: 4.5,
			recommendations: [],
			badges: [],
			contacts: {
				telegram: '@babijonchik',
				instagram: '@babijonchik_creative',
				behance: 'babijonchik',
				linkedin: 'babijonchik-creative'
			},
			isPublic: true,
			isPro: false,
			createdAt: now,
			updatedAt: now
		}

		// Save profile to Redis
		try {
			await db.setProfile(userId, productionfile)
			console.log(`✅ Profile created for user ${userId}`)
		} catch (error) {
			console.error(`❌ Failed to create profile for ${userId}:`, error)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Failed to create profile in Redis'
			}, { status: 500 })
		}

		console.log('✅ Profile creation completed')

		return NextResponse.json<ApiResponse<{ profile: CreatorProfile }>>({
			success: true,
			data: { profile: productionfile },
			message: 'Profile created successfully for existing user'
		})

	} catch (error) {
		console.error('❌ Profile creation error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to create profile'
		}, { status: 500 })
	}
}
