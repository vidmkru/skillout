import { NextResponse } from 'next/server'
import { redis } from '@/shared/db/redis'

export async function GET() {
	try {
		console.log('🔍 Simple Redis test...')

		// Test connection
		console.log('📡 Testing connection...')
		const pingResult = await redis.ping()
		console.log('✅ PING result:', pingResult)

		// Test basic operations
		const testKey = 'test:simple'
		const testValue = 'Hello Redis!'

		await redis.set(testKey, testValue, { ex: 60 })
		console.log('✅ SET successful')

		const retrieved = await redis.get(testKey)
		console.log('✅ GET result:', retrieved)

		await redis.del(testKey)
		console.log('✅ DELETE successful')

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
