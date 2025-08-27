import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'
import type { CreatorProfile } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '10')
		const search = searchParams.get('search') || ''
		const specialization = searchParams.get('specialization') || ''

		let profiles: CreatorProfile[] = []

		// Try to get profiles from Redis
		try {
			profiles = await db.getAllProfiles()
		} catch (error) {
			console.error('Failed to get profiles from Redis:', error)
			profiles = []
		}

		// Apply filters
		const filteredProfiles = profiles.filter((profile: CreatorProfile) => {
			const matchesSearch = !search ||
				profile.name.toLowerCase().includes(search.toLowerCase()) ||
				profile.bio.toLowerCase().includes(search.toLowerCase())

			const matchesSpecialization = !specialization ||
				profile.specialization.includes(specialization)

			return matchesSearch && matchesSpecialization
		})

		// Apply pagination
		const startIndex = (page - 1) * limit
		const endIndex = startIndex + limit
		const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex)

		return NextResponse.json({
			profiles: paginatedProfiles,
			pagination: {
				page,
				limit,
				total: filteredProfiles.length,
				totalPages: Math.ceil(filteredProfiles.length / limit)
			},
			dataSource: profiles.length > 0 ? 'redis' : 'none'
		})
	} catch (error) {
		console.error('Profiles API error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch profiles' },
			{ status: 500 }
		)
	}
}
