import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, SubscriptionTier, ExperienceLevel } from '@/shared/types/enums'
import { getFallbackUser, getFallbackSession } from '@/shared/db/fallback'
import type { User, CreatorProfile, ApiResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

// GET - List all users
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
			try {
				const session = await db.getSession(sessionToken)
				if (session) {
					user = await db.getUser(session.userId)
				}
			} catch (error) {
				const session = getFallbackSession(sessionToken)
				if (session) {
					user = getFallbackUser(session.userId)
				}
			}
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

		// Get all users
		let allUsers: User[] = []
		try {
			allUsers = await db.getAllUsers()
			console.log('Admin API: Users loaded from Redis:', allUsers.length)
		} catch (error) {
			console.error('Failed to load users from Redis:', error)
			allUsers = []
		}

		return NextResponse.json<ApiResponse<{ users: User[] }>>({
			success: true,
			data: { users: allUsers }
		})
	} catch (error) {
		console.error('Get admin users error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to fetch users'
		}, { status: 500 })
	}
}

// POST - Create new user
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
			try {
				const session = await db.getSession(sessionToken)
				if (session) {
					user = await db.getUser(session.userId)
				}
			} catch (error) {
				const session = getFallbackSession(sessionToken)
				if (session) {
					user = getFallbackUser(session.userId)
				}
			}
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
		const { email, role, name, bio, specialization, tools, clients, contacts } = body

		if (!email || !role) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Email and role are required'
			}, { status: 400 })
		}

		// Check if user already exists in Redis
		const existingUser = await db.getUserByEmail(email.toLowerCase())

		if (existingUser) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User with this email already exists'
			}, { status: 400 })
		}

		// Create new user
		const newUserId = `user-${Date.now()}`
		const newUser: User = {
			id: newUserId,
			email,
			role,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isVerified: true,
			subscriptionTier: role === UserRole.CreatorPro ? SubscriptionTier.CreatorPro : SubscriptionTier.Free,
			inviteQuota: { creator: 0, creatorPro: 0, producer: 0 },
			invitesUsed: { creator: 0, creatorPro: 0, producer: 0 },
			invitesCreated: []
		}

		// Save user to Redis
		try {
			await db.setUser(newUserId, newUser)
			console.log('Admin API: New user saved to Redis:', newUser.email)
		} catch (error) {
			console.error('Failed to save user to Redis:', error)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Failed to save user to database'
			}, { status: 500 })
		}

		// If it's a creator, create profile
		if (role === UserRole.Creator || role === UserRole.CreatorPro) {
			const now = new Date().toISOString()
			const creatorProfile: CreatorProfile = {
				id: newUserId,
				userId: newUserId,
				name: name || email.split('@')[0],
				bio: bio || 'Креативный специалист',
				avatar: undefined,
				specialization: specialization || ['Видеомонтаж'],
				tools: tools || ['Adobe Premiere Pro'],
				experience: ExperienceLevel.OneToTwo,
				clients: clients || [],
				portfolio: [],
				achievements: [],
				rating: 4.5,
				recommendations: [],
				badges: [],
				contacts: contacts || {
					telegram: '',
					instagram: '',
					behance: '',
					linkedin: ''
				},
				isPublic: true,
				isPro: role === UserRole.CreatorPro,
				createdAt: now,
				updatedAt: now
			}

			try {
				await db.setProfile(newUserId, creatorProfile)
				console.log(`✅ Profile created for creator ${email}`)
			} catch (error) {
				console.error(`❌ Failed to create profile for ${email}:`, error)
			}
		}

		return NextResponse.json<ApiResponse<{ user: User }>>({
			success: true,
			data: { user: newUser }
		})
	} catch (error) {
		console.error('Create user error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to create user'
		}, { status: 500 })
	}
}

// PUT - Update user
export async function PUT(request: NextRequest) {
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
			try {
				const session = await db.getSession(sessionToken)
				if (session) {
					user = await db.getUser(session.userId)
				}
			} catch (error) {
				const session = getFallbackSession(sessionToken)
				if (session) {
					user = getFallbackUser(session.userId)
				}
			}
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
		const { userId, updates } = body

		if (!userId || !updates) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User ID and updates are required'
			}, { status: 400 })
		}

		// Get existing user
		const existingUser = getFallbackUser(userId)
		if (!existingUser) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		// Update user
		const updatedUser: User = {
			...existingUser,
			...updates,
			updatedAt: new Date().toISOString()
		}

		// Update user in Redis
		try {
			await db.setUser(userId, updatedUser)
			console.log('Admin API: User updated in Redis:', updatedUser.email)
		} catch (error) {
			console.error('Failed to update user in Redis:', error)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Failed to update user in database'
			}, { status: 500 })
		}

		return NextResponse.json<ApiResponse<{ user: User }>>({
			success: true,
			data: { user: updatedUser }
		})
	} catch (error) {
		console.error('Update user error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to update user'
		}, { status: 500 })
	}
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
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
			try {
				const session = await db.getSession(sessionToken)
				if (session) {
					user = await db.getUser(session.userId)
				}
			} catch (error) {
				const session = getFallbackSession(sessionToken)
				if (session) {
					user = getFallbackUser(session.userId)
				}
			}
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

		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('userId')

		if (!userId) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User ID is required'
			}, { status: 400 })
		}

		// Get user from Redis to check if it exists and is not admin
		let userToDelete = null
		try {
			userToDelete = await db.getUser(userId)
		} catch (error) {
			console.error('Failed to get user from Redis:', error)
		}

		if (!userToDelete) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		// Allow deleting admin users (removed restriction)

		// Delete user from Redis
		try {
			await db.deleteUser(userId)
			console.log('Admin API: User deleted from Redis:', userToDelete.email)
		} catch (error) {
			console.error('Failed to delete user from Redis:', error)
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Failed to delete user from database'
			}, { status: 500 })
		}

		return NextResponse.json<ApiResponse<null>>({
			success: true,
			data: null
		})
	} catch (error) {
		console.error('Delete user error:', error)
		return NextResponse.json<ApiResponse<null>>({
			success: false,
			error: 'Failed to delete user'
		}, { status: 500 })
	}
}
