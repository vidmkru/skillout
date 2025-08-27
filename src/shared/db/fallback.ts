import type { User, Session, CreatorProfile, Invite, Rating, Subscription, AdminSettings } from '../types/database'

// Fallback storage for when Redis is unavailable
export const fallbackUsers = new Map<string, User>()
export const fallbackSessions = new Map<string, Session>()
export const fallbackProfiles = new Map<string, CreatorProfile>()
export const fallbackInvites = new Map<string, Invite>()
export const fallbackRatings = new Map<string, Rating>()
export const fallbackSubscriptions = new Map<string, Subscription>()

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
	return fallbackUsers.get(id) || null
}

export function setFallbackUser(id: string, user: User): void {
	fallbackUsers.set(id, user)
}

export function getFallbackSession(id: string): Session | null {
	return fallbackSessions.get(id) || null
}

export function setFallbackSession(id: string, session: Session): void {
	fallbackSessions.set(id, session)
}

export function deleteFallbackSession(id: string): void {
	fallbackSessions.delete(id)
}
