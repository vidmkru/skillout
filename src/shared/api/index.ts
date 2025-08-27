export * from './instances'

export interface ApiListParams {
	page?: number
	pageSize?: number
	query?: string
}

export interface ApiListResponse<T> {
	items: T[]
	page: number
	pageSize: number
	total: number
}
