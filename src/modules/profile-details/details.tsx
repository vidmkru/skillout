"use client"
import { FC, useEffect, useState, useCallback } from 'react'
import classNames from 'classnames'
import { useParams } from 'next/navigation'


import { Wrapper, Heading, Button } from '@/ui'
import { axiosInstance } from '@/shared/api'
import { useAuth } from '@/shared/hooks/useAuth'
import type { CreatorProfile } from '@/shared/types/database'
import { UserRole } from '@/shared/types/enums'
import Image from 'next/image'

import styles from './details.module.scss'

interface ProfileDetailsProps {
	className?: string
	id?: string
}

const ProfileDetails: FC<ProfileDetailsProps> = ({ className, id }) => {
	const params = useParams()
	const profileId = id || params.id as string
	const { user } = useAuth()

	const [profile, setProfile] = useState<CreatorProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchProfile = useCallback(async () => {
		try {
			console.log('🔍 ProfileDetails: Fetching profile for ID:', profileId)
			setLoading(true)
			const response = await axiosInstance.get<{ success: boolean; data: CreatorProfile }>(
				`/api/profiles/${profileId}`
			)

			console.log('🔍 ProfileDetails: Response received:', response.data)

			if (response.data.success && response.data.data) {
				console.log('✅ ProfileDetails: Profile loaded successfully:', response.data.data.name)
				setProfile(response.data.data)
			} else {
				console.log('❌ ProfileDetails: Profile not found in response')
				setError('Profile not found')
			}
		} catch (err) {
			console.error('❌ ProfileDetails: Error fetching profile:', err)
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

	const canViewContacts = user?.role === UserRole.Admin

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

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Специализация</h3>
					<div className={styles.specialization}>
						{profile.specialization.map((spec, i) => (
							<span key={i} className={styles.specializationItem}>{spec}</span>
						))}
					</div>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Инструменты</h3>
					<div className={styles.tools}>
						{profile.tools.map((tool, i) => (
							<span key={i} className={styles.tool}>{tool}</span>
						))}
					</div>
				</div>

				{profile.clients.length > 0 && (
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>Клиенты</h3>
						<div className={styles.clients}>
							{profile.clients.map((client, i) => (
								<span key={i} className={styles.client}>{client}</span>
							))}
						</div>
					</div>
				)}

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Контакты</h3>
					{canViewContacts ? (
						<div className={styles.contacts}>
							{profile.contacts.telegram && (
								<div className={styles.contactItem}>
									<span className={styles.contactLabel}>Telegram:</span>
									<a href={`https://t.me/${profile.contacts.telegram}`} target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
										@{profile.contacts.telegram}
									</a>
								</div>
							)}
							{profile.contacts.instagram && (
								<div className={styles.contactItem}>
									<span className={styles.contactLabel}>Instagram:</span>
									<a href={`https://instagram.com/${profile.contacts.instagram}`} target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
										@{profile.contacts.instagram}
									</a>
								</div>
							)}
							{profile.contacts.behance && (
								<div className={styles.contactItem}>
									<span className={styles.contactLabel}>Behance:</span>
									<a href={profile.contacts.behance} target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
										{profile.contacts.behance}
									</a>
								</div>
							)}
							{profile.contacts.linkedin && (
								<div className={styles.contactItem}>
									<span className={styles.contactLabel}>LinkedIn:</span>
									<a href={profile.contacts.linkedin} target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
										{profile.contacts.linkedin}
									</a>
								</div>
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
			</Wrapper>
		</section>
	)
}

export default ProfileDetails
