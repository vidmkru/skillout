import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateMagicLinkUrl, isValidEmail, checkRateLimit } from '@/shared/auth/utils'
import type { LoginRequest, ApiResponse } from '@/shared/types/database'

export async function POST(request: NextRequest) {
	try {
		const body: LoginRequest = await request.json()
		const { email } = body

		// Validate email
		if (!email || !isValidEmail(email)) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Invalid email address'
			}, { status: 400 })
		}

		// Rate limiting
		const rateLimitKey = `login:${email}`
		if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Too many login attempts. Please try again later.'
			}, { status: 429 })
		}

		// Check if user exists
		const existingUser = await db.getUserByEmail(email)

		if (!existingUser) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found. Please register first.'
			}, { status: 404 })
		}

		// Generate magic link
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
		const magicLink = generateMagicLinkUrl(email, baseUrl)

		// In production, send email here
		if (process.env.NODE_ENV === 'development') {
			console.log('Magic link for development:', magicLink)
		}

		// TODO: Send email with magic link
		// await sendMagicLinkEmail(email, magicLink)

		return NextResponse.json<ApiResponse<{ message: string }>>({
			success: true,
			message: 'Magic link sent to your email',
			data: {
				message: process.env.NODE_ENV === 'development'
					? `Development mode: ${magicLink}`
					: 'Check your email for the login link'
			}
		})

	} catch (error) {
		console.error('Login error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Internal server error'
		}, { status: 500 })
	}
}
