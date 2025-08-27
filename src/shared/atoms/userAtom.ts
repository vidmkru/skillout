import { atom } from 'jotai'
import type { User } from '../types/database'

export interface AuthState {
	user: User | null
	isLoading: boolean
	isAuthenticated: boolean
}

export const userAtom = atom<AuthState>({
	user: null,
	isLoading: true,
	isAuthenticated: false,
})

// Derived atoms
export const isAuthenticatedAtom = atom((get) => get(userAtom).isAuthenticated)
export const currentUserAtom = atom((get) => get(userAtom).user)
export const userRoleAtom = atom((get) => get(userAtom).user?.role)
export const isLoadingAtom = atom((get) => get(userAtom).isLoading)

// Actions
export const setUserAtom = atom(
	null,
	(get, set, user: User | null) => {
		set(userAtom, {
			user,
			isLoading: false,
			isAuthenticated: !!user,
		})
	}
)

export const setLoadingAtom = atom(
	null,
	(get, set, isLoading: boolean) => {
		const current = get(userAtom)
		set(userAtom, {
			...current,
			isLoading,
		})
	}
)

export const logoutAtom = atom(
	null,
	(get, set) => {
		set(userAtom, {
			user: null,
			isLoading: false,
			isAuthenticated: false,
		})
	}
)
