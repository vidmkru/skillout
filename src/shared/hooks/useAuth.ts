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

			// Mock user for local testing
			if (email === 'test@skillout.com' || email === 'admin@skillout.com' || email === 'producer@skillout.com') {
				console.log('🔐 useAuth: Using mock user for local testing')

				const mockUser = {
					id: email === 'admin@skillout.com' ? 'admin-1' : email === 'producer@skillout.com' ? 'producer-1' : 'creator-1',
					email: email,
					role: email === 'admin@skillout.com' ? 'admin' as any : email === 'producer@skillout.com' ? 'producer' as any : 'creator' as any,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					isVerified: true,
					subscriptionTier: email === 'producer@skillout.com' ? 'producer' as any : 'free' as any,
					inviteQuota: { creator: 5, creatorPro: 3, producer: 2 },
					invitesUsed: { creator: 0, creatorPro: 0, producer: 0 },
					invitesCreated: [],
					quotaLastReset: new Date().toISOString()
				}

				// Save mock user to localStorage and set cookie for middleware
				if (typeof window !== 'undefined') {
					localStorage.setItem('mockUser', JSON.stringify(mockUser))
					localStorage.setItem('token', 'mock-token-' + mockUser.id)

					// Set session cookie for middleware
					document.cookie = `session=mock-session-${mockUser.id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
				}

				setUser(mockUser)
				return { success: true, message: 'Login successful (mock user)' }
			}

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

			// Check for mock user in localStorage first
			if (typeof window !== 'undefined') {
				const mockUserData = localStorage.getItem('mockUser')
				const mockToken = localStorage.getItem('token')

				if (mockUserData && mockToken && mockToken.startsWith('mock-token-')) {
					console.log('🔍 useAuth: Found mock user in localStorage')
					const mockUser = JSON.parse(mockUserData)
					setUser(mockUser)
					return true
				}
			}

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

			// Clear mock data from localStorage and cookies
			if (typeof window !== 'undefined') {
				localStorage.removeItem('mockUser')
				localStorage.removeItem('token')

				// Clear session cookie
				document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
			}

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
