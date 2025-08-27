import { randomBytes, createHash } from 'crypto'
import { db } from '../db/redis'
import type { User, Session, AuthResponse } from '../types/database'

// Generate secure random token
export function generateToken(length: number = 32): string {
	return randomBytes(length).toString('hex')
}

// Generate session ID
export function generateSessionId(): string {
	return generateToken(16)
}

// Hash email for magic link token
export function hashEmail(email: string): string {
	return createHash('sha256').update(email.toLowerCase()).digest('hex')
}

// Generate magic link token
export function generateMagicLinkToken(email: string): string {
	const timestamp = Date.now().toString()
	const hash = hashEmail(email)
	return createHash('sha256').update(`${hash}:${timestamp}:${process.env.MAGIC_LINK_SECRET || 'default'}`).digest('hex')
}

// Verify magic link token
export function verifyMagicLinkToken(email: string, token: string): boolean {
	try {
		const hash = hashEmail(email)
		const now = Date.now()

		// Check recent timestamps (within 15 minutes)
		for (let i = 0; i < 10; i++) {
			const timestamp = (now - i * 60000).toString() // Check last 10 minutes
			const expectedToken = createHash('sha256')
				.update(`${hash}:${timestamp}:${process.env.MAGIC_LINK_SECRET || 'default'}`)
				.digest('hex')

			if (token === expectedToken) {
				return true
			}
		}

		return false
	} catch {
		return false
	}
}

// Create user session
export async function createSession(userId: string, userAgent?: string, ip?: string): Promise<Session> {
	const sessionId = generateSessionId()
	const now = new Date()
	const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

	const session: Session = {
		id: sessionId,
		userId,
		createdAt: now.toISOString(),
		expiresAt: expiresAt.toISOString(),
		userAgent,
		ip,
	}

	await db.setSession(sessionId, session)
	return session
}

// Get session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
	const session = await db.getSession(sessionId)

	if (!session) return null

	// Check if session is expired
	if (new Date(session.expiresAt) < new Date()) {
		await db.deleteSession(sessionId)
		return null
	}

	return session
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
	await db.deleteSession(sessionId)
}

// Get user by session
export async function getUserBySession(sessionId: string): Promise<User | null> {
	const session = await getSession(sessionId)
	if (!session) return null

	return await db.getUser(session.userId)
}

// Create auth response
export function createAuthResponse(user: User, session: Session): AuthResponse {
	return {
		user,
		session,
		token: session.id, // Using session ID as token for simplicity
	}
}

// Validate email format
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

// Generate magic link URL
export function generateMagicLinkUrl(email: string, baseUrl: string): string {
	const token = generateMagicLinkToken(email)
	return `${baseUrl}/auth/verify?email=${encodeURIComponent(email)}&token=${token}`
}

// Rate limiting utilities
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now()
	const record = rateLimitStore.get(key)

	if (!record || now > record.resetTime) {
		rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
		return true
	}

	if (record.count >= limit) {
		return false
	}

	record.count++
	return true
}

// Clean up expired rate limit records every minute
setInterval(() => {
	const now = Date.now()
	const entries = Array.from(rateLimitStore.entries())
	for (const [key, record] of entries) {
		if (now > record.resetTime) {
			rateLimitStore.delete(key)
		}
	}
}, 60000)

// Password utilities (for future use)
export function hashPassword(password: string): string {
	return createHash('sha256').update(password + (process.env.PASSWORD_SALT || 'default')).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
	return hashPassword(password) === hash
}
