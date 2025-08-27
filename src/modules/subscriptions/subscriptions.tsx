"use client"
import { FC, useState } from 'react'
import { useAtom } from 'jotai'

import { Wrapper, Heading, Button } from '@/ui'
import { axiosInstance } from '@/shared/api'
import { subscriptionAtom, SubscriptionTier } from '@/shared/atoms/subscriptionAtom'

import styles from './subscriptions.module.scss'

const tiers: { id: SubscriptionTier; title: string; price: string; features: string[] }[] = [
	{ id: 'free', title: 'Free', price: '0 ₽', features: ['Публичные профили', 'Ограниченные фильтры'] },
	{ id: 'producer', title: 'Producer Access', price: '2999 ₽/мес', features: ['Доступ к контактам', 'Инвайты', 'Поиск без лимитов'] },
	{ id: 'creator-pro', title: 'Creator Pro', price: '1999 ₽/мес', features: ['Больше инвайтов', 'Бейджи в профиле', 'Приоритет в поиске'] }
]

const Subscriptions: FC = () => {
	const [tier, setTier] = useAtom(subscriptionAtom)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const updateSubscription = async (newTier: SubscriptionTier) => {
		try {
			setLoading(true)
			setError(null)

			const response = await axiosInstance.put<{ success: boolean; message: string }>('/api/subscriptions', {
				tier: newTier
			})

			if (response.data.success) {
				setTier(newTier)
			} else {
				setError(response.data.message || 'Failed to update subscription')
			}
		} catch (err: unknown) {
			console.error('Error updating subscription:', err)
			const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription'
			setError(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	const handleTierSelect = (newTier: SubscriptionTier) => {
		if (newTier !== tier) {
			updateSubscription(newTier)
		}
	}

	return (
		<section className={styles.root}>
			<Wrapper>
				<Heading tagName="h2">Подписки</Heading>

				{error && (
					<div className={styles.error}>
						<p>{error}</p>
						<Button onClick={() => setError(null)}>Закрыть</Button>
					</div>
				)}

				<div className={styles.grid}>
					{tiers.map((t) => (
						<article key={t.id} className={`${styles.card} ${tier === t.id ? styles.active : ''}`}>
							<div className={styles.title}>{t.title}</div>
							<div className={styles.price}>{t.price}</div>
							<ul className={styles.features}>
								{t.features.map((f, i) => (
									<li key={i}>{f}</li>
								))}
							</ul>
							<div className={styles.action}>
								<Button
									onClick={() => handleTierSelect(t.id)}
									disabled={loading || tier === t.id}
								>
									{loading ? 'Обновление...' : tier === t.id ? 'Активна' : 'Выбрать'}
								</Button>
							</div>
						</article>
					))}
				</div>
			</Wrapper>
		</section>
	)
}

export default Subscriptions
