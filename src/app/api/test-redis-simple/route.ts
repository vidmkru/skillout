import { NextResponse } from 'next/server'
import Redis from 'ioredis'

export async function GET() {
	try {
		console.log('🔍 Simple Redis test started')

		// Log environment
		console.log('📋 Environment:', {
			REDIS_URL: process.env.REDIS_URL ? `${process.env.REDIS_URL.substring(0, 30)}...` : 'NOT SET',
			NODE_ENV: process.env.NODE_ENV,
			hasRedisUrl: !!process.env.REDIS_URL
		})

		if (!process.env.REDIS_URL) {
			return NextResponse.json({
				status: 'error',
				message: 'REDIS_URL not set',
				suggestion: 'Set REDIS_URL environment variable'
			})
		}

		// Parse Redis URL
		let parsedUrl = null
		try {
			const url = new URL(process.env.REDIS_URL)
			parsedUrl = {
				protocol: url.protocol,
				hostname: url.hostname,
				port: url.port,
				username: url.username,
				hasPassword: !!url.password,
				pathname: url.pathname
			}
			console.log('🔗 Parsed Redis URL:', parsedUrl)
		} catch (error) {
			console.error('❌ Invalid Redis URL:', error)
			return NextResponse.json({
				status: 'error',
				message: 'Invalid Redis URL format',
				error: error instanceof Error ? error.message : 'Unknown error'
			})
		}

		// Create Redis connection with detailed config
		const redisConfig = {
			url: process.env.REDIS_URL,
			maxRetriesPerRequest: 1,
			connectTimeout: 5000,
			commandTimeout: 3000,
			tls: {
				rejectUnauthorized: false
			},
			retryDelayOnFailover: 100,
			lazyConnect: true
		}

		console.log('🔧 Redis config:', redisConfig)

		const redis = new Redis(redisConfig)

		// Add event listeners
		redis.on('connect', () => {
			console.log('✅ Redis connected')
		})

		redis.on('error', (error) => {
			console.error('❌ Redis error:', error.message)
		})

		redis.on('ready', () => {
			console.log('🚀 Redis ready')
		})

		redis.on('close', () => {
			console.log('🔌 Redis closed')
		})

		// Test connection
		console.log('📡 Testing PING...')
		const pingResult = await redis.ping()
		console.log('✅ PING result:', pingResult)

		// Test basic operations
		const testKey = 'test:simple'
		const testValue = { message: 'Hello Redis!', timestamp: Date.now() }

		console.log('📝 Testing SET...')
		await redis.set(testKey, JSON.stringify(testValue), 'EX', 60)
		console.log('✅ SET successful')

		console.log('📖 Testing GET...')
		const retrieved = await redis.get(testKey)
		console.log('✅ GET result:', retrieved)

		console.log('🗑️ Testing DELETE...')
		await redis.del(testKey)
		console.log('✅ DELETE successful')

		console.log('🔌 Closing connection...')
		await redis.quit()
		console.log('✅ Connection closed')

		return NextResponse.json({
			status: 'success',
			message: 'Redis connection working!',
			ping: pingResult,
			test: {
				set: 'success',
				get: retrieved ? JSON.parse(retrieved) : null,
				delete: 'success'
			},
			config: {
				parsedUrl,
				hasRedisUrl: !!process.env.REDIS_URL,
				env: process.env.NODE_ENV
			}
		})
	} catch (error) {
		console.error('💥 Redis test error:', error)
		console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')

		return NextResponse.json({
			status: 'error',
			message: 'Redis connection failed',
			error: error instanceof Error ? error.message : 'Unknown error',
			suggestions: [
				'Check REDIS_URL format',
				'Verify Redis Cloud credentials',
				'Check network connectivity',
				'Try with TLS disabled'
			]
		}, { status: 500 })
	}
}
