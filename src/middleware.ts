import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = [
	'/profile',
	'/admin',
	'/invite',
	'/subscriptions'
]

// Routes that should redirect to home if already authenticated
const authRoutes = [
	'/login',
	'/register'
]

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const sessionToken = request.cookies.get('session')?.value

	// Handle protected routes - just check for session token existence
	if (protectedRoutes.some(route => pathname.startsWith(route))) {
		if (!sessionToken) {
			const loginUrl = new URL('/login', request.url)
			loginUrl.searchParams.set('redirect', pathname)
			return NextResponse.redirect(loginUrl)
		}
	}

	// Handle auth routes (redirect if already logged in)
	if (authRoutes.some(route => pathname.startsWith(route)) && sessionToken) {
		return NextResponse.redirect(new URL('/', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!_next/static|_next/image|favicon.ico|public).*)',
	],
}
