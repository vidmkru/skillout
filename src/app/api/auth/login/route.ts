import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { createSession, createAuthResponse } from '@/shared/auth/utils'
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

		// Check if user exists
		const user = await db.getUserByEmail(email)

		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found. Please register first.'
			}, { status: 404 })
		}

		// Create session directly (demo mode - no email verification)
		const session = await createSession(user.id)
		const authResponse = createAuthResponse(user, session)

		console.log('✅ Login successful for:', email)

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
		console.error('Login error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
