import { NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, SubscriptionTier, ExperienceLevel } from '@/shared/types/enums'
import type { User, ProductionProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST() {
	try {
		console.log('🔧 Initializing data in Redis...')
		const now = new Date().toISOString()

		// Create test users
		const testUsers: User[] = [
			{
				id: 'admin-test-123',
				email: 'admin@skillout.pro',
				role: UserRole.Admin,
				createdAt: now,
				updatedAt: now,
				isVerified: true,
				subscriptionTier: SubscriptionTier.Free,
				inviteQuota: { creator: 1000, production: 500, producer: 2000 },
				invitesUsed: { creator: 0, production: 0, producer: 0 },
				invitesCreated: [],
				quotaLastReset: now
			},
			{
				id: 'user-1',
				email: 'alexey@example.com',
				role: UserRole.Production,
				createdAt: now,
				updatedAt: now,
				isVerified: true,
				subscriptionTier: SubscriptionTier.Production,
				inviteQuota: { creator: 10, production: 2, producer: 20 },
				invitesUsed: { creator: 0, production: 0, producer: 0 },
				invitesCreated: [],
				quotaLastReset: now
			},
			{
				id: 'user-2',
				email: 'maria@example.com',
				role: UserRole.Production,
				createdAt: now,
				updatedAt: now,
				isVerified: true,
				subscriptionTier: SubscriptionTier.Production,
				inviteQuota: { creator: 10, production: 2, producer: 20 },
				invitesUsed: { creator: 0, production: 0, producer: 0 },
				invitesCreated: [],
				quotaLastReset: now
			},
			{
				id: 'user-3',
				email: 'dmitry@example.com',
				role: UserRole.Creator,
				createdAt: now,
				updatedAt: now,
				isVerified: true,
				subscriptionTier: SubscriptionTier.Free,
				inviteQuota: { creator: 2, production: 0, producer: 5 },
				invitesUsed: { creator: 0, production: 0, producer: 0 },
				invitesCreated: [],
				quotaLastReset: now
			}
		]

		// Create creator profiles
		const productionfiles: ProductionProfile[] = [
			{
				id: 'user-1',
				userId: 'user-1',
				name: 'Алексей Петров',
				bio: 'Опытный видеомонтажер с 5-летним стажем. Специализируюсь на рекламных роликах и музыкальных клипах.',
				avatar: undefined,
				specialization: ['Видеомонтаж', 'Цветокоррекция', 'Анимация'],
				tools: ['Adobe Premiere Pro', 'After Effects', 'DaVinci Resolve'],
				experience: ExperienceLevel.TwoPlus,
				clients: ['Nike', 'Adidas', 'Coca-Cola'],
				portfolio: [
					{ id: 'user-1-1', title: 'Реклама Nike', videoUrl: 'https://example.com/video1', thumbnail: undefined, tags: ['реклама', 'спорт'], createdAt: now },
					{ id: 'user-1-2', title: 'Музыкальный клип', videoUrl: 'https://example.com/video2', thumbnail: undefined, tags: ['музыка', 'клип'], createdAt: now }
				],
				achievements: [],
				rating: 4.8,
				recommendations: [],
				badges: [],
				contacts: {
					telegram: '@alexey_editor',
					instagram: '@alexey_creative',
					behance: 'alexey-petrov',
					linkedin: 'alexey-petrov-editor'
				},
				isPublic: true,
				isPro: true,
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'user-2',
				userId: 'user-2',
				name: 'Мария Сидорова',
				bio: 'Креативный директор и оператор. Создаю уникальный визуальный контент для брендов.',
				avatar: undefined,
				specialization: ['Операторская работа', 'Креативное направление', 'Съемка'],
				tools: ['Sony FX6', 'Canon C300', 'Adobe Creative Suite'],
				experience: ExperienceLevel.TwoPlus,
				clients: ['Apple', 'Samsung', 'Tesla'],
				portfolio: [
					{ id: 'user-2-1', title: 'Apple Commercial', videoUrl: 'https://example.com/video3', thumbnail: undefined, tags: ['реклама', 'технологии'], createdAt: now },
					{ id: 'user-2-2', title: 'Tesla Promo', videoUrl: 'https://example.com/video4', thumbnail: undefined, tags: ['автомобили', 'промо'], createdAt: now }
				],
				achievements: [],
				rating: 4.9,
				recommendations: [],
				badges: [],
				contacts: {
					telegram: '@maria_director',
					instagram: '@maria_creative',
					behance: 'maria-sidorova',
					linkedin: 'maria-sidorova-director'
				},
				isPublic: true,
				isPro: true,
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'user-3',
				userId: 'user-3',
				name: 'Дмитрий Козлов',
				bio: 'Молодой талантливый видеомонтажер. Создаю качественный контент для социальных сетей.',
				avatar: undefined,
				specialization: ['Социальные сети', 'Короткие видео', 'Монтаж'],
				tools: ['Adobe Premiere Pro', 'After Effects', 'CapCut'],
				experience: ExperienceLevel.OneToTwo,
				clients: ['Instagram Influencers', 'TikTok Creators'],
				portfolio: [
					{ id: 'user-3-1', title: 'TikTok Viral', videoUrl: 'https://example.com/video5', thumbnail: undefined, tags: ['tiktok', 'viral'], createdAt: now },
					{ id: 'user-3-2', title: 'Instagram Reel', videoUrl: 'https://example.com/video6', thumbnail: undefined, tags: ['instagram', 'reel'], createdAt: now }
				],
				achievements: [],
				rating: 4.5,
				recommendations: [],
				badges: [],
				contacts: {
					telegram: '@dmitry_editor',
					instagram: '@dmitry_creative',
					behance: 'dmitry-kozlov',
					linkedin: 'dmitry-kozlov-editor'
				},
				isPublic: true,
				isPro: false,
				createdAt: now,
				updatedAt: now
			}
		]

		// Save users to Redis
		for (const user of testUsers) {
			try {
				await db.setUser(user.id, user)
				console.log(`✅ User ${user.email} saved to Redis`)
			} catch (error) {
				console.error(`❌ Failed to save user ${user.email} to Redis:`, error)
			}
		}

		// Save profiles to Redis
		for (const profile of productionfiles) {
			try {
				await db.setProfile(profile.id, profile)
				console.log(`✅ Profile ${profile.name} saved to Redis`)
			} catch (error) {
				console.error(`❌ Failed to save profile ${profile.name} to Redis:`, error)
			}
		}

		console.log('✅ Data initialization completed')

		return NextResponse.json<ApiResponse<{ users: number; profiles: number }>>({
			success: true,
			data: {
				users: testUsers.length,
				profiles: productionfiles.length
			},
			message: 'Data initialized successfully in Redis'
		})

	} catch (error) {
		console.error('❌ Data initialization error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to initialize data'
		}, { status: 500 })
	}
}
