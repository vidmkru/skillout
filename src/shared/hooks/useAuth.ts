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
			console.log('🔐 useAuth: Login attempt for:', email)
			setLoading(true)

			const response = await axiosInstance.post<{ success: boolean; data?: AuthResponse; error?: string }>('/api/auth/login', {
				email
			} as LoginRequest)

			console.log('🔐 useAuth: Login response:', response.data)

			if (response.data.success && response.data.data) {
				// Set user data immediately after successful login
				console.log('🔐 useAuth: Setting user data:', response.data.data.user)
				setUser(response.data.data.user)
				return { success: true, message: 'Login successful' }
			} else {
				console.log('🔐 useAuth: Login failed:', response.data.error)
				return { success: false, message: response.data.error || 'Login failed' }
			}
		} catch (error: unknown) {
			console.error('🔐 useAuth: Login error:', error)
			const message = error instanceof Error ? error.message : 'Login failed'
			return { success: false, message }
		} finally {
			setLoading(false)
		}
	}, [setLoading, setUser])

	const register = useCallback(async (email: string, role: 'creator' | 'producer', inviteCode?: string) => {
		try {
			console.log('📝 useAuth: Registration attempt for:', email, role)
			setLoading(true)

			const response = await axiosInstance.post<{ success: boolean; message: string; data?: unknown }>('/api/auth/register', {
				email,
				role,
				inviteCode
			} as RegisterRequest)

			console.log('📝 useAuth: Registration response:', response.data)

			if (response.data.success) {
				return { success: true, message: response.data.message || 'Registration successful' }
			} else {
				return { success: false, message: response.data.message || 'Registration failed' }
			}
		} catch (error: unknown) {
			console.error('📝 useAuth: Registration error:', error)
			const message = error instanceof Error ? error.message : 'Registration failed'
			return { success: false, message }
		} finally {
			setLoading(false)
		}
	}, [setLoading])

	const verifySession = useCallback(async () => {
		try {
			console.log('🔍 useAuth: Verifying session...')
			setLoading(true)

			const response = await axiosInstance.get<{ success: boolean; data?: AuthResponse }>('/api/auth/me')

			console.log('🔍 useAuth: Session verification response:', response.data)

			if (response.data.success && response.data.data) {
				console.log('🔍 useAuth: Setting user from session:', response.data.data.user)
				setUser(response.data.data.user)
				return true
			} else {
				console.log('🔍 useAuth: No valid session found')
				setUser(null)
				return false
			}
		} catch (error) {
			console.error('🔍 useAuth: Session verification error:', error)
			setUser(null)
			return false
		} finally {
			setLoading(false)
		}
	}, [setUser, setLoading])

	const logoutUser = useCallback(async () => {
		try {
			console.log('🚪 useAuth: Logging out...')
			await axiosInstance.post('/api/auth/logout')
		} catch (error) {
			console.error('🚪 useAuth: Logout error:', error)
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
