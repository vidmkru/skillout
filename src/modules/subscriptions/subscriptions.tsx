"use client"
import { FC } from 'react'
import { useAtom } from 'jotai'
import { Wrapper, Heading, Button } from '@/ui'
import { subscriptionAtom, SubscriptionTier } from '@/shared/atoms/subscriptionAtom'

import styles from './subscriptions.module.scss'

const tiers: { id: SubscriptionTier; title: string; price: string; features: string[] }[] = [
	{ id: 'free', title: 'Free', price: '0 ₽', features: ['Публичные профили', 'Ограниченные фильтры'] },
	{ id: 'producer', title: 'Producer Access', price: '₽', features: ['Доступ к контактам', 'Инвайты', 'Поиск без лимитов'] },
	{ id: 'creator-pro', title: 'Creator Pro', price: '₽', features: ['Больше инвайтов', 'Бейджи в профиле'] }
]

const Subscriptions: FC = () => {
	const [tier, setTier] = useAtom(subscriptionAtom)
	return (
		<section className={styles.root}>
			<Wrapper>
				<Heading tagName="h2">Подписки</Heading>
				<div className={styles.grid}>
					{tiers.map((t) => (
						<article key={t.id} className={styles.card}>
							<div className={styles.title}>{t.title}</div>
							<div className={styles.price}>{t.price}</div>
							<ul className={styles.features}>
								{t.features.map((f, i) => (
									<li key={i}>{f}</li>
								))}
							</ul>
							<div style={{ marginTop: 12 }}>
								<Button onClick={() => setTier(t.id)}>Выбрать</Button>
								{tier === t.id && '  (активна)'}
							</div>
						</article>
					))}
				</div>
			</Wrapper>
		</section>
	)
}

export default Subscriptions
