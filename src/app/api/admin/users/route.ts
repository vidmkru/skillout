import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { UserRole, SubscriptionTier } from '@/shared/types/enums'
import { getFallbackUser, getFallbackSession, fallbackUsers, setFallbackUser, deleteFallbackUser } from '@/shared/db/fallback'
import type { User, ApiResponse } from '@/shared/types/database'

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
		let allUsers = []
		try {
			allUsers = await db.getAllUsers()
		} catch (error) {
			// Fallback to memory storage
			console.log('🔍 Admin Users API: Using fallback storage...')
			allUsers = Array.from(fallbackUsers.values())
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

		// Check if user already exists
		const existingUsers = Array.from(fallbackUsers.values())
		const existingUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase())

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
			invitesUsed: { creator: 0, creatorPro: 0, producer: 0 }
		}

		// Add user to fallback storage
		setFallbackUser(newUserId, newUser)

		// If it's a creator, create profile
		if (role === UserRole.Creator || role === UserRole.CreatorPro) {
			const { createCreatorProfile } = await import('@/shared/db/fallback')
			createCreatorProfile(newUserId, {
				name: name || 'Новый креатор',
				bio: bio || 'Описание креатора',
				specialization: specialization || ['Креатив'],
				tools: tools || ['Adobe Creative Suite'],
				clients: clients || ['Клиент'],
				contacts: contacts || {
					telegram: '',
					instagram: '',
					behance: '',
					linkedin: ''
				}
			})
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

		setFallbackUser(userId, updatedUser)

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

		// Prevent deleting admin users
		const userToDelete = getFallbackUser(userId)
		if (!userToDelete) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'User not found'
			}, { status: 404 })
		}

		if (userToDelete.role === UserRole.Admin) {
			return NextResponse.json<ApiResponse<null>>({
				success: false,
				error: 'Cannot delete admin users'
			}, { status: 400 })
		}

		// Delete user
		deleteFallbackUser(userId)

		// Also delete profile if exists
		const { fallbackProfiles } = await import('@/shared/db/fallback')
		fallbackProfiles.delete(userId)

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
