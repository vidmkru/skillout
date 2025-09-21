import type { User, Session, CreatorProfile, Invite, Rating, Subscription, AdminSettings } from '../types/database'
import { UserRole, SubscriptionTier, ExperienceLevel } from '../types/enums'

// Fallback storage for when Redis is unavailable
// Use global variables to persist data between requests
declare global {
	// eslint-disable-next-line no-var
	var __fallbackUsers: Map<string, User> | undefined
	// eslint-disable-next-line no-var
	var __fallbackSessions: Map<string, Session> | undefined
	// eslint-disable-next-line no-var
	var __fallbackProfiles: Map<string, CreatorProfile> | undefined
	// eslint-disable-next-line no-var
	var __fallbackInvites: Map<string, Invite> | undefined
	// eslint-disable-next-line no-var
	var __fallbackRatings: Map<string, Rating> | undefined
	// eslint-disable-next-line no-var
	var __fallbackSubscriptions: Map<string, Subscription> | undefined
}

export const fallbackUsers = globalThis.__fallbackUsers || (globalThis.__fallbackUsers = new Map<string, User>())
export const fallbackSessions = globalThis.__fallbackSessions || (globalThis.__fallbackSessions = new Map<string, Session>())
export const fallbackProfiles = globalThis.__fallbackProfiles || (globalThis.__fallbackProfiles = new Map<string, CreatorProfile>())
export const fallbackInvites = globalThis.__fallbackInvites || (globalThis.__fallbackInvites = new Map<string, Invite>())
export const fallbackRatings = globalThis.__fallbackRatings || (globalThis.__fallbackRatings = new Map<string, Rating>())
export const fallbackSubscriptions = globalThis.__fallbackSubscriptions || (globalThis.__fallbackSubscriptions = new Map<string, Subscription>())



// Initialize only admin user in fallback
const testUsers: User[] = [
	{
		id: 'admin-test-123',
		email: 'admin@skillout.pro',
		role: UserRole.Admin,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isVerified: true,
		subscriptionTier: SubscriptionTier.Free,
		inviteQuota: { creator: 1000, production: 500, producer: 2000 },
		invitesUsed: { creator: 0, production: 0, producer: 0 },
		invitesCreated: [],
		quotaLastReset: new Date().toISOString()
	}
]

// No profiles in fallback - all profiles will be loaded from Redis
const productionfiles: CreatorProfile[] = []

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
		inviteQuota: { creator: 1000, production: 500, producer: 2000 },
		invitesUsed: { creator: 0, production: 0, producer: 0 },
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

// No test invites in fallback - all invites will be loaded from Redis

// Reset admin user's invite usage for testing
const adminUser = fallbackUsers.get('admin-test-123')
if (adminUser) {
	adminUser.invitesUsed = { creator: 0, production: 0, producer: 0 }
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
productionfiles.forEach((profile: CreatorProfile) => {
	fallbackProfiles.set(profile.id, profile)
})

// Fallback admin settings
export const fallbackAdminSettings: AdminSettings = {
	id: 'admin-settings',
	inviteQuotas: {
		admin: {
			creator: 100,
			production: 50,
			producer: 200
		},
		creator: {
			creator: 5,
			production: 0,
			producer: 10
		},
		production: {
			creator: 10,
			production: 2,
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
	const users = Array.from(fallbackUsers.values()) as User[]
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
	const invites = Array.from(fallbackInvites.values()) as Invite[]
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
	const invites = Array.from(fallbackInvites.values()) as Invite[]
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

export function setFallbackProfile(id: string, profile: CreatorProfile): void {
	fallbackProfiles.set(id, profile)
}
