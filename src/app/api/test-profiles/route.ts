import { NextResponse } from 'next/server'
import { fallbackProfiles } from '@/shared/db/fallback'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		console.log('🔍 Test Profiles API: Request received')

		const profiles = Array.from(fallbackProfiles.values())
		console.log('✅ Test Profiles API: Profiles count:', profiles.length)
		console.log('🔍 Test Profiles API: Fallback profiles keys:', Array.from(fallbackProfiles.keys()))

		return NextResponse.json({
			success: true,
			count: profiles.length,
			profiles: profiles
		})
	} catch (error) {
		console.error('❌ Test Profiles API error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch test profiles' },
			{ status: 500 }
		)
	}
}
