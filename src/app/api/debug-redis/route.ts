import { NextResponse } from 'next/server'
import { redis } from '@/shared/db/redis'

export async function GET() {
	try {
		console.log('🔍 Testing Redis connection...')
		console.log('Redis config:', {
			REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
			REDIS_HOST: process.env.REDIS_HOST,
			REDIS_PORT: process.env.REDIS_PORT,
		})

		// Test basic ping
		console.log('📡 Sending PING to Redis...')
		const pingResult = await redis.ping()
		console.log('✅ PING result:', pingResult)

		// Test basic operations
		console.log('📝 Testing SET operation...')
		const testKey = 'test:debug'
		const testValue = {
			message: 'Redis is working!',
			timestamp: new Date().toISOString(),
			env: process.env.NODE_ENV
		}

		await redis.set(testKey, JSON.stringify(testValue), 'EX', 60)
		console.log('✅ SET operation successful')

		console.log('📖 Testing GET operation...')
		const retrieved = await redis.get(testKey)
		console.log('✅ GET result:', retrieved)

		// Test parsing
		const parsed = retrieved ? JSON.parse(retrieved) : null
		console.log('✅ Parsed result:', parsed)

		// Clean up
		await redis.del(testKey)
		console.log('🧹 Cleaned up test key')

		return NextResponse.json({
			status: 'success',
			message: 'Redis connection working perfectly!',
			ping: pingResult,
			test: {
				set: 'success',
				get: parsed,
				cleanup: 'success'
			},
			config: {
				hasRedisUrl: !!process.env.REDIS_URL,
				hasRedisHost: !!process.env.REDIS_HOST,
				env: process.env.NODE_ENV
			}
		})
	} catch (error) {
		console.error('❌ Redis debug error:', error)
		return NextResponse.json(
			{
				error: 'Redis connection failed',
				details: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				config: {
					hasRedisUrl: !!process.env.REDIS_URL,
					hasRedisHost: !!process.env.REDIS_HOST,
					env: process.env.NODE_ENV
				}
			},
			{ status: 500 }
		)
	}
}
