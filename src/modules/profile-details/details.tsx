"use client"
import { FC, useEffect, useState, useCallback } from 'react'
import classNames from 'classnames'
import { useParams } from 'next/navigation'
import { useAtomValue } from 'jotai'

import { Wrapper, Heading, Button } from '@/ui'
import { axiosInstance } from '@/shared/api'
import { subscriptionAtom } from '@/shared/atoms/subscriptionAtom'
import type { CreatorProfile } from '@/shared/types/database'
import Image from 'next/image'

import styles from './details.module.scss'

interface ProfileDetailsProps { className?: string }

const ProfileDetails: FC<ProfileDetailsProps> = ({ className }) => {
	const params = useParams()
	const profileId = params.id as string
	const subscriptionTier = useAtomValue(subscriptionAtom)

	const [profile, setProfile] = useState<CreatorProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchProfile = useCallback(async () => {
		try {
			setLoading(true)
			const response = await axiosInstance.get<{ success: boolean; data: CreatorProfile }>(
				`/api/profiles/${profileId}`
			)

			if (response.data.success && response.data.data) {
				setProfile(response.data.data)
			} else {
				setError('Profile not found')
			}
		} catch (err) {
			console.error('Error fetching profile:', err)
			setError('Failed to load profile')
		} finally {
			setLoading(false)
		}
	}, [profileId])

	useEffect(() => {
		if (profileId) {
			fetchProfile()
		}
	}, [profileId, fetchProfile])

	const canViewContacts = subscriptionTier === 'producer' || subscriptionTier === 'creator-pro'

	if (loading) {
		return (
			<section className={classNames(styles.root, className)}>
				<Wrapper>
					<div className={styles.loading}>Загрузка профиля...</div>
				</Wrapper>
			</section>
		)
	}

	if (error || !profile) {
		return (
			<section className={classNames(styles.root, className)}>
				<Wrapper>
					<div className={styles.error}>
						<p>{error || 'Profile not found'}</p>
						<Button onClick={fetchProfile}>Попробовать снова</Button>
					</div>
				</Wrapper>
			</section>
		)
	}

	return (
		<section className={classNames(styles.root, className)}>
			<Wrapper>
				<div className={styles.header}>
					<div className={styles.avatar}>
						{profile.avatar ? (
							<Image
								src={profile.avatar}
								alt={profile.name}
								width={120}
								height={120}
								className={styles.avatarImage}
							/>
						) : (
							<div className={styles.avatarPlaceholder}>
								{profile.name.charAt(0).toUpperCase()}
							</div>
						)}
					</div>
					<div className={styles.info}>
						<Heading tagName="h1" className={styles.name}>{profile.name}</Heading>
						<p className={styles.bio}>{profile.bio}</p>
						<div className={styles.rating}>
							<span className={styles.stars}>★★★★★</span>
							<span className={styles.ratingValue}>{profile.rating.toFixed(1)}</span>
							<span className={styles.recommendations}>({profile.recommendations.length} рекомендаций)</span>
						</div>
					</div>
				</div>

				<div className={styles.badges}>
					{profile.badges.map((badge) => (
						<div key={badge.id} className={styles.badge} title={badge.description}>
							{badge.icon} {badge.name}
						</div>
					))}
				</div>

				<div className={styles.sections}>
					<div className={styles.section}>
						<h3>Специализация</h3>
						<div className={styles.tags}>
							{profile.specialization.map((spec, i) => (
								<span key={i} className={styles.tag}>{spec}</span>
							))}
						</div>
					</div>

					<div className={styles.section}>
						<h3>Инструменты</h3>
						<div className={styles.tags}>
							{profile.tools.map((tool, i) => (
								<span key={i} className={styles.tag}>{tool}</span>
							))}
						</div>
					</div>

					<div className={styles.section}>
						<h3>Опыт</h3>
						<p>{profile.experience}</p>
					</div>

					{profile.clients.length > 0 && (
						<div className={styles.section}>
							<h3>Клиенты</h3>
							<ul>
								{profile.clients.map((client, i) => (
									<li key={i}>{client}</li>
								))}
							</ul>
						</div>
					)}

					{profile.achievements.length > 0 && (
						<div className={styles.section}>
							<h3>Достижения</h3>
							<div className={styles.achievements}>
								{profile.achievements.map((achievement) => (
									<div key={achievement.id} className={styles.achievement}>
										<h4>{achievement.title}</h4>
										<p>{achievement.description}</p>
										<span className={styles.date}>{achievement.date}</span>
									</div>
								))}
							</div>
						</div>
					)}

					<div className={styles.section}>
						<h3>Контакты</h3>
						{canViewContacts ? (
							<div className={styles.contacts}>
								{profile.contacts.telegram && (
									<a href={`https://t.me/${profile.contacts.telegram}`} target="_blank" rel="noopener noreferrer">
										Telegram: @{profile.contacts.telegram}
									</a>
								)}
								{profile.contacts.instagram && (
									<a href={`https://instagram.com/${profile.contacts.instagram}`} target="_blank" rel="noopener noreferrer">
										Instagram: @{profile.contacts.instagram}
									</a>
								)}
								{profile.contacts.behance && (
									<a href={profile.contacts.behance} target="_blank" rel="noopener noreferrer">
										Behance
									</a>
								)}
								{profile.contacts.linkedin && (
									<a href={profile.contacts.linkedin} target="_blank" rel="noopener noreferrer">
										LinkedIn
									</a>
								)}
							</div>
						) : (
							<div className={styles.contactsGated}>
								<p>Контакты доступны только для подписчиков</p>
								<Button onClick={() => window.location.href = '/subscriptions'}>
									Оформить доступ
								</Button>
							</div>
						)}
					</div>
				</div>
			</Wrapper>
		</section>
	)
}

export default ProfileDetails
