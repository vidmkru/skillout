import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/shared/db/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const redisStatus = await redis.ping()

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
