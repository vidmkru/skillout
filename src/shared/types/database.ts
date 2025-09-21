import { ExperienceLevel, UserRole, SubscriptionTier, InviteType } from './enums'

// Base user interface
export interface User {
	id: string
	email: string
	role: UserRole
	createdAt: string
	updatedAt: string
	isVerified: boolean
	subscriptionTier: SubscriptionTier
	inviteQuota: InviteQuota
	invitesUsed: InviteUsage
	invitesCreated: Invite[]
	quotaLastReset?: string // Дата последнего сброса квоты
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
	isPro: boolean // true for production, false for creator
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
	id: string
	code: string
	type: InviteType
	createdBy: string
	createdAt: string
	expiresAt: string
	status: 'active' | 'used' | 'expired'
	usedBy?: string
	usedAt?: string
	usedEmail?: string
	qrCode?: string
}

export interface InviteQuota {
	creator: number
	production: number
	producer: number
}

export interface InviteUsage {
	creator: number
	production: number
	producer: number
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
	tier: SubscriptionTier
	status: 'active' | 'expired' | 'cancelled'
	startsAt: string
	expiresAt: string
	paymentMethod?: string
	autoRenew: boolean
}

// Admin settings interface
export interface AdminSettings {
	id: string
	inviteQuotas: {
		admin: {
			creator: number
			production: number
			producer: number
		}
		creator: {
			creator: number
			production: number
			producer: number
		}
		production: {
			creator: number
			production: number
			producer: number
		}
	}
	paywallSettings: {
		contactInfo: boolean
		portfolioDetails: boolean
		recommendations: boolean
		achievements: boolean
	}
	updatedAt: string
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

export interface CreateInviteRequest {
	role: 'creator' | 'production' | 'producer'
	quantity?: number // default 1
}

export interface InviteStats {
	totalCreated: number
	totalUsed: number
	active: number
	expired: number
	byRole: {
		creator: number
		production: number
		producer: number
	}
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
