import { NextResponse } from 'next/server'
import Redis from 'ioredis'

export async function GET() {
	try {
		console.log('🔍 Simple Redis test...')

		// Create a simple Redis connection
		const redis = new Redis(process.env.REDIS_URL!, {
			maxRetriesPerRequest: 1,
			connectTimeout: 5000,
			commandTimeout: 3000,
			tls: {
				rejectUnauthorized: false
			}
		})

		// Test connection
		console.log('📡 Testing connection...')
		const pingResult = await redis.ping()
		console.log('✅ PING result:', pingResult)

		// Test basic operations
		const testKey = 'test:simple'
		const testValue = 'Hello Redis!'

		await redis.set(testKey, testValue, 'EX', 60)
		console.log('✅ SET successful')

		const retrieved = await redis.get(testKey)
		console.log('✅ GET result:', retrieved)

		await redis.del(testKey)
		console.log('✅ DELETE successful')

		await redis.quit()
		console.log('✅ Connection closed')

		return NextResponse.json({
			status: 'success',
			message: 'Redis connection working!',
			ping: pingResult,
			test: {
				set: 'success',
				get: retrieved,
				delete: 'success'
			}
		})
	} catch (error) {
		console.error('❌ Simple Redis test error:', error)
		return NextResponse.json(
			{
				error: 'Redis connection failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}
