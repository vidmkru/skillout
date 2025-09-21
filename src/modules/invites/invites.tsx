'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/shared/hooks/useAuth'
import { UserRole, InviteType } from '@/shared/types/enums'
import { axiosInstance as api } from '@/shared/api/instances'
import type { Invite } from '@/shared/types/database'
import { formatTimeUntilReset } from '@/shared/utils/quotaUtils'
import styles from './invites.module.scss'

interface InvitesProps {
	className?: string
}

interface InviteData {
	invites: Invite[]
	quota: {
		creator: number
		production: number
		producer: number
	}
	used: {
		creator: number
		production: number
		producer: number
	}
	remaining: {
		creator: number
		production: number
		producer: number
	}
	nextReset: string
}

interface InvitedUser {
	id: string
	email: string
	role: string
	createdAt: string
}

export const Invites: React.FC<InvitesProps> = ({ className }) => {
	const { user } = useAuth()
	const [inviteData, setInviteData] = useState<InviteData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [creatingInvite, setCreatingInvite] = useState(false)
	const [selectedType, setSelectedType] = useState<InviteType>(InviteType.Creator)
	const [invitedUsers, setInvitedUsers] = useState<Record<string, InvitedUser>>({})
	const [timeUntilReset, setTimeUntilReset] = useState<string>('')

	const fetchInvites = useCallback(async () => {
		try {
			setLoading(true)
			const response = await api.get('/api/invites')
			if (response.data.success) {
				setInviteData(response.data.data)

				// Calculate time until reset
				if (user) {
					const userWithReset = { ...user, quotaLastReset: response.data.data.nextReset }
					const timeUntilResetStr = formatTimeUntilReset(userWithReset)
					setTimeUntilReset(timeUntilResetStr)
				}

				// Get information about invited users
				const usersMap: Record<string, InvitedUser> = {}
				for (const invite of response.data.data.invites) {
					if (invite.usedBy && invite.usedEmail) {
						usersMap[invite.id] = {
							id: invite.usedBy,
							email: invite.usedEmail,
							role: invite.type,
							createdAt: invite.usedAt || ''
						}
					}
				}
				setInvitedUsers(usersMap)
			} else {
				setError('Ошибка загрузки инвайтов')
			}
		} catch (error) {
			console.error('Fetch invites error:', error)
			setError('Ошибка загрузки инвайтов')
		} finally {
			setLoading(false)
		}
	}, [user])

	useEffect(() => {
		// Prevent any page refresh
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault()
			e.returnValue = ''
		}

		window.addEventListener('beforeunload', handleBeforeUnload)

		fetchInvites()

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [fetchInvites])

	// Check if user can create invites
	if (!user || (user.role !== UserRole.Creator && user.role !== UserRole.CreatorPro && user.role !== UserRole.Admin)) {
		return (
			<div className={styles.container}>
				<div className={styles.error}>
					<h2>Доступ запрещен</h2>
					<p>Только креаторы и администраторы могут создавать инвайты.</p>
				</div>
			</div>
		)
	}

	// Helper function to convert InviteType to object key
	const getTypeKey = (type: InviteType): 'creator' | 'production' | 'producer' => {
		switch (type) {
			case InviteType.Creator:
				return 'creator'
			case InviteType.CreatorPro:
				return 'production'
			case InviteType.Producer:
				return 'producer'
			default:
				return 'creator'
		}
	}

	const createInvite = async (type: InviteType) => {
		console.log('🚀 createInvite called - preventing page refresh')

		// Prevent any page refresh
		if (typeof window !== 'undefined') {
			window.onbeforeunload = null
			// Add event listener to detect page refresh
			window.addEventListener('beforeunload', (e) => {
				console.log('⚠️ Page refresh detected!', e)
				e.preventDefault()
				e.returnValue = ''
			})
		}

		try {
			setCreatingInvite(true)
			setError(null)

			console.log('Creating invite for type:', type)
			console.log('API base URL:', api.defaults.baseURL)

			const requestData = { type }
			console.log('Request data:', requestData)

			const response = await api.post('/api/invites', requestData)
			console.log('Create invite response:', response.data)

			if (response.data.success) {
				const newInvite = response.data.data.invite
				console.log('Invite created successfully:', newInvite)

				// Immediately add the new invite to the local state for display
				setInviteData(prevData => {
					if (!prevData) return null
					const typeKey = getTypeKey(type)
					return {
						...prevData,
						invites: [...prevData.invites, newInvite],
						used: {
							...prevData.used,
							[typeKey]: prevData.used[typeKey] + 1
						},
						remaining: {
							...prevData.remaining,
							[typeKey]: prevData.remaining[typeKey] - 1
						}
					}
				})

				console.log('✅ Invite added to local state successfully')
			} else {
				console.error('API returned error:', response.data.error)
				setError(response.data.error || 'Ошибка создания инвайта')
			}
		} catch (error: unknown) {
			console.error('Create invite error:', error)
			const errorResponse = error && typeof error === 'object' && 'response' in error
				? (error.response as { data?: { error?: string; status?: number } })?.data
				: null
			console.error('Error response:', errorResponse)
			console.error('Error status:', errorResponse?.status)
			const errorMessage = errorResponse?.error || 'Ошибка создания инвайта'
			setError(errorMessage)
		} finally {
			setCreatingInvite(false)
		}
	}

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text)
			// Show success message
			const originalText = document.title
			document.title = 'Скопировано!'
			setTimeout(() => {
				document.title = originalText
			}, 1000)
		} catch (error) {
			console.error('Copy failed:', error)
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return '#2ed573'
			case 'used':
				return '#ffa502'
			case 'expired':
				return '#ff4757'
			default:
				return '#747d8c'
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'active':
				return 'Активен'
			case 'used':
				return 'Использован'
			case 'expired':
				return 'Истек'
			default:
				return 'Неизвестно'
		}
	}

	const getTypeLabel = (type: InviteType) => {
		switch (type) {
			case InviteType.Creator:
				return 'Креатор'
			case InviteType.CreatorPro:
				return 'Креатор Pro'
			case InviteType.Producer:
				return 'Продюсер'
			default:
				return type
		}
	}

	const getTypeColor = (type: InviteType) => {
		switch (type) {
			case InviteType.Creator:
				return '#3742fa'
			case InviteType.CreatorPro:
				return '#2ed573'
			case InviteType.Producer:
				return '#ffa502'
			default:
				return '#747d8c'
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const isExpired = (expiresAt: string) => {
		return new Date() > new Date(expiresAt)
	}

	if (loading) {
		return (
			<div className={styles.container}>
				<div className={styles.loading}>Загрузка инвайтов...</div>
			</div>
		)
	}

	if (!inviteData) {
		return (
			<div className={styles.container}>
				<div className={styles.error}>
					Не удалось загрузить данные инвайтов
				</div>
			</div>
		)
	}

	return (
		<div className={`${styles.container} ${className || ''}`}>
			<div className={styles.header}>
				<h1>Мои инвайты</h1>
				<p>Создавайте инвайты для приглашения новых участников</p>
			</div>

			{error && (
				<div className={styles.error}>
					{error}
					<button onClick={() => setError(null)}>✕</button>
				</div>
			)}

			<div className={styles.quotaSection}>
				<div className={styles.quotaHeader}>
					<h2>Квоты инвайтов</h2>
					{timeUntilReset && (
						<div className={styles.resetInfo}>
							<span className={styles.resetLabel}>Сброс квоты через:</span>
							<span className={styles.resetTime}>{timeUntilReset}</span>
						</div>
					)}
				</div>
				<div className={styles.quotaGrid}>
					<div className={styles.quotaCard}>
						<div className={styles.quotaType}>Креаторы</div>
						<div className={styles.quotaNumbers}>
							<span className={styles.remaining}>{inviteData.remaining.creator}</span>
							<span className={styles.separator}>/</span>
							<span className={styles.total}>{inviteData.quota.creator}</span>
						</div>
						<div className={styles.quotaProgress}>
							<div
								className={styles.progressBar}
								style={{
									width: `${(inviteData.used.creator / inviteData.quota.creator) * 100}%`,
									backgroundColor: '#ff6b35'
								}}
							/>
						</div>
					</div>

					<div className={styles.quotaCard}>
						<div className={styles.quotaType}>Креаторы Pro</div>
						<div className={styles.quotaNumbers}>
							<span className={styles.remaining}>{inviteData.remaining.production}</span>
							<span className={styles.separator}>/</span>
							<span className={styles.total}>{inviteData.quota.production}</span>
						</div>
						<div className={styles.quotaProgress}>
							<div
								className={styles.progressBar}
								style={{
									width: `${(inviteData.used.production / inviteData.quota.production) * 100}%`,
									backgroundColor: '#2ed573'
								}}
							/>
						</div>
					</div>

					<div className={styles.quotaCard}>
						<div className={styles.quotaType}>Продюсеры</div>
						<div className={styles.quotaNumbers}>
							<span className={styles.remaining}>{inviteData.remaining.producer}</span>
							<span className={styles.separator}>/</span>
							<span className={styles.total}>{inviteData.quota.producer}</span>
						</div>
						<div className={styles.quotaProgress}>
							<div
								className={styles.progressBar}
								style={{
									width: `${(inviteData.used.producer / inviteData.quota.producer) * 100}%`,
									backgroundColor: '#ffa502'
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.createSection}>
				<h2>Создать новый инвайт</h2>
				<div className={styles.createForm}>
					<div className={styles.typeSelector}>
						<label>Тип инвайта:</label>
						<select
							value={selectedType}
							onChange={(e) => setSelectedType(e.target.value as InviteType)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault()
									e.stopPropagation()
								}
							}}
						>
							<option value={InviteType.Creator}>Креатор</option>
							<option value={InviteType.CreatorPro}>Креатор Pro</option>
							<option value={InviteType.Producer}>Продюсер</option>
						</select>
					</div>
					<button
						type="button"
						className={styles.createButton}
						onClick={(e) => {
							console.log('🔘 Button clicked - preventing default behavior')
							e.preventDefault()
							e.stopPropagation()
							e.nativeEvent.stopImmediatePropagation()
							console.log('Button clicked! Creating invite for type:', selectedType)
							createInvite(selectedType)
						}}
						onMouseDown={(e) => {
							e.preventDefault()
							e.stopPropagation()
						}}
						disabled={creatingInvite || inviteData.remaining[selectedType as keyof typeof inviteData.remaining] <= 0}
					>
						{creatingInvite ? 'Создание...' : 'Создать инвайт'}
					</button>
				</div>
			</div>

			<div className={styles.invitesSection}>
				<h2>Мои инвайты ({inviteData.invites.length})</h2>
				{inviteData.invites.length === 0 ? (
					<div className={styles.emptyState}>
						<p>У вас пока нет инвайтов</p>
						<p>Создайте первый инвайт выше</p>
					</div>
				) : (
					<div className={styles.invitesList}>
						{inviteData.invites.map(invite => (
							<div key={invite.id} className={styles.inviteCard}>
								<div className={styles.inviteHeader}>
									<div className={styles.inviteType}>
										<span
											className={styles.typeBadge}
											style={{ backgroundColor: getTypeColor(invite.type) }}
										>
											{getTypeLabel(invite.type)}
										</span>
									</div>
									<div className={styles.inviteStatus}>
										<span
											className={styles.statusBadge}
											style={{ backgroundColor: getStatusColor(invite.status) }}
										>
											{getStatusText(invite.status)}
										</span>
									</div>
								</div>

								<div className={styles.inviteCode}>
									<label>Код инвайта:</label>
									<div className={styles.codeContainer}>
										<input
											type="text"
											value={invite.code}
											readOnly
											className={styles.codeInput}
										/>
										<button
											className={styles.copyButton}
											onClick={() => copyToClipboard(invite.code)}
										>
											Копировать
										</button>
									</div>
								</div>

								{invite.qrCode && (
									<div className={styles.qrSection}>
										<label>QR код:</label>
										<div className={styles.qrContainer}>
											<Image
												src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invite.qrCode)}`}
												alt="QR Code"
												width={150}
												height={150}
												className={styles.qrCode}
											/>
											<button
												className={styles.downloadButton}
												onClick={() => {
													if (!invite.qrCode) return
													const link = document.createElement('a')
													link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invite.qrCode)}`
													link.download = `invite-${invite.code}.png`
													link.click()
												}}
											>
												Скачать
											</button>
										</div>
									</div>
								)}

								<div className={styles.inviteDetails}>
									<div className={styles.detail}>
										<span className={styles.detailLabel}>Создан:</span>
										<span className={styles.detailValue}>{formatDate(invite.createdAt)}</span>
									</div>
									<div className={styles.detail}>
										<span className={styles.detailLabel}>Истекает:</span>
										<span className={styles.detailValue}>
											{formatDate(invite.expiresAt)}
											{isExpired(invite.expiresAt) && (
												<span className={styles.expiredBadge}>Истек</span>
											)}
										</span>
									</div>
									{invite.usedBy && invitedUsers[invite.id] && (
										<div className={styles.detail}>
											<span className={styles.detailLabel}>Приглашен:</span>
											<span className={styles.detailValue}>
												<div className={styles.invitedUser}>
													<div className={styles.userEmail}>{invitedUsers[invite.id].email}</div>
													<div className={styles.userRole}>
														<span
															className={styles.roleBadge}
															style={{ backgroundColor: getTypeColor(invitedUsers[invite.id].role as InviteType) }}
														>
															{getTypeLabel(invitedUsers[invite.id].role as InviteType)}
														</span>
													</div>
													<div className={styles.userDate}>
														{formatDate(invitedUsers[invite.id].createdAt)}
													</div>
												</div>
											</span>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div >
	)
}
