import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'

import type { CreatorProfile, ApiResponse, PaginatedResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		console.log('🔍 Profiles API: Request received')

		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '10')
		const search = searchParams.get('search') || ''
		const specialization = searchParams.get('specialization') || ''

		let profiles: CreatorProfile[] = []

		// Load profiles from Redis only
		try {
			console.log('🔍 Profiles API: Loading from Redis...')
			profiles = await db.getAllProfiles()
			console.log('🔍 Profiles API: Total profiles in Redis:', profiles.length)
		} catch (error) {
			console.error('Failed to load profiles from Redis:', error)
			profiles = []
		}

		// Filter only public profiles
		profiles = profiles.filter(profile => profile.isPublic)
		console.log('✅ Profiles API: Public profiles count:', profiles.length)

		console.log('🔍 Profiles API: Total profiles before filtering:', profiles.length)

		// Apply filters
		const filteredProfiles = profiles.filter((profile: CreatorProfile) => {
			const matchesSearch = !search ||
				profile.name.toLowerCase().includes(search.toLowerCase()) ||
				profile.bio.toLowerCase().includes(search.toLowerCase())

			const matchesSpecialization = !specialization ||
				profile.specialization.includes(specialization)

			return matchesSearch && matchesSpecialization
		})

		console.log('🔍 Profiles API: Profiles after filtering:', filteredProfiles.length)

		// Apply pagination
		const startIndex = (page - 1) * limit
		const endIndex = startIndex + limit
		const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex)

		console.log('🔍 Profiles API: Paginated profiles:', paginatedProfiles.length)

		const paginatedResponse: PaginatedResponse<CreatorProfile> = {
			items: paginatedProfiles,
			page,
			limit,
			total: filteredProfiles.length,
			totalPages: Math.ceil(filteredProfiles.length / limit)
		}

		console.log('✅ Profiles API: Returning response with', paginatedProfiles.length, 'profiles')
		console.log('🔍 Profiles API: Full response data:', JSON.stringify(paginatedResponse, null, 2))

		return NextResponse.json<ApiResponse<PaginatedResponse<CreatorProfile>>>({
			success: true,
			data: paginatedResponse
		})
	} catch (error) {
		console.error('❌ Profiles API error:', error)
		return NextResponse.json<ApiResponse<null>>(
			{ success: false, error: 'Failed to fetch profiles' },
			{ status: 500 }
		)
	}
}
