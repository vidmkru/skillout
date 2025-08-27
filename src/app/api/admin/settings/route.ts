import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { AdminSettings } from '@/shared/types/database'
import { UserRole } from '@/shared/types/enums'

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
		if (!user || user.role !== UserRole.Admin) {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		// Get admin settings
		const settings = await db.getAdminSettings()

		return NextResponse.json(settings)
	} catch (error) {
		console.error('Get admin settings error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch admin settings' },
			{ status: 500 }
		)
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json()
		const { inviteQuotas, paywallSettings } = body

		// Get current user from headers
		const userId = request.headers.get('x-user-id')
		if (!userId) {
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		const user = await db.getUser(userId)
		if (!user || user.role !== UserRole.Admin) {
			return NextResponse.json(
				{ error: 'Admin access required' },
				{ status: 403 }
			)
		}

		// Update admin settings
		const settings: AdminSettings = {
			id: 'admin-settings',
			inviteQuotas: inviteQuotas || {
				admin: { creator: 50, creatorPro: 20, producer: 100 },
				creator: { creator: 2, creatorPro: 0, producer: 5 },
				creatorPro: { creator: 5, creatorPro: 2, producer: 10 }
			},
			paywallSettings: paywallSettings || {
				contactInfo: true,
				portfolioDetails: true,
				recommendations: true,
				achievements: true
			},
			updatedAt: new Date().toISOString()
		}

		await db.setAdminSettings(settings.id, settings)

		return NextResponse.json({
			success: true,
			message: 'Admin settings updated successfully',
			settings
		})
	} catch (error) {
		console.error('Update admin settings error:', error)
		return NextResponse.json(
			{ error: 'Failed to update admin settings' },
			{ status: 500 }
		)
	}
}
