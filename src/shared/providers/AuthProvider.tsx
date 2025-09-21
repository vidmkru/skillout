'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { Footer } from '@/modules/footer'
import { Header } from '@/modules/header'

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { verifySession, isLoading, user, isAuthenticated } = useAuth()
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		// Check authentication status on app load
		verifySession()
	}, [verifySession])

	// Check verification status
	useEffect(() => {
		if (!isLoading && isAuthenticated && user && !user.isVerified) {
			// Don't redirect if already on pending verification page
			if (pathname !== '/pending-verification') {
				router.push('/pending-verification')
			}
		}
	}, [isLoading, isAuthenticated, user, pathname, router])

	if (isLoading) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
				fontSize: '18px'
			}}>
				Загрузка...
			</div>
		)
	}

	return (
		<div id="root">
			<Header />
			{children}
			<Footer />
			<div id="modal-root" />
		</div>
	)
}
