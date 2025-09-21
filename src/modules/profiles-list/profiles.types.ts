import { ProductionProfile } from '@/shared/types/common'

export interface ProfilesListProps {
	className?: string
}

export interface ProfilesQuery {
	q?: string
}

export interface ProfilesData {
	items: ProductionProfile[]
}
