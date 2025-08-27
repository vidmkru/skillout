import Redis from 'ioredis'
import type { User, Session, CreatorProfile, Invite, Rating, Subscription, AdminSettings } from '../types/database'

// Redis connection configuration
const redisConfig = process.env.REDIS_URL
	? {
		url: process.env.REDIS_URL,
		retryDelayOnFailover: 100,
		maxRetriesPerRequest: 1,
		lazyConnect: true,
		connectTimeout: 10000,
		commandTimeout: 5000,
		tls: {
			rejectUnauthorized: false
		},
		reconnectOnError: (err: Error) => {
			console.log('🔄 Redis reconnect on error:', err.message)
			return true
		}
	}
	: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379'),
		password: process.env.REDIS_PASSWORD,
		db: parseInt(process.env.REDIS_DB || '0'),
		retryDelayOnFailover: 100,
		maxRetriesPerRequest: 1,
		lazyConnect: true,
		connectTimeout: 10000,
		commandTimeout: 5000,
	}

console.log('🔧 Redis config:', {
	hasRedisUrl: !!process.env.REDIS_URL,
	redisUrl: process.env.REDIS_URL ? `${process.env.REDIS_URL.substring(0, 20)}...` : 'NOT SET',
	env: process.env.NODE_ENV,
	config: process.env.REDIS_URL ? 'Using REDIS_URL' : 'Using separate config'
})

// Create Redis client instance
export const redis = new Redis(redisConfig)

// Handle Redis connection events
redis.on('connect', () => {
	console.log('✅ Redis connected successfully')
})

redis.on('error', (error) => {
	console.error('❌ Redis connection error:', error.message)
})

redis.on('ready', () => {
	console.log('🚀 Redis is ready to accept commands')
})

redis.on('close', () => {
	console.log('🔌 Redis connection closed')
})

redis.on('reconnecting', () => {
	console.log('🔄 Redis reconnecting...')
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
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Redis getUser error:', error)
			return null
		}
	},

	async getUserByEmail(email: string): Promise<User | null> {
		try {
			const userId = await redis.get(`${KEY_PREFIXES.USER_EMAIL}${email.toLowerCase()}`)
			if (!userId) return null
			return await this.getUser(userId)
		} catch (error) {
			console.error('Redis getUserByEmail error:', error)
			return null
		}
	},

	async setUser(id: string, userData: User): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.USER}${id}`, JSON.stringify(userData), 'EX', 86400 * 30)
			if (userData.email) {
				await redis.set(`${KEY_PREFIXES.USER_EMAIL}${userData.email.toLowerCase()}`, id, 'EX', 86400 * 30)
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
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Redis getSession error:', error)
			return null
		}
	},

	async setSession(sessionId: string, sessionData: Session): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.SESSION}${sessionId}`, JSON.stringify(sessionData), 'EX', 86400 * 7)
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
	async getProfile(id: string): Promise<CreatorProfile | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.PROFILE}${id}`)
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Redis getProfile error:', error)
			return null
		}
	},

	async setProfile(id: string, profileData: CreatorProfile): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.PROFILE}${id}`, JSON.stringify(profileData), 'EX', 86400 * 30)
		} catch (error) {
			console.error('Redis setProfile error:', error)
			throw error
		}
	},

	async getAllProfiles(): Promise<CreatorProfile[]> {
		try {
			const keys = await redis.keys(`${KEY_PREFIXES.PROFILE}*`)
			if (keys.length === 0) return []

			const profiles = await redis.mget(...keys)
			return profiles.map(p => p ? JSON.parse(p) : null).filter(Boolean)
		} catch (error) {
			console.error('Redis getAllProfiles error:', error)
			return []
		}
	},

	// Invite operations
	async getInvite(code: string): Promise<Invite | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.INVITE}${code}`)
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Redis getInvite error:', error)
			return null
		}
	},

	async setInvite(code: string, inviteData: Invite): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.INVITE}${code}`, JSON.stringify(inviteData), 'EX', 86400 * 30)
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
			return invites.map(i => i ? JSON.parse(i) : null).filter(Boolean)
		} catch (error) {
			console.error('Redis getAllInvites error:', error)
			return []
		}
	},

	// Rating operations
	async getRating(profileId: string): Promise<Rating | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.RATING}${profileId}`)
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Redis getRating error:', error)
			return null
		}
	},

	async setRating(profileId: string, ratingData: Rating): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.RATING}${profileId}`, JSON.stringify(ratingData), 'EX', 86400 * 30)
		} catch (error) {
			console.error('Redis setRating error:', error)
			throw error
		}
	},

	// Subscription operations
	async getSubscription(userId: string): Promise<Subscription | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.SUBSCRIPTION}${userId}`)
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Redis getSubscription error:', error)
			return null
		}
	},

	async setSubscription(userId: string, subscriptionData: Subscription): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.SUBSCRIPTION}${userId}`, JSON.stringify(subscriptionData), 'EX', 86400 * 30)
		} catch (error) {
			console.error('Redis setSubscription error:', error)
			throw error
		}
	},

	// Admin settings operations
	async getAdminSettings(): Promise<AdminSettings | null> {
		try {
			const data = await redis.get(`${KEY_PREFIXES.ADMIN_SETTINGS}main`)
			return data ? JSON.parse(data) : null
		} catch (error) {
			console.error('Redis getAdminSettings error:', error)
			return null
		}
	},

	async setAdminSettings(id: string, settingsData: AdminSettings): Promise<void> {
		try {
			await redis.set(`${KEY_PREFIXES.ADMIN_SETTINGS}${id}`, JSON.stringify(settingsData), 'EX', 86400 * 30)
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
			return users.map(u => u ? JSON.parse(u) : null).filter(Boolean)
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

// Graceful shutdown
process.on('SIGINT', async () => {
	await redis.quit()
	process.exit(0)
})

process.on('SIGTERM', async () => {
	await redis.quit()
	process.exit(0)
})
