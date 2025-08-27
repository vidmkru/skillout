import { ExperienceLevel } from './enums'

// Base user interface
export interface User {
	id: string
	email: string
	role: 'creator' | 'producer' | 'admin'
	createdAt: string
	updatedAt: string
	isVerified: boolean
	subscriptionTier: 'free' | 'producer' | 'creator-pro'
	subscriptionExpiresAt?: string
}

// Session interface
export interface Session {
	id: string
	userId: string
	createdAt: string
	expiresAt: string
	userAgent?: string
	ip?: string
}

// Profile interface for creators
export interface CreatorProfile {
	id: string
	userId: string
	name: string
	avatar?: string
	bio: string
	specialization: string[]
	tools: string[]
	experience: ExperienceLevel
	clients: string[]
	portfolio: PortfolioItem[]
	achievements: Achievement[]
	rating: number
	recommendations: Recommendation[]
	badges: Badge[]
	contacts: {
		telegram?: string
		instagram?: string
		behance?: string
		linkedin?: string
	}
	isPublic: boolean
	createdAt: string
	updatedAt: string
}

// Portfolio item
export interface PortfolioItem {
	id: string
	title: string
	description?: string
	videoUrl?: string
	thumbnail?: string
	tags: string[]
	createdAt: string
}

// Achievement
export interface Achievement {
	id: string
	title: string
	description: string
	date: string
	type: 'hackathon' | 'competition' | 'award' | 'certification'
}

// Recommendation
export interface Recommendation {
	id: string
	fromUserId: string
	fromUserName: string
	text: string
	rating: number
	createdAt: string
}

// Badge
export interface Badge {
	id: string
	name: string
	description: string
	icon: string
	type: 'skillout_participant' | 'expert_verified' | 'hackathon_winner' | 'top_rated'
	awardedAt: string
}

// Invite interface
export interface Invite {
	code: string
	issuedBy: string
	issuedTo?: string
	used: boolean
	usedAt?: string
	expiresAt: string
	createdAt: string
}

// Rating interface
export interface Rating {
	profileId: string
	averageRating: number
	totalRatings: number
	ratings: {
		[userId: string]: {
			rating: number
			comment?: string
			createdAt: string
		}
	}
}

// Subscription interface
export interface Subscription {
	userId: string
	tier: 'free' | 'producer' | 'creator-pro'
	status: 'active' | 'expired' | 'cancelled'
	startsAt: string
	expiresAt: string
	paymentMethod?: string
	autoRenew: boolean
}

// Database query interfaces
export interface ProfileFilters {
	specialization?: string[]
	experience?: ExperienceLevel[]
	rating?: { min: number; max: number }
	hasPortfolio?: boolean
	isVerified?: boolean
}

export interface PaginationParams {
	page: number
	limit: number
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

// API response interfaces
export interface ApiResponse<T> {
	success: boolean
	data?: T
	error?: string
	message?: string
}

export interface PaginatedResponse<T> {
	items: T[]
	total: number
	page: number
	limit: number
	totalPages: number
}

// Auth interfaces
export interface LoginRequest {
	email: string
}

export interface RegisterRequest {
	email: string
	role: 'creator' | 'producer'
	inviteCode?: string
}

export interface AuthResponse {
	user: User
	session: Session
	token: string
}

// Profile update interfaces
export interface ProfileUpdateRequest {
	name?: string
	bio?: string
	specialization?: string[]
	tools?: string[]
	experience?: ExperienceLevel
	clients?: string[]
	contacts?: {
		telegram?: string
		instagram?: string
		behance?: string
		linkedin?: string
	}
	isPublic?: boolean
}

// Invite interfaces
export interface InviteRequest {
	email: string
}

export interface InviteResponse {
	code: string
	expiresAt: string
}

// Rating interfaces
export interface RatingRequest {
	rating: number
	comment?: string
}

export interface RatingResponse {
	averageRating: number
	totalRatings: number
}
