'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wrapper, Heading, Button } from '@/ui'
import { useAuth } from '@/shared/hooks/useAuth'
import classNames from 'classnames'

import styles from './pending-verification.module.scss'

interface PendingVerificationProps {
	className?: string
}

export const PendingVerification: React.FC<PendingVerificationProps> = ({ className }) => {
	const router = useRouter()
	const { user, isAuthenticated, verifySession } = useAuth()

	// Check verification status periodically
	useEffect(() => {
		if (!isAuthenticated) {
			router.push('/login')
			return
		}

		if (user?.isVerified) {
			router.push('/')
			return
		}

		// Check verification status every 30 seconds
		const interval = setInterval(async () => {
			await verifySession()
			if (user?.isVerified) {
				router.push('/')
			}
		}, 30000)

		return () => clearInterval(interval)
	}, [isAuthenticated, user?.isVerified, router, verifySession])

	const handleRefresh = async () => {
		await verifySession()
		if (user?.isVerified) {
			router.push('/')
		}
	}

	const handleLogout = () => {
		router.push('/login')
	}

	if (!isAuthenticated) {
		return null
	}

	return (
		<section className={classNames(styles.root, className)}>
			<Wrapper>
				<div className={styles.content}>
					<div className={styles.icon}>⏳</div>

					<Heading tagName="h1" className={styles.title}>
						Ожидание подтверждения
					</Heading>

					<div className={styles.message}>
						<p>
							Ваша регистрация успешно завершена, но ваш аккаунт еще не подтвержден администратором.
						</p>
						<p>
							Мы уведомим вас, как только ваш аккаунт будет подтвержден и вы сможете пользоваться всеми функциями сайта.
						</p>
					</div>

					<div className={styles.userInfo}>
						<div className={styles.infoItem}>
							<span className={styles.label}>Email:</span>
							<span className={styles.value}>{user?.email}</span>
						</div>
						<div className={styles.infoItem}>
							<span className={styles.label}>Роль:</span>
							<span className={styles.value}>{user?.role}</span>
						</div>
						<div className={styles.infoItem}>
							<span className={styles.label}>Статус:</span>
							<span className={styles.status}>Ожидает подтверждения</span>
						</div>
					</div>

					<div className={styles.actions}>
						<Button
							onClick={handleRefresh}
							className={styles.refreshButton}
						>
							Проверить статус
						</Button>

						<Button
							onClick={handleLogout}
							className={styles.logoutButton}
						>
							Выйти
						</Button>
					</div>

					<div className={styles.help}>
						<p>
							Если у вас есть вопросы, обратитесь к администратору.
						</p>
					</div>
				</div>
			</Wrapper>
		</section>
	)
}
