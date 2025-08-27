import Redis from 'ioredis'
import type { User, Session, CreatorProfile, Invite, Rating, Subscription } from '../types/database'

// Redis connection configuration
const redisConfig = process.env.REDIS_URL
	? { url: process.env.REDIS_URL }
	: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379'),
		password: process.env.REDIS_PASSWORD,
		db: parseInt(process.env.REDIS_DB || '0'),
		retryDelayOnFailover: 100,
		maxRetriesPerRequest: 3,
		lazyConnect: true,
	}

// Create Redis client instance
export const redis = new Redis(redisConfig)

// Redis key prefixes for different data types
export const KEY_PREFIXES = {
	USER: 'user:',
	USER_EMAIL: 'user_email:', // For email lookup
	SESSION: 'session:',
	PROFILE: 'profile:',
	INVITE: 'invite:',
	RATING: 'rating:',
	SUBSCRIPTION: 'subscription:',
} as const

// Utility functions for Redis operations
export const db = {
	// User operations
	async getUser(id: string): Promise<User | null> {
		const data = await redis.get(`${KEY_PREFIXES.USER}${id}`)
		return data ? JSON.parse(data) : null
	},

	async getUserByEmail(email: string): Promise<User | null> {
		const userId = await redis.get(`${KEY_PREFIXES.USER_EMAIL}${email.toLowerCase()}`)
		if (!userId) return null
		return await this.getUser(userId)
	},

	async setUser(id: string, userData: User): Promise<void> {
		await redis.set(`${KEY_PREFIXES.USER}${id}`, JSON.stringify(userData), 'EX', 86400 * 30) // 30 days
		// Also store email lookup
		if (userData.email) {
			await redis.set(`${KEY_PREFIXES.USER_EMAIL}${userData.email.toLowerCase()}`, id, 'EX', 86400 * 30)
		}
	},

	async deleteUser(id: string): Promise<void> {
		const user = await this.getUser(id)
		if (user?.email) {
			await redis.del(`${KEY_PREFIXES.USER_EMAIL}${user.email.toLowerCase()}`)
		}
		await redis.del(`${KEY_PREFIXES.USER}${id}`)
	},

	// Session operations
	async getSession(sessionId: string): Promise<Session | null> {
		const data = await redis.get(`${KEY_PREFIXES.SESSION}${sessionId}`)
		return data ? JSON.parse(data) : null
	},

	async setSession(sessionId: string, sessionData: Session): Promise<void> {
		await redis.set(`${KEY_PREFIXES.SESSION}${sessionId}`, JSON.stringify(sessionData), 'EX', 86400 * 7) // 7 days
	},

	async deleteSession(sessionId: string): Promise<void> {
		await redis.del(`${KEY_PREFIXES.SESSION}${sessionId}`)
	},

	// Profile operations
	async getProfile(id: string): Promise<CreatorProfile | null> {
		const data = await redis.get(`${KEY_PREFIXES.PROFILE}${id}`)
		return data ? JSON.parse(data) : null
	},

	async setProfile(id: string, profileData: CreatorProfile): Promise<void> {
		await redis.set(`${KEY_PREFIXES.PROFILE}${id}`, JSON.stringify(profileData), 'EX', 86400 * 30)
	},

	async getAllProfiles(): Promise<CreatorProfile[]> {
		const keys = await redis.keys(`${KEY_PREFIXES.PROFILE}*`)
		if (keys.length === 0) return []

		const profiles = await redis.mget(...keys)
		return profiles.map(p => p ? JSON.parse(p) : null).filter(Boolean)
	},

	// Invite operations
	async getInvite(code: string): Promise<Invite | null> {
		const data = await redis.get(`${KEY_PREFIXES.INVITE}${code}`)
		return data ? JSON.parse(data) : null
	},

	async setInvite(code: string, inviteData: Invite): Promise<void> {
		await redis.set(`${KEY_PREFIXES.INVITE}${code}`, JSON.stringify(inviteData), 'EX', 86400 * 30)
	},

	async deleteInvite(code: string): Promise<void> {
		await redis.del(`${KEY_PREFIXES.INVITE}${code}`)
	},

	async getAllInvites(): Promise<Invite[]> {
		const keys = await redis.keys(`${KEY_PREFIXES.INVITE}*`)
		if (keys.length === 0) return []

		const invites = await redis.mget(...keys)
		return invites.map(i => i ? JSON.parse(i) : null).filter(Boolean)
	},

	// Rating operations
	async getRating(profileId: string): Promise<Rating | null> {
		const data = await redis.get(`${KEY_PREFIXES.RATING}${profileId}`)
		return data ? JSON.parse(data) : null
	},

	async setRating(profileId: string, ratingData: Rating): Promise<void> {
		await redis.set(`${KEY_PREFIXES.RATING}${profileId}`, JSON.stringify(ratingData), 'EX', 86400 * 30)
	},

	// Subscription operations
	async getSubscription(userId: string): Promise<Subscription | null> {
		const data = await redis.get(`${KEY_PREFIXES.SUBSCRIPTION}${userId}`)
		return data ? JSON.parse(data) : null
	},

	async setSubscription(userId: string, subscriptionData: Subscription): Promise<void> {
		await redis.set(`${KEY_PREFIXES.SUBSCRIPTION}${userId}`, JSON.stringify(subscriptionData), 'EX', 86400 * 30)
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

// Graceful shutdown
process.on('SIGINT', async () => {
	await redis.quit()
	process.exit(0)
})

process.on('SIGTERM', async () => {
	await redis.quit()
	process.exit(0)
})
