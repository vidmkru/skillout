import { Redis } from '@upstash/redis'
import type { User, Session, ProductionProfile, Invite, Rating, Subscription, AdminSettings } from '../types/database'

// Initialize Upstash Redis with existing environment variables
const redis = new Redis({
	url: process.env.BU_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
	token: process.env.BU_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

console.log('🔧 Upstash Redis initialized with:', {
	hasUrl: !!process.env.BU_KV_REST_API_URL || !!process.env.UPSTASH_REDIS_REST_URL,
	hasToken: !!process.env.BU_KV_REST_API_TOKEN || !!process.env.UPSTASH_REDIS_REST_TOKEN,
	env: process.env.NODE_ENV
})

// Redis key prefixes for different data types
export const KEY_PREFIXES = {
	USER: 'user:',
	USER_EMAIL: 'user_email:', // For email lookup
	SESSION: 'session:',
	PROFILE: 'profile:',
	INVITE: 'invite:',
	RATING: 'rating:',
	SUBSCRIPTION: 'subscription:',
	ADMIN_SETTINGS: 'admin_settings:',
} as const

// Utility functions for Redis operations
export const db = {
	// User operations
	async getUser(id: string): Promise<User | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.USER}${id}`)
			return data ? data as User : null
		} catch (error) {
			console.error('Redis getUser error:', error)
			return null
		}
	},

	async getUserByEmail(email: string): Promise<User | null> {
		try {
			const userId = await redis.get(`${KEY_PREFIXES.USER_EMAIL}${email.toLowerCase()}`)
			if (!userId) return null
			return await this.getUser(userId as string)
		} catch (error) {
			console.error('Redis getUserByEmail error:', error)
			return null
		}
	},

	async setUser(id: string, userData: User): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.USER}${id}`, userData, { ex: 86400 * 30 }) // 30 days
			// Also store email lookup
			if (userData.email) {
				await redis.set(`${KEY_PREFIXES.USER_EMAIL}${userData.email.toLowerCase()}`, id, { ex: 86400 * 30 })
			}
		} catch (error) {
			console.error('Redis setUser error:', error)
			throw error
		}
	},

	async deleteUser(id: string): Promise<void> {
		try {
			const user = await this.getUser(id)
			if (user?.email) {
				await redis.del(`${KEY_PREFIXES.USER_EMAIL}${user.email.toLowerCase()}`)
			}
			await redis.del(`${KEY_PREFIXES.USER}${id}`)
		} catch (error) {
			console.error('Redis deleteUser error:', error)
		}
	},

	// Session operations
	async getSession(sessionId: string): Promise<Session | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.SESSION}${sessionId}`)
			return data ? data as Session : null
		} catch (error) {
			console.error('Redis getSession error:', error)
			return null
		}
	},

	async setSession(sessionId: string, sessionData: Session): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.SESSION}${sessionId}`, sessionData, { ex: 86400 * 7 }) // 7 days
		} catch (error) {
			console.error('Redis setSession error:', error)
			throw error
		}
	},

	async deleteSession(sessionId: string): Promise<void> {
		try {
			await redis.del(`${KEY_PREFIXES.SESSION}${sessionId}`)
		} catch (error) {
			console.error('Redis deleteSession error:', error)
		}
	},

	// Profile operations
	async getProfile(id: string): Promise<ProductionProfile | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.PROFILE}${id}`)
			return data ? data as ProductionProfile : null
		} catch (error) {
			console.error('Redis getProfile error:', error)
			return null
		}
	},

	async setProfile(id: string, profileData: ProductionProfile): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.PROFILE}${id}`, profileData, { ex: 86400 * 30 })
		} catch (error) {
			console.error('Redis setProfile error:', error)
			throw error
		}
	},

	async getAllProfiles(): Promise<ProductionProfile[]> {
		try {
			const keys = await redis.keys(`${KEY_PREFIXES.PROFILE}*`)
			if (keys.length === 0) return []

			const profiles = await redis.mget(...keys)
			return profiles.filter((p): p is ProductionProfile => p !== null)
		} catch (error) {
			console.error('Redis getAllProfiles error:', error)
			return []
		}
	},

	// Invite operations
	async getInvite(code: string): Promise<Invite | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.INVITE}${code}`)
			return data ? data as Invite : null
		} catch (error) {
			console.error('Redis getInvite error:', error)
			return null
		}
	},

	async setInvite(code: string, inviteData: Invite): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.INVITE}${code}`, inviteData, { ex: 86400 * 30 })
		} catch (error) {
			console.error('Redis setInvite error:', error)
			throw error
		}
	},

	async deleteInvite(code: string): Promise<void> {
		try {
			await redis.del(`${KEY_PREFIXES.INVITE}${code}`)
		} catch (error) {
			console.error('Redis deleteInvite error:', error)
		}
	},

	async getAllInvites(): Promise<Invite[]> {
		try {
			const keys = await redis.keys(`${KEY_PREFIXES.INVITE}*`)
			if (keys.length === 0) return []

			const invites = await redis.mget(...keys)
			return invites.filter((i): i is Invite => i !== null)
		} catch (error) {
			console.error('Redis getAllInvites error:', error)
			return []
		}
	},

	async getInviteByCode(code: string): Promise<Invite | null> {
		try {
			const keys = await redis.keys(`${KEY_PREFIXES.INVITE}*`)
			if (keys.length === 0) return null

			const invites = await redis.mget(...keys)
			const invite = invites.find((i): i is Invite => i !== null && typeof i === 'object' && 'code' in i && i.code === code)
			return invite || null
		} catch (error) {
			console.error('Redis getInviteByCode error:', error)
			return null
		}
	},

	async getInvitesByUser(userId: string): Promise<Invite[]> {
		try {
			const keys = await redis.keys(`${KEY_PREFIXES.INVITE}*`)
			if (keys.length === 0) return []

			const invites = await redis.mget(...keys)
			return invites.filter((i): i is Invite => i !== null && typeof i === 'object' && 'createdBy' in i && i.createdBy === userId)
		} catch (error) {
			console.error('Redis getInvitesByUser error:', error)
			return []
		}
	},

	// Rating operations
	async getRating(profileId: string): Promise<Rating | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.RATING}${profileId}`)
			return data ? data as Rating : null
		} catch (error) {
			console.error('Redis getRating error:', error)
			return null
		}
	},

	async setRating(profileId: string, ratingData: Rating): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.RATING}${profileId}`, ratingData, { ex: 86400 * 30 })
		} catch (error) {
			console.error('Redis setRating error:', error)
			throw error
		}
	},

	// Subscription operations
	async getSubscription(userId: string): Promise<Subscription | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.SUBSCRIPTION}${userId}`)
			return data ? data as Subscription : null
		} catch (error) {
			console.error('Redis getSubscription error:', error)
			return null
		}
	},

	async setSubscription(userId: string, subscriptionData: Subscription): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.SUBSCRIPTION}${userId}`, subscriptionData, { ex: 86400 * 30 })
		} catch (error) {
			console.error('Redis setSubscription error:', error)
			throw error
		}
	},

	// Admin settings operations
	async getAdminSettings(): Promise<AdminSettings | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.ADMIN_SETTINGS}main`)
			return data ? data as AdminSettings : null
		} catch (error) {
			console.error('Redis getAdminSettings error:', error)
			return null
		}
	},

	async setAdminSettings(id: string, settingsData: AdminSettings): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.ADMIN_SETTINGS}${id}`, settingsData, { ex: 86400 * 30 })
		} catch (error) {
			console.error('Redis setAdminSettings error:', error)
			throw error
		}
	},

	// Get all users
	async getAllUsers(): Promise<User[]> {
		try {
			const keys = await redis.keys(`${KEY_PREFIXES.USER}*`)
			if (keys.length === 0) return []

			const users = await redis.mget(...keys)
			return users.filter((u): u is User => u !== null)
		} catch (error) {
			console.error('Redis getAllUsers error:', error)
			return []
		}
	},


}

// Health check function
export async function checkRedisConnection(): Promise<boolean> {
	try {
		await redis.ping()
		return true
	} catch (error) {
		console.error('Redis connection failed:', error)
		return false
	}
}

// Export redis instance for direct access if needed
export { redis }
