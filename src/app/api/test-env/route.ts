import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const redisUrl = process.env.REDIS_URL

		console.log('🔍 Environment check:')
		console.log('REDIS_URL:', redisUrl)
		console.log('NODE_ENV:', process.env.NODE_ENV)

		// Parse Redis URL to check if it's valid
		let parsedUrl = null
		if (redisUrl) {
			try {
				const url = new URL(redisUrl)
				parsedUrl = {
					protocol: url.protocol,
					hostname: url.hostname,
					port: url.port,
					username: url.username,
					password: url.password ? '***' : undefined,
					pathname: url.pathname
				}
			} catch (error) {
				console.error('❌ Invalid Redis URL:', error)
			}
		}

		return NextResponse.json({
			status: 'success',
			env: {
				NODE_ENV: process.env.NODE_ENV,
				hasRedisUrl: !!redisUrl,
				redisUrlLength: redisUrl?.length || 0,
				parsedUrl
			}
		})
	} catch (error) {
		console.error('❌ Environment test error:', error)
		return NextResponse.json(
			{ error: 'Environment test failed' },
			{ status: 500 }
		)
	}
}
