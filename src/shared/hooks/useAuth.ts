import { useCallback } from 'react'
import { useSetAtom, useAtomValue } from 'jotai'
import { userAtom, setUserAtom, setLoadingAtom, logoutAtom } from '../atoms/userAtom'
import { axiosInstance } from '../api'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/database'

export function useAuth() {
	const setUser = useSetAtom(setUserAtom)
	const setLoading = useSetAtom(setLoadingAtom)
	const logout = useSetAtom(logoutAtom)
	const authState = useAtomValue(userAtom)

	const login = useCallback(async (email: string) => {
		try {
			setLoading(true)

			const response = await axiosInstance.post<{ success: boolean; message: string; data?: { message: string } }>('/api/auth/login', {
				email
			} as LoginRequest)

			if (response.data.success) {
				return { success: true, message: response.data.data?.message || 'Check your email for login link' }
			} else {
				return { success: false, message: response.data.message || 'Login failed' }
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Login failed'
			return { success: false, message }
		} finally {
			setLoading(false)
		}
	}, [setLoading])

	const register = useCallback(async (email: string, role: 'creator' | 'producer', inviteCode?: string) => {
		try {
			setLoading(true)

			const response = await axiosInstance.post<{ success: boolean; message: string; data?: unknown }>('/api/auth/register', {
				email,
				role,
				inviteCode
			} as RegisterRequest)

			if (response.data.success) {
				return { success: true, message: response.data.message || 'Registration successful' }
			} else {
				return { success: false, message: response.data.message || 'Registration failed' }
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Registration failed'
			return { success: false, message }
		} finally {
			setLoading(false)
		}
	}, [setLoading])

	const verifySession = useCallback(async () => {
		try {
			setLoading(true)

			const response = await axiosInstance.get<{ success: boolean; data?: AuthResponse }>('/api/auth/me')

			if (response.data.success && response.data.data) {
				setUser(response.data.data.user)
				return true
			} else {
				setUser(null)
				return false
			}
		} catch (error) {
			setUser(null)
			return false
		} finally {
			setLoading(false)
		}
	}, [setUser, setLoading])

	const logoutUser = useCallback(async () => {
		try {
			await axiosInstance.post('/api/auth/logout')
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			logout()
		}
	}, [logout])

	return {
		user: authState.user,
		isLoading: authState.isLoading,
		isAuthenticated: authState.isAuthenticated,
		login,
		register,
		verifySession,
		logout: logoutUser,
	}
}
