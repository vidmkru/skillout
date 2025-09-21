import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { ApiResponse, Subscription } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Unauthorized'
			}, { status: 401 })
		}

		const subscription = await db.getSubscription(userId)

		if (!subscription) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Subscription not found'
			}, { status: 404 })
		}

		return NextResponse.json<ApiResponse<Subscription>>({
			success: true,
			data: subscription
		})

	} catch (error) {
		console.error('Get subscription error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json()
		const { tier } = body

		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Unauthorized'
			}, { status: 401 })
		}

		if (!tier || !['free', 'producer', 'production'].includes(tier)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid subscription tier'
			}, { status: 400 })
		}

		const existingSubscription = await db.getSubscription(userId)
		const now = new Date().toISOString()

		// Create or update subscription
		const subscription: Subscription = {
			userId,
			tier,
			status: 'active',
			startsAt: existingSubscription?.startsAt || now,
			expiresAt: existingSubscription?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
			autoRenew: existingSubscription?.autoRenew || false,
		}

		await db.setSubscription(userId, subscription)

		// Update user's subscription tier
		const user = await db.getUser(userId)
		if (user) {
			user.subscriptionTier = tier
			user.updatedAt = now
			await db.setUser(userId, user)
		}

		return NextResponse.json<ApiResponse<Subscription>>({
			success: true,
			message: 'Subscription updated successfully',
			data: subscription
		})

	} catch (error) {
		console.error('Update subscription error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
