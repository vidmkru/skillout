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
		admin: 100,
		creator: 5,
		'creator-pro': 10,
		producer: 0
	},
	registrationEnabled: true,
	maintenanceMode: false,
	updatedAt: new Date().toISOString()
}

// Helper functions for fallback storage
export function getFallbackUserByEmail(email: string): User | null {
	for (const user of fallbackUsers.values()) {
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
