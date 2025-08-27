export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface BaseEntity {
	id: string
	createdAt?: string
	updatedAt?: string
}

export interface CreatorProfile extends BaseEntity {
	name: string
	about?: string
	specialization: string[]
	tools: string[]
	experience: string
	rating?: number
	badges?: string[]
	avatarUrl?: string
}
