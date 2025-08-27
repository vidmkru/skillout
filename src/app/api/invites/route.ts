import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import { generateToken } from '@/shared/auth/utils'
import { InviteType, UserRole } from '@/shared/types/enums'
import type { Invite } from '@/shared/types/database'

export async function GET(request: NextRequest) {
	try {
		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const user = await db.getUser(userId)
		if (!user) {
			return NextResponse.json(
				{ error: 'User not found' },
				{ status: 404 }
			)
		}

		// Get user's invite quota and usage
		const quota = user.inviteQuota
		const used = user.invitesUsed

		// Get user's issued invites
		const allInvites = await db.getAllInvites()
		const userInvites = allInvites.filter(invite => invite.issuedBy === userId)

		return NextResponse.json({
			quota,
			used,
			available: {
				creator: quota.creator - used.creator,
				creatorPro: quota.creatorPro - used.creatorPro,
				producer: quota.producer - used.producer
			},
			invites: userInvites
		})
	} catch (error) {
		console.error('Get invites error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch invites' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { inviteType } = body

		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const user = await db.getUser(userId)
		if (!user) {
			return NextResponse.json(
				{ error: 'User not found' },
				{ status: 404 }
			)
		}

		// Validate invite type
		if (!Object.values(InviteType).includes(inviteType)) {
			return NextResponse.json(
				{ error: 'Invalid invite type' },
				{ status: 400 }
			)
		}

		// Check if user has quota for this invite type
		const inviteTypeKey = inviteType as keyof typeof user.inviteQuota
		if (user.invitesUsed[inviteTypeKey] >= user.inviteQuota[inviteTypeKey]) {
			return NextResponse.json(
				{ error: 'No invites available for this type' },
				{ status: 403 }
			)
		}

		// Check role permissions
		const canIssueInvite = (issuerRole: UserRole, targetType: InviteType) => {
			switch (issuerRole) {
				case UserRole.Admin:
					return true // Admin can issue any type
				case UserRole.CreatorPro:
					return targetType === InviteType.Creator || targetType === InviteType.Producer
				case UserRole.Creator:
					return targetType === InviteType.Creator || targetType === InviteType.Producer
				case UserRole.Producer:
					return false // Producers cannot issue invites
				default:
					return false
			}
		}

		if (!canIssueInvite(user.role, inviteType)) {
			return NextResponse.json(
				{ error: 'You cannot issue this type of invite' },
				{ status: 403 }
			)
		}

		// Generate invite code
		const inviteCode = generateToken(8).toUpperCase()
		const now = new Date().toISOString()
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

		const invite: Invite = {
			code: inviteCode,
			issuedBy: userId,
			inviteType,
			used: false,
			expiresAt,
			createdAt: now
		}

		await db.setInvite(inviteCode, invite)

		// Update user's invite usage
		user.invitesUsed[inviteTypeKey]++
		await db.setUser(userId, user)

		return NextResponse.json({
			success: true,
			invite: {
				code: inviteCode,
				type: inviteType,
				expiresAt,
				issuedAt: now
			}
		})
	} catch (error) {
		console.error('Create invite error:', error)
		return NextResponse.json(
			{ error: 'Failed to create invite' },
			{ status: 500 }
		)
	}
}
