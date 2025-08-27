import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, SubscriptionTier } from '@/shared/types/enums'
import { generateToken } from '@/shared/auth/utils'
import { getFallbackUser, setFallbackUser, getFallbackSession, getFallbackUserByEmail, fallbackUsers } from '@/shared/db/fallback'
import type { User, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

// GET - List all users with filtering and pagination
export async function GET(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session')?.value

		if (!sessionToken) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Authentication required'
			}, { status: 401 })
		}

		// Get user from session
		let user = null
		try {
			user = await db.getUserBySession(sessionToken)
		} catch (error) {
			const session = getFallbackSession(sessionToken)
			if (session) {
				user = getFallbackUser(session.userId)
			}
		}

		if (!user || user.role !== UserRole.Admin) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Admin access required'
			}, { status: 403 })
		}

		// Get query parameters
		const { searchParams } = new URL(request.url)
		const role = searchParams.get('role')
		const search = searchParams.get('search')
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '20')
		const sortBy = searchParams.get('sortBy') || 'createdAt'
		const sortOrder = searchParams.get('sortOrder') || 'desc'

		// Get all users
		let allUsers: User[] = []
		try {
			allUsers = await db.getAllUsers()
		} catch (error) {
			// Fallback to memory storage
			allUsers = Array.from(fallbackUsers.values())
		}

		// Apply filters
		let filteredUsers = allUsers

		if (role && role !== 'all') {
			filteredUsers = filteredUsers.filter(u => u.role === role)
		}

		if (search) {
			const searchLower = search.toLowerCase()
			filteredUsers = filteredUsers.filter(u =>
				u.email.toLowerCase().includes(searchLower)
			)
		}

		// Apply sorting
		filteredUsers.sort((a, b) => {
			const aValue = a[sortBy as keyof User]
			const bValue = b[sortBy as keyof User]

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortOrder === 'asc'
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue)
			}

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
			}

			return 0
		})

		// Apply pagination
		const startIndex = (page - 1) * limit
		const endIndex = startIndex + limit
		const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

		// Calculate statistics
		const totalUsers = filteredUsers.length
		const totalPages = Math.ceil(totalUsers / limit)
		const usersByRole = {
			admin: allUsers.filter(u => u.role === UserRole.Admin).length,
			creator: allUsers.filter(u => u.role === UserRole.Creator).length,
			creatorPro: allUsers.filter(u => u.role === UserRole.CreatorPro).length,
			producer: allUsers.filter(u => u.role === UserRole.Producer).length
		}

		return NextResponse.json<ApiResponse<{
			users: User[]
			pagination: {
				page: number
				limit: number
				total: number
				totalPages: number
			}
			stats: {
				totalUsers: number
				usersByRole: typeof usersByRole
			}
		}>>({
			success: true,
			data: {
				users: paginatedUsers,
				pagination: {
					page,
					limit,
					total: totalUsers,
					totalPages
				},
				stats: {
					totalUsers: allUsers.length,
					usersByRole
				}
			}
		})

	} catch (error) {
		console.error('Get users error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to fetch users'
		}, { status: 500 })
	}
}

// POST - Create user manually
export async function POST(request: NextRequest) {
	try {
		const sessionToken = request.cookies.get('session')?.value

		if (!sessionToken) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Authentication required'
			}, { status: 401 })
		}

		// Get user from session
		let user = null
		try {
			user = await db.getUserBySession(sessionToken)
		} catch (error) {
			const session = getFallbackSession(sessionToken)
			if (session) {
				user = getFallbackUser(session.userId)
			}
		}

		if (!user || user.role !== UserRole.Admin) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Admin access required'
			}, { status: 403 })
		}

		const body = await request.json()
		const { email, role, isVerified = true } = body

		if (!email || !role) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Email and role are required'
			}, { status: 400 })
		}

		// Check if user already exists
		let existingUser = null
		try {
			existingUser = await db.getUserByEmail(email)
		} catch (error) {
			existingUser = getFallbackUserByEmail(email)
		}

		if (existingUser) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User with this email already exists'
			}, { status: 409 })
		}

		// Create new user
		const now = new Date().toISOString()
		const userId = generateToken(16)

		// Set initial invite quotas based on role
		const getInitialQuota = (userRole: UserRole) => {
			switch (userRole) {
				case UserRole.Admin:
					return { creator: 50, creatorPro: 20, producer: 100 }
				case UserRole.CreatorPro:
					return { creator: 5, creatorPro: 2, producer: 10 }
				case UserRole.Creator:
					return { creator: 2, creatorPro: 0, producer: 5 }
				case UserRole.Producer:
					return { creator: 0, creatorPro: 0, producer: 0 }
				default:
					return { creator: 0, creatorPro: 0, producer: 0 }
			}
		}

		const newUser: User = {
			id: userId,
			email: email.toLowerCase(),
			role,
			createdAt: now,
			updatedAt: now,
			isVerified,
			subscriptionTier: SubscriptionTier.Free,
			inviteQuota: getInitialQuota(role),
			invitesUsed: { creator: 0, creatorPro: 0, producer: 0 }
		}

		// Save user
		try {
			await db.setUser(userId, newUser)
		} catch (error) {
			setFallbackUser(userId, newUser)
		}

		return NextResponse.json<ApiResponse<User>>({
			success: true,
			data: newUser,
			message: 'User created successfully'
		})

	} catch (error) {
		console.error('Create user error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to create user'
		}, { status: 500 })
	}
}
