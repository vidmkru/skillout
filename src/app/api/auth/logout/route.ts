import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/shared/auth/utils'
import type { ApiResponse } from '@/shared/types/database'

export async function POST(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session')?.value

		if (sessionToken) {
			await deleteSession(sessionToken)
		}

		const response = NextResponse.json<ApiResponse<{ message: string }>>({
			success: true,
			message: 'Logged out successfully',
			data: { message: 'Logged out successfully' }
		})

		// Clear session cookie
		response.cookies.set('session', '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0,
			path: '/'
		})

		return response

	} catch (error) {
		console.error('Logout error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
