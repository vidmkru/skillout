import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Provider } from 'jotai'
import { AuthProvider } from '@/shared/providers/AuthProvider'
import './globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Hub.Skillout.pro - База данных специалистов генеративного видео',
	description: 'Профессиональная база данных для специалистов по генеративному видео и ИИ',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="ru">
			<body className={inter.className}>
				<Provider>
					<AuthProvider>
						{children}
					</AuthProvider>
				</Provider>
			</body>
		</html>
	)
}
