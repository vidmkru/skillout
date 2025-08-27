import { NextResponse } from 'next/server'
import { checkRedisConnection } from '@/shared/db/redis'

export async function GET() {
	try {
		const redisStatus = await checkRedisConnection()

		return NextResponse.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			services: {
				redis: redisStatus ? 'connected' : 'disconnected'
			},
			environment: {
				nodeEnv: process.env.NODE_ENV,
				hasRedisUrl: !!process.env.REDIS_URL,
				hasRedisHost: !!process.env.REDIS_HOST
			}
		})
	} catch (error) {
		console.error('Health check error:', error)
		return NextResponse.json(
			{
				status: 'error',
				message: 'Health check failed',
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}
