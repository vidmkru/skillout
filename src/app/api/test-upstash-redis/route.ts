import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/shared/db/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		console.log('🔍 Testing Upstash Redis connection...')

		// Test basic ping
		console.log('📡 Testing PING...')
		const pingResult = await redis.ping()
		console.log('✅ PING result:', pingResult)

		// Test basic operations
		const testKey = 'test:upstash'
		const testValue = {
			message: 'Upstash Redis is working!',
			timestamp: new Date().toISOString(),
			env: process.env.NODE_ENV
		}

		console.log('📝 Testing SET...')
		await redis.set(testKey, testValue, { ex: 60 })
		console.log('✅ SET successful')

		console.log('📖 Testing GET...')
		const retrieved = await redis.get(testKey)
		console.log('✅ GET result:', retrieved)

		console.log('🗑️ Testing DELETE...')
		await redis.del(testKey)
		console.log('✅ DELETE successful')

		return NextResponse.json({
			status: 'success',
			message: 'Upstash Redis connection working!',
			ping: pingResult,
			test: {
				set: 'success',
				get: retrieved,
				delete: 'success'
			},
			config: {
				hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
				hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
				env: process.env.NODE_ENV
			}
		})
	} catch (error) {
		console.error('💥 Upstash Redis test error:', error)
		return NextResponse.json(
			{
				error: 'Upstash Redis connection failed',
				details: error instanceof Error ? error.message : 'Unknown error',
				suggestions: [
					'Check UPSTASH_REDIS_REST_URL',
					'Check UPSTASH_REDIS_REST_TOKEN',
					'Verify Upstash Redis credentials'
				]
			},
			{ status: 500 }
		)
	}
}
