import type { User, Session, CreatorProfile, Invite, Rating, Subscription, AdminSettings } from '../types/database'
import { UserRole, SubscriptionTier, ExperienceLevel, InviteType } from '../types/enums'

// Fallback storage for when Redis is unavailable
// Use global variables to persist data between requests
declare global {
	var __fallbackUsers: Map<string, User> | undefined
	var __fallbackSessions: Map<string, Session> | undefined
	var __fallbackProfiles: Map<string, CreatorProfile> | undefined
	var __fallbackInvites: Map<string, Invite> | undefined
	var __fallbackRatings: Map<string, Rating> | undefined
	var __fallbackSubscriptions: Map<string, Subscription> | undefined
}

export const fallbackUsers = globalThis.__fallbackUsers || (globalThis.__fallbackUsers = new Map<string, User>())
export const fallbackSessions = globalThis.__fallbackSessions || (globalThis.__fallbackSessions = new Map<string, Session>())
export const fallbackProfiles = globalThis.__fallbackProfiles || (globalThis.__fallbackProfiles = new Map<string, CreatorProfile>())
export const fallbackInvites = globalThis.__fallbackInvites || (globalThis.__fallbackInvites = new Map<string, Invite>())
export const fallbackRatings = globalThis.__fallbackRatings || (globalThis.__fallbackRatings = new Map<string, Rating>())
export const fallbackSubscriptions = globalThis.__fallbackSubscriptions || (globalThis.__fallbackSubscriptions = new Map<string, Subscription>())



// Initialize test users with profile data for creators
const testUsers: User[] = [
	{
		id: 'admin-test-123',
		email: 'admin@skillout.pro',
		role: UserRole.Admin,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isVerified: true,
		subscriptionTier: SubscriptionTier.Free,
		inviteQuota: { creator: 1000, creatorPro: 500, producer: 2000 },
		invitesUsed: { creator: 0, creatorPro: 0, producer: 0 },
		invitesCreated: []
	},
	{
		id: 'user-1',
		email: 'alexey@example.com',
		role: UserRole.CreatorPro,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isVerified: true,
		subscriptionTier: SubscriptionTier.CreatorPro,
		inviteQuota: { creator: 10, creatorPro: 2, producer: 20 },
		invitesUsed: { creator: 0, creatorPro: 0, producer: 0 },
		invitesCreated: []
	},
	{
		id: 'user-2',
		email: 'maria@example.com',
		role: UserRole.CreatorPro,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isVerified: true,
		subscriptionTier: SubscriptionTier.CreatorPro,
		inviteQuota: { creator: 10, creatorPro: 2, producer: 20 },
		invitesUsed: { creator: 0, creatorPro: 0, producer: 0 },
		invitesCreated: []
	},
	{
		id: 'user-3',
		email: 'dmitry@example.com',
		role: UserRole.Creator,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isVerified: true,
		subscriptionTier: SubscriptionTier.Free,
		inviteQuota: { creator: 2, creatorPro: 0, producer: 5 },
		invitesUsed: { creator: 0, creatorPro: 0, producer: 0 },
		invitesCreated: []
	}
]

// Create profiles for creator users (Creator and CreatorPro roles)
const creatorProfiles: CreatorProfile[] = [
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
			{ id: 'user-1-1', title: 'Реклама Nike', videoUrl: 'https://example.com/video1', thumbnail: undefined, tags: ['реклама', 'спорт'], createdAt: new Date().toISOString() },
			{ id: 'user-1-2', title: 'Музыкальный клип', videoUrl: 'https://example.com/video2', thumbnail: undefined, tags: ['музыка', 'клип'], createdAt: new Date().toISOString() }
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
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'user-2',
		userId: 'user-2',
		name: 'Мария Сидорова',
		bio: 'Креативный директор и оператор. Создаю уникальный визуальный контент для брендов.',
		avatar: undefined,
		specialization: ['Операторская работа', 'Креативное направление', 'Съемка'],
		tools: ['Sony FX3', 'Canon R5', 'Adobe Creative Suite'],
		experience: ExperienceLevel.TwoPlus,
		clients: ['Apple', 'Samsung', 'McDonald\'s'],
		portfolio: [
			{ id: 'user-2-1', title: 'Apple iPhone 15', videoUrl: 'https://example.com/video3', thumbnail: undefined, tags: ['реклама', 'технологии'], createdAt: new Date().toISOString() },
			{ id: 'user-2-2', title: 'McDonald\'s Campaign', videoUrl: 'https://example.com/video4', thumbnail: undefined, tags: ['реклама', 'еда'], createdAt: new Date().toISOString() }
		],
		achievements: [],
		rating: 4.9,
		recommendations: [],
		badges: [],
		contacts: {
			telegram: '@maria_creative',
			instagram: '@maria_visual',
			behance: 'maria-sidorova',
			linkedin: 'maria-sidorova-creative'
		},
		isPublic: true,
		isPro: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'user-3',
		userId: 'user-3',
		name: 'Дмитрий Козлов',
		bio: 'Специалист по 3D анимации и визуальным эффектам. Создаю потрясающие визуальные решения.',
		avatar: undefined,
		specialization: ['3D Анимация', 'VFX', 'Моделирование'],
		tools: ['Blender', 'Cinema 4D', 'Houdini'],
		experience: ExperienceLevel.TwoPlus,
		clients: ['Marvel', 'Disney', 'Netflix'],
		portfolio: [
			{ id: 'user-3-1', title: 'Marvel VFX', videoUrl: 'https://example.com/video5', thumbnail: undefined, tags: ['vfx', 'кино'], createdAt: new Date().toISOString() },
			{ id: 'user-3-2', title: 'Disney Animation', videoUrl: 'https://example.com/video6', thumbnail: undefined, tags: ['анимация', 'мультфильм'], createdAt: new Date().toISOString() }
		],
		achievements: [],
		rating: 4.7,
		recommendations: [],
		badges: [],
		contacts: {
			telegram: '@dmitry_3d',
			instagram: '@dmitry_vfx',
			behance: 'dmitry-kozlov',
			linkedin: 'dmitry-kozlov-vfx'
		},
		isPublic: true,
		isPro: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
]

// Initialize fallback data only once
let isInitialized = false

export function initializeFallbackData() {
	if (isInitialized) {
		console.log('🔧 Fallback data already initialized')
		return
	}

	console.log('🔧 Initializing fallback data...')

	// Add test users to fallback storage
	testUsers.forEach(user => {
		fallbackUsers.set(user.id, user)
	})

	// Create admin user with the actual session ID
	const actualAdminUser: User = {
		id: '60b18c0b03c5980d334e1893852a9124', // This is the actual session ID
		email: 'admin@skillout.pro',
		role: UserRole.Admin,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isVerified: true,
		subscriptionTier: SubscriptionTier.Free,
		inviteQuota: { creator: 1000, creatorPro: 500, producer: 2000 },
		invitesUsed: { creator: 0, creatorPro: 0, producer: 0 },
		invitesCreated: []
	}
	fallbackUsers.set(actualAdminUser.id, actualAdminUser)

	// Create session for the actual admin user
	const actualAdminSession = {
		id: 'session-60b18c0b03c5980d334e1893852a9124',
		userId: '60b18c0b03c5980d334e1893852a9124',
		createdAt: new Date().toISOString(),
		expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
	}
	fallbackSessions.set(actualAdminSession.id, actualAdminSession)

	isInitialized = true
	console.log('🔧 Fallback data initialized successfully')
}

// Add test invite for admin
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skillout-o7c7.vercel.app'
const testInvite: Invite = {
	id: 'invite-test-123',
	code: 'TEST123456789ABCDEF',
	type: InviteType.Creator,
	createdBy: 'admin-test-123',
	createdAt: new Date().toISOString(),
	expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
	status: 'active',
	qrCode: `${baseUrl}/register?code=TEST123456789ABCDEF&type=creator`
}
fallbackInvites.set(testInvite.id, testInvite)

// Reset admin user's invite usage for testing
const adminUser = fallbackUsers.get('admin-test-123')
if (adminUser) {
	adminUser.invitesUsed = { creator: 0, creatorPro: 0, producer: 0 }
	adminUser.invitesCreated = []
	fallbackUsers.set('admin-test-123', adminUser)
}

// Add test admin session
const testAdminSession = {
	id: 'session-admin-test-123',
	userId: 'admin-test-123',
	createdAt: new Date().toISOString(),
	expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
}
fallbackSessions.set(testAdminSession.id, testAdminSession)

// Add creator profiles to fallback storage
creatorProfiles.forEach((profile: CreatorProfile) => {
	fallbackProfiles.set(profile.id, profile)
})

// Fallback admin settings
export const fallbackAdminSettings: AdminSettings = {
	id: 'admin-settings',
	inviteQuotas: {
		admin: {
			creator: 100,
			creatorPro: 50,
			producer: 200
		},
		creator: {
			creator: 5,
			creatorPro: 0,
			producer: 10
		},
		creatorPro: {
			creator: 10,
			creatorPro: 2,
			producer: 20
		}
	},
	paywallSettings: {
		contactInfo: true,
		portfolioDetails: true,
		recommendations: true,
		achievements: true
	},
	updatedAt: new Date().toISOString()
}

// Helper functions for fallback storage
export function getFallbackUserByEmail(email: string): User | null {
	const users = Array.from(fallbackUsers.values())
	for (const user of users) {
		if (user.email.toLowerCase() === email.toLowerCase()) {
			return user
		}
	}
	return null
}

export function getFallbackUser(id: string): User | null {
	initializeFallbackData()
	console.log('🔧 getFallbackUser called with id:', id)
	const user = fallbackUsers.get(id) || null
	console.log('🔧 getFallbackUser result:', user ? 'found' : 'not found')
	return user
}

export function setFallbackUser(id: string, user: User): void {
	initializeFallbackData()
	console.log('🔧 setFallbackUser called with:', { id, user: { ...user, invitesCreated: user.invitesCreated?.length || 0 } })
	fallbackUsers.set(id, user)
	console.log('🔧 Total users in fallback after set:', fallbackUsers.size)
}

export function getFallbackSession(id: string): Session | null {
	initializeFallbackData()
	return fallbackSessions.get(id) || null
}

export function setFallbackSession(id: string, session: Session): void {
	fallbackSessions.set(id, session)
}

export function deleteFallbackSession(id: string): void {
	fallbackSessions.delete(id)
}

// Invite functions
export function getFallbackInvite(id: string): Invite | null {
	return fallbackInvites.get(id) || null
}

export function setFallbackInvite(id: string, invite: Invite): void {
	console.log('🔧 setFallbackInvite called with:', { id, invite })
	fallbackInvites.set(id, invite)
	console.log('🔧 Total invites in fallback after set:', fallbackInvites.size)
}

export function getFallbackInvitesByUser(userId: string): Invite[] {
	initializeFallbackData()
	console.log('🔧 getFallbackInvitesByUser called for userId:', userId)
	console.log('🔧 Total invites in fallback:', fallbackInvites.size)
	const invites = Array.from(fallbackInvites.values())
	console.log('🔧 All invites in fallback:', invites.map(inv => ({ id: inv.id, createdBy: inv.createdBy, code: inv.code })))
	const userInvites = invites.filter(invite => invite.createdBy === userId)
	console.log('🔧 User invites found for userId', userId, ':', userInvites.map(inv => ({ id: inv.id, code: inv.code })))
	return userInvites
}

export function updateFallbackInvite(inviteId: string, updates: Partial<Invite>): void {
	const invite = fallbackInvites.get(inviteId)
	if (invite) {
		fallbackInvites.set(inviteId, { ...invite, ...updates })
	}
}

export function getFallbackInviteByCode(code: string): Invite | null {
	const invites = Array.from(fallbackInvites.values())
	return invites.find(invite => invite.code === code) || null
}

// User management functions
export function deleteFallbackUser(id: string): void {
	fallbackUsers.delete(id)
}

// Profile management functions
export function createCreatorProfile(userId: string, profileData: {
	name: string
	bio: string
	specialization: string[]
	tools: string[]
	clients: string[]
	contacts: {
		telegram: string
		instagram: string
		behance: string
		linkedin: string
	}
}): void {
	const user = getFallbackUser(userId)
	if (!user) return

	const profile: CreatorProfile = {
		id: userId,
		userId: userId,
		name: profileData.name,
		bio: profileData.bio,
		avatar: undefined,
		specialization: profileData.specialization,
		tools: profileData.tools,
		experience: ExperienceLevel.TwoPlus,
		clients: profileData.clients,
		portfolio: [],
		achievements: [],
		rating: 0,
		recommendations: [],
		badges: [],
		contacts: profileData.contacts,
		isPublic: true,
		isPro: user.role === UserRole.CreatorPro,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}

	fallbackProfiles.set(userId, profile)
}
