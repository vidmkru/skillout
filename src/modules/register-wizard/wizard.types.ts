export interface RegisterWizardProps {
	className?: string
}

export interface ProductionProfileInput {
	name: string
	about?: string
	specialization: string[]
	tools: string[]
	experience: 'lt1' | '1-2' | '2+'
	clients?: string
	portfolioLinks?: string[]
	achievements?: string
	telegram?: string
	socials?: string
	agreeHub?: boolean
}
