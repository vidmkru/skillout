"use client"
import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'

import { Wrapper, Button, Input, Heading } from '@/ui'
import { axiosInstance } from '@/shared/api'
import type { Invite } from '@/shared/types/database'

import styles from './invites.module.scss'

const Invites: FC = () => {
	const [quota, setQuota] = useState(0)
	const [email, setEmail] = useState('')
	const [invites, setInvites] = useState<Invite[]>([])
	const [loading, setLoading] = useState(true)
	const [sending, setSending] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchInvites = async () => {
		try {
			setLoading(true)
			const response = await axiosInstance.get<{ success: boolean; data: { quota: number; invites: Invite[] } }>('/api/invites')

			if (response.data.success && response.data.data) {
				setQuota(response.data.data.quota)
				setInvites(response.data.data.invites)
			} else {
				setError('Failed to load invites')
			}
		} catch (err) {
			console.error('Error fetching invites:', err)
			setError('Failed to load invites')
		} finally {
			setLoading(false)
		}
	}

	const sendInvite = async () => {
		if (!email.trim()) return

		try {
			setSending(true)
			const response = await axiosInstance.post<{ success: boolean; message: string }>('/api/invites', {
				email: email.trim()
			})

			if (response.data.success) {
				setEmail('')
				// Refresh invites list
				await fetchInvites()
			} else {
				setError(response.data.message || 'Failed to send invite')
			}
		} catch (err: unknown) {
			console.error('Error sending invite:', err)
			const errorMessage = err instanceof Error ? err.message : 'Failed to send invite'
			setError(errorMessage)
		} finally {
			setSending(false)
		}
	}

	useEffect(() => {
		fetchInvites()
	}, [])

	const canSend = quota > 0 && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

	if (loading) {
		return (
			<section className={classNames(styles.root)}>
				<Wrapper>
					<div className={styles.loading}>Загрузка инвайтов...</div>
				</Wrapper>
			</section>
		)
	}

	return (
		<section className={classNames(styles.root)}>
			<Wrapper>
				<Heading tagName="h2">Инвайты</Heading>

				{error && (
					<div className={styles.error}>
						<p>{error}</p>
						<Button onClick={() => setError(null)}>Закрыть</Button>
					</div>
				)}

				<div className={styles.row}>
					<div className={styles.quota}>Доступно: {quota}</div>
				</div>

				<div className={styles.row}>
					<Input
						placeholder="email получателя"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && canSend && sendInvite()}
					/>
					<Button
						onClick={sendInvite}
						disabled={!canSend || sending}
					>
						{sending ? 'Отправка...' : 'Выдать инвайт'}
					</Button>
				</div>

				<div className={styles.list}>
					{invites.length === 0 ? (
						<p className={styles.empty}>Инвайты не выдавались</p>
					) : (
						invites.map((invite) => (
							<div key={invite.code} className={styles.inviteItem}>
								<span className={styles.code}>{invite.code}</span>
								<span className={styles.arrow}>→</span>
								<span className={styles.email}>{invite.issuedTo || 'Не указан'}</span>
								<span className={styles.status}>
									{invite.used ? (
										<span className={styles.used}>(использован)</span>
									) : (
										<span className={styles.pending}>(ожидает)</span>
									)}
								</span>
								<span className={styles.date}>
									{new Date(invite.createdAt).toLocaleDateString()}
								</span>
							</div>
						))
					)}
				</div>
			</Wrapper>
		</section>
	)
}

export default Invites
