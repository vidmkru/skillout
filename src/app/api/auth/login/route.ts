import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { createSession, createAuthResponse } from '@/shared/auth/utils'
import { getFallbackUserByEmail, setFallbackSession } from '@/shared/db/fallback'
import type { ApiResponse, AuthResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json()

		if (!email) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Email is required'
			}, { status: 400 })
		}

		console.log('🔐 Login attempt for:', email)

		// Try to get user from Redis first, then fallback
		let user = null
		try {
			user = await db.getUserByEmail(email)
			console.log('✅ User found in Redis:', user ? 'yes' : 'no')
		} catch (error) {
			console.log('⚠️ Redis failed, checking fallback storage...')
			user = getFallbackUserByEmail(email)
			console.log('✅ User found in fallback:', user ? 'yes' : 'no')
		}

		if (!user) {
			console.log('❌ User not found:', email)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found. Please register first.'
			}, { status: 404 })
		}

		console.log('✅ User found:', user.email, user.role)

		// Create session
		let session
		try {
			session = await createSession(user.id)
			console.log('✅ Session created in Redis')
		} catch (error) {
			console.log('⚠️ Redis session failed, using fallback...')
			// Create session manually for fallback
			const sessionId = Math.random().toString(36).substring(2, 15)
			const now = new Date()
			const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
			
			session = {
				id: sessionId,
				userId: user.id,
				createdAt: now.toISOString(),
				expiresAt: expiresAt.toISOString(),
				userAgent: request.headers.get('user-agent') || undefined,
				ip: request.headers.get('x-forwarded-for') || request.ip || undefined,
			}
			
			setFallbackSession(sessionId, session)
			console.log('✅ Session created in fallback')
		}

		const authResponse = createAuthResponse(user, session)

		console.log('✅ Login successful for:', email, 'Session ID:', session.id)

		// Set session cookie
		const response = NextResponse.json<ApiResponse<AuthResponse>>({
			success: true,
			data: authResponse
		})

		response.cookies.set('session', session.id, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		})

		return response

	} catch (error) {
		console.error('❌ Login error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
