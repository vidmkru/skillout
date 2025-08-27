import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { verifyMagicLinkToken, createSession, createAuthResponse } from '@/shared/auth/utils'
import type { ApiResponse, AuthResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const email = searchParams.get('email')
		const token = searchParams.get('token')

		if (!email || !token) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Missing email or token'
			}, { status: 400 })
		}

		// Verify magic link token
		if (!verifyMagicLinkToken(email, token)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid or expired token'
			}, { status: 400 })
		}

		// Get user
		const user = await db.getUserByEmail(email)
		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		// Create session
		const userAgent = request.headers.get('user-agent')
		const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
		const session = await createSession(user.id, userAgent || undefined, ip)

		// Create auth response
		const authResponse = createAuthResponse(user, session)

		// Set session cookie
		const response = NextResponse.json<ApiResponse<AuthResponse>>({
			success: true,
			data: authResponse
		})

		response.cookies.set('session', session.id, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60, // 7 days
			path: '/'
		})

		return response

	} catch (error) {
		console.error('Verify error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
