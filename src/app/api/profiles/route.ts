import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/db/redis'

import type { ProductionProfile, ApiResponse, PaginatedResponse } from '@/shared/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		console.log('🔍 Profiles API: Request received')

		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const limit = parseInt(searchParams.get('limit') || '10')
		const search = searchParams.get('search') || ''
		const specialization = searchParams.get('specialization') || ''
		const userType = searchParams.get('userType') || 'creators'

		// Additional filter parameters
		const skills = searchParams.get('skills')?.split(',').filter(Boolean) || []
		const programs = searchParams.get('programs')?.split(',').filter(Boolean) || []
		const experience = searchParams.get('experience') || ''
		const hackathon = searchParams.get('hackathon')
		const city = searchParams.get('city') || ''
		const withPortfolio = searchParams.get('withPortfolio') === 'true'

		console.log('🔍 Profiles API: Filter parameters:', {
			search, specialization, userType, skills, programs, experience, hackathon, city, withPortfolio
		})

		let profiles: ProductionProfile[] = []

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
		const filteredProfiles = profiles.filter((profile: ProductionProfile) => {
			// User type filter
			const matchesUserType = (() => {
				if (userType === 'creators') {
					// Show only creators (isPro = false)
					return !profile.isPro
				} else if (userType === 'producers') {
					// Show only producers and production users (isPro = true)
					return profile.isPro
				}
				// Show all if no specific type
				return true
			})()

			// Search filter
			const matchesSearch = !search ||
				profile.name.toLowerCase().includes(search.toLowerCase()) ||
				profile.bio.toLowerCase().includes(search.toLowerCase())

			// Specialization filter
			const matchesSpecialization = !specialization ||
				profile.specialization.includes(specialization)

			// Skills filter
			const matchesSkills = skills.length === 0 ||
				skills.some(skill =>
					profile.specialization.includes(skill) ||
					profile.tools.includes(skill)
				)

			// Programs filter
			const matchesPrograms = programs.length === 0 ||
				programs.some(program => profile.tools.includes(program))

			// Experience filter
			const matchesExperience = !experience || profile.experience === experience

			// Hackathon filter - check if profile has hackathon-related achievements
			const matchesHackathon = hackathon === null || hackathon === undefined ||
				(hackathon === 'true' && profile.achievements.some(achievement =>
					achievement.type === 'hackathon' ||
					achievement.title.toLowerCase().includes('hackathon') ||
					achievement.title.toLowerCase().includes('skillout')
				)) ||
				(hackathon === 'false' && !profile.achievements.some(achievement =>
					achievement.type === 'hackathon' ||
					achievement.title.toLowerCase().includes('hackathon') ||
					achievement.title.toLowerCase().includes('skillout')
				))

			// City filter - check if city is mentioned in bio or achievements
			const matchesCity = !city ||
				profile.bio.toLowerCase().includes(city.toLowerCase()) ||
				profile.achievements.some(achievement =>
					achievement.description.toLowerCase().includes(city.toLowerCase())
				)

			// Portfolio filter
			const matchesPortfolio = !withPortfolio || profile.portfolio.length > 0

			return matchesUserType && matchesSearch && matchesSpecialization && matchesSkills &&
				matchesPrograms && matchesExperience && matchesHackathon &&
				matchesCity && matchesPortfolio
		})

		console.log('🔍 Profiles API: Profiles after filtering:', filteredProfiles.length)

		// Apply sorting for producers
		if (userType === 'producers') {
			filteredProfiles.sort((a, b) => {
				const nameA = a.name.toLowerCase()
				const nameB = b.name.toLowerCase()
				return nameA.localeCompare(nameB, 'ru')
			})
		}

		// Apply pagination
		const startIndex = (page - 1) * limit
		const endIndex = startIndex + limit
		const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex)

		console.log('🔍 Profiles API: Paginated profiles:', paginatedProfiles.length)

		const paginatedResponse: PaginatedResponse<ProductionProfile> = {
			items: paginatedProfiles,
			page,
			limit,
			total: filteredProfiles.length,
			totalPages: Math.ceil(filteredProfiles.length / limit)
		}

		console.log('✅ Profiles API: Returning response with', paginatedProfiles.length, 'profiles')
		console.log('🔍 Profiles API: Full response data:', JSON.stringify(paginatedResponse, null, 2))

		return NextResponse.json<ApiResponse<PaginatedResponse<ProductionProfile>>>({
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
