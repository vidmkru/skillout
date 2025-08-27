import { NextRequest, NextResponse } from 'next/server'
import { redis, checkRedisConnection } from '@/shared/db/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		// Test Redis connection
		const isConnected = await checkRedisConnection()

		if (!isConnected) {
			return NextResponse.json(
				{ error: 'Redis connection failed' },
				{ status: 500 }
			)
		}

		// Test basic operations
		const testKey = 'test:connection'
		const testValue = { message: 'Hello from Redis!', timestamp: Date.now() }

		await redis.set(testKey, testValue, { ex: 60 }) // 1 minute TTL
		const retrieved = await redis.get(testKey)

		return NextResponse.json({
			status: 'success',
			message: 'Redis connection working',
			test: {
				set: 'success',
				get: retrieved
			}
		})
	} catch (error) {
		console.error('Redis test error:', error)
		return NextResponse.json(
			{ error: 'Redis test failed', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
