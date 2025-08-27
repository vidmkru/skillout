import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/shared/auth/utils'
import { deleteFallbackSession } from '@/shared/db/fallback'
import type { ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session')?.value

		if (sessionToken) {
			// Delete session from Redis
			try {
				await deleteSession(sessionToken)
			} catch (error) {
				// Delete from fallback storage
				deleteFallbackSession(sessionToken)
			}
		}

		// Clear session cookie
		const response = NextResponse.json<ApiResponse<{ message: string }>>({
			success: true,
			data: { message: 'Logged out successfully' }
		})

		response.cookies.set('session', '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0 // Expire immediately
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
