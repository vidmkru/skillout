'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/ui/button'
import { Heading } from '@/ui/heading'
import { InviteType } from '@/shared/types/enums'
import { track } from '@/shared/analytics'
import styles from './invites.module.scss'

interface Invite {
	code: string
	inviteType: InviteType
	used: boolean
	usedAt?: string
	expiresAt: string
	createdAt: string
	issuedTo?: string
}

interface InviteQuota {
	creator: number
	creatorPro: number
	producer: number
}

interface InvitesData {
	quota: InviteQuota
	used: InviteQuota
	available: InviteQuota
	invites: Invite[]
}

export const Invites: React.FC = () => {
	const [invitesData, setInvitesData] = useState<InvitesData | null>(null)
	const [selectedType, setSelectedType] = useState<InviteType>(InviteType.Creator)
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')

	useEffect(() => {
		fetchInvites()
	}, [])

	const fetchInvites = async () => {
		try {
			const response = await fetch('/api/invites')
			if (response.ok) {
				const data = await response.json()
				setInvitesData(data)
			} else {
				setError('Не удалось загрузить инвайты')
			}
		} catch (error) {
			setError('Ошибка сети')
		}
	}

	const createInvite = async () => {
		setIsLoading(true)
		setMessage('')
		setError('')

		try {
			const response = await fetch('/api/invites', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					inviteType: selectedType
				}),
			})

			const data = await response.json()

			if (response.ok) {
				setMessage(`Инвайт создан: ${data.invite.code}`)
				track('invite_issued', { type: selectedType })
				fetchInvites() // Refresh the list
			} else {
				setError(data.error || 'Ошибка при создании инвайта')
			}
		} catch (error) {
			setError('Ошибка сети')
		} finally {
			setIsLoading(false)
		}
	}

	const copyToClipboard = (code: string) => {
		navigator.clipboard.writeText(code)
		setMessage('Код скопирован в буфер обмена')
		setTimeout(() => setMessage(''), 2000)
	}

	if (!invitesData) {
		return <div className={styles.loading}>Загрузка...</div>
	}

	const getInviteTypeLabel = (type: InviteType) => {
		switch (type) {
			case InviteType.Creator:
				return 'Креатор'
			case InviteType.CreatorPro:
				return 'Креатор Про'
			case InviteType.Producer:
				return 'Продюсер'
			default:
				return type
		}
	}

	return (
		<div className={styles.container}>
			<Heading size="md" tagName="h2" className={styles.title}>
				Управление инвайтами
			</Heading>

			<div className={styles.quotaInfo}>
				<div className={styles.quotaCard}>
					<h3>Квоты инвайтов</h3>
					<div className={styles.quotaGrid}>
						<div className={styles.quotaItem}>
							<span>Креаторы:</span>
							<span>{invitesData.used.creator}/{invitesData.quota.creator}</span>
						</div>
						<div className={styles.quotaItem}>
							<span>Креаторы Про:</span>
							<span>{invitesData.used.creatorPro}/{invitesData.quota.creatorPro}</span>
						</div>
						<div className={styles.quotaItem}>
							<span>Продюсеры:</span>
							<span>{invitesData.used.producer}/{invitesData.quota.producer}</span>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.createSection}>
				<Heading size="sm" tagName="h3" className={styles.sectionTitle}>
					Создать новый инвайт
				</Heading>

				<div className={styles.createForm}>
					<div className={styles.typeSelector}>
						<label>Тип инвайта:</label>
						<select
							value={selectedType}
							onChange={(e) => setSelectedType(e.target.value as InviteType)}
							className={styles.select}
						>
							{Object.values(InviteType).map((type) => (
								<option key={type} value={type}>
									{getInviteTypeLabel(type)}
								</option>
							))}
						</select>
					</div>

					<Button
						onClick={createInvite}
						disabled={isLoading || invitesData.available[selectedType as keyof InviteQuota] <= 0}
						className={styles.createButton}
					>
						{isLoading ? 'Создаем...' : 'Создать инвайт'}
					</Button>
				</div>
			</div>

			<div className={styles.invitesList}>
				<Heading size="sm" tagName="h3" className={styles.sectionTitle}>
					Ваши инвайты
				</Heading>

				{invitesData.invites.length === 0 ? (
					<p className={styles.emptyState}>У вас пока нет инвайтов</p>
				) : (
					<div className={styles.invitesGrid}>
						{invitesData.invites.map((invite) => (
							<div key={invite.code} className={styles.inviteCard}>
								<div className={styles.inviteHeader}>
									<span className={styles.inviteType}>
										{getInviteTypeLabel(invite.inviteType)}
									</span>
									<span className={`${styles.status} ${invite.used ? styles.used : styles.active}`}>
										{invite.used ? 'Использован' : 'Активен'}
									</span>
								</div>

								<div className={styles.inviteCode}>
									<code>{invite.code}</code>
									{!invite.used && (
										<Button
											onClick={() => copyToClipboard(invite.code)}
											className={styles.copyButton}
										>
											Копировать
										</Button>
									)}
								</div>

								<div className={styles.inviteDetails}>
									<p>Создан: {new Date(invite.createdAt).toLocaleDateString()}</p>
									<p>Истекает: {new Date(invite.expiresAt).toLocaleDateString()}</p>
									{invite.used && invite.issuedTo && (
										<p>Использован: {invite.issuedTo}</p>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{message && (
				<div className={styles.message}>
					{message}
				</div>
			)}

			{error && (
				<div className={styles.error}>
					{error}
				</div>
			)}
		</div>
	)
}
