"use client"
import { FC, useMemo } from 'react'
import { Wrapper, Button } from '@/ui'
import { useAtom } from 'jotai'
import { subscriptionAtom } from '@/shared/atoms/subscriptionAtom'
import { Portfolio } from '@/modules/portfolio'

import styles from './details.module.scss'
import { ProfileDetailsProps } from './details.types'
import { CreatorProfile } from '@/shared/types/common'

const MOCK: Record<string, CreatorProfile> = {
	'1': { id: '1', name: 'Анна Видеомейкер', specialization: ['Видеомонтаж'], tools: ['Runway'], experience: '2+', rating: 4.8, badges: ['Hackathon Finalist', 'Expert Verified'] },
	'2': { id: '2', name: 'Иван CGI', specialization: ['CGI', '3D'], tools: ['Blender', 'MJ'], experience: '1-2', rating: 4.5, badges: ['Skillout Participant'] }
}

const ProfileDetails: FC<ProfileDetailsProps> = ({ id }) => {
	const profile = useMemo(() => MOCK[id], [id])
	const [tier] = useAtom(subscriptionAtom)

	if (!profile) return <Wrapper>Профиль не найден</Wrapper>

	return (
		<section className={styles.root}>
			<Wrapper>
				<header className={styles.header}>
					<div className={styles.avatar} />
					<div>
						<div>{profile.name}</div>
						<div>{profile.specialization.join(', ')}</div>
					</div>
				</header>

				<div className={styles.section}>
					<div>Инструменты: {profile.tools.join(', ')}</div>
					<div>Опыт: {profile.experience}</div>
					<div className={styles.rating}>Рейтинг: {profile.rating?.toFixed(1)}</div>
					<div className={styles.badges}>
						{(profile.badges || []).map((b, i) => (
							<span key={i} className={`${styles.badge} ${/Expert|VIP/i.test(b) ? styles['badge--vip'] : ''}`}>{b}</span>
						))}
					</div>
				</div>

				{tier === 'producer' ? (
					<div className={styles.section}>
						<div>Телеграм: @username</div>
						<div>Почта: user@example.com</div>
					</div>
				) : (
					<div className={styles.section}>
						<div className={styles.contacts}>Контакты скрыты. Доступ по подписке или инвайту.</div>
						<Button as="a" isRouteLink href="/subscriptions">Оформить доступ</Button>
					</div>
				)}
			</Wrapper>
			<Portfolio />
		</section>
	)
}

export default ProfileDetails
