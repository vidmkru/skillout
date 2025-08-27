import { NextRequest, NextResponse } from 'next/server'
import { getUserBySession } from '@/shared/auth/utils'
import { getFallbackSession, getFallbackUser } from '@/shared/db/fallback'
import type { ApiResponse, AuthResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session')?.value

		if (!sessionToken) {
			console.log('❌ No session token found')
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'No session found'
			}, { status: 401 })
		}

		console.log('🔍 Checking session:', sessionToken)

		// Try to get user from Redis first, then fallback
		let user = null
		let session = null

		try {
			user = await getUserBySession(sessionToken)
			console.log('✅ User found in Redis:', user ? 'yes' : 'no')
		} catch (error) {
			console.log('⚠️ Redis failed, checking fallback...')
			session = getFallbackSession(sessionToken)
			if (session) {
				user = getFallbackUser(session.userId)
				console.log('✅ User found in fallback:', user ? 'yes' : 'no')
			}
		}

		if (!user) {
			console.log('❌ Invalid session or user not found')
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid session'
			}, { status: 401 })
		}

		console.log('✅ User authenticated:', user.email, user.role)

		const authResponse: AuthResponse = {
			user,
			session: session || { id: sessionToken, userId: user.id, createdAt: '', expiresAt: '' },
			token: sessionToken,
		}

		return NextResponse.json<ApiResponse<AuthResponse>>({
			success: true,
			data: authResponse
		})

	} catch (error) {
		console.error('❌ Get user error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
