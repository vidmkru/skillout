'use client'

import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Footer } from '@/modules/footer'
import { Header } from '@/modules/header'

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { verifySession, isLoading } = useAuth()

	useEffect(() => {
		// Check authentication status on app load
		verifySession()
	}, [verifySession])

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
