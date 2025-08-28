'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/ui/button'
import { Heading } from '@/ui/heading'
import { axiosInstance } from '@/shared/api/instances'
import styles from './admin.module.scss'

interface AdminStats {
	totalUsers: number
	usersByRole: {
		admin: number
		creator: number
		creatorPro: number
		producer: number
	}
	totalInvites: number
	activeInvites: number
	usedInvites: number
}

export default function AdminPage() {
	const [stats, setStats] = useState<AdminStats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const router = useRouter()

	useEffect(() => {
		fetchAdminStats()
	}, [])

	const fetchAdminStats = async () => {
		try {
			setIsLoading(true)
			setError('')

			const response = await axiosInstance.get<{ success: boolean; data: AdminStats }>('/api/admin/stats')

			if (response.data.success) {
				setStats(response.data.data)
			} else {
				setError('Не удалось загрузить статистику')
			}
		} catch (error: any) {
			console.error('Fetch admin stats error:', error)
			setError(error.response?.data?.error || 'Ошибка сети')
		} finally {
			setIsLoading(false)
		}
	}

	const navigateToSection = (section: string) => {
		router.push(`/admin/${section}`)
	}

	if (isLoading) {
		return <div className={styles.loading}>Загрузка админ-панели...</div>
	}

	if (error) {
		return (
			<div className={styles.container}>
				<div className={styles.error}>
					<div className={styles.errorMessage}>{error}</div>
					<Button onClick={fetchAdminStats}>Попробовать снова</Button>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<Heading size="lg" tagName="h1" className={styles.title}>
				Админ-панель
			</Heading>

			<div className={styles.overview}>
				<div className={styles.statsGrid}>
					<div className={styles.statCard}>
						<h3>Всего пользователей</h3>
						<div className={styles.statValue}>{stats?.totalUsers || 0}</div>
					</div>
					<div className={styles.statCard}>
						<h3>Активных инвайтов</h3>
						<div className={styles.statValue}>{stats?.activeInvites || 0}</div>
					</div>
					<div className={styles.statCard}>
						<h3>Использованных инвайтов</h3>
						<div className={styles.statValue}>{stats?.usedInvites || 0}</div>
					</div>
				</div>

				<div className={styles.roleStats}>
					<h3>Пользователи по ролям</h3>
					<div className={styles.roleGrid}>
						<div className={styles.roleItem}>
							<span>Администраторы:</span>
							<span>{stats?.usersByRole.admin || 0}</span>
						</div>
						<div className={styles.roleItem}>
							<span>Креаторы:</span>
							<span>{stats?.usersByRole.creator || 0}</span>
						</div>
						<div className={styles.roleItem}>
							<span>Креаторы Про:</span>
							<span>{stats?.usersByRole.creatorPro || 0}</span>
						</div>
						<div className={styles.roleItem}>
							<span>Продюсеры:</span>
							<span>{stats?.usersByRole.producer || 0}</span>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.sections}>
				<Heading size="md" tagName="h2" className={styles.sectionTitle}>
					Управление системой
				</Heading>

				<div className={styles.sectionsGrid}>
					<div className={styles.sectionCard} onClick={() => navigateToSection('users')}>
						<h3>Пользователи</h3>
						<p>Управление пользователями, ролями и правами доступа</p>
						<Button className={styles.sectionButton}>
							Перейти
						</Button>
					</div>

					<div className={styles.sectionCard} onClick={() => navigateToSection('invites')}>
						<h3>Инвайты</h3>
						<p>Просмотр и управление всеми инвайтами в системе</p>
						<Button className={styles.sectionButton}>
							Перейти
						</Button>
					</div>

					<div className={styles.sectionCard} onClick={() => navigateToSection('settings')}>
						<h3>Настройки</h3>
						<p>Настройка квот инвайтов и параметров paywall</p>
						<Button className={styles.sectionButton}>
							Перейти
						</Button>
					</div>

					<div className={styles.sectionCard} onClick={() => navigateToSection('analytics')}>
						<h3>Аналитика</h3>
						<p>Статистика и аналитика использования платформы</p>
						<Button className={styles.sectionButton}>
							Перейти
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
