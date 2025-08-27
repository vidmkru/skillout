import { NextRequest, NextResponse } from 'next/server'
import { getUserBySession } from '@/shared/auth/utils'
import type { ApiResponse, AuthResponse } from '@/shared/types/database'

export async function GET(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session')?.value

		if (!sessionToken) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'No session found'
			}, { status: 401 })
		}

		const user = await getUserBySession(sessionToken)

		if (!user) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid session'
			}, { status: 401 })
		}

		const authResponse: AuthResponse = {
			user,
			session: { id: sessionToken, userId: user.id, createdAt: '', expiresAt: '' },
			token: sessionToken,
		}

		return NextResponse.json<ApiResponse<AuthResponse>>({
			success: true,
			data: authResponse
		})

	} catch (error) {
		console.error('Get user error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
