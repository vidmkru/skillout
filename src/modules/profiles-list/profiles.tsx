"use client"
import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'
import { useRouter } from 'next/navigation'

import { Wrapper, Heading, Button } from '@/ui'
import { axiosInstance } from '@/shared/api'
import { useAuth } from '@/shared/hooks/useAuth'
import type { CreatorProfile, PaginatedResponse } from '@/shared/types/database'
import { UserRole } from '@/shared/types/enums'
import Image from 'next/image'

import styles from './profiles.module.scss'

interface ProfilesListProps { className?: string }

const ProfilesList: FC<ProfilesListProps> = ({ className }) => {
	console.log('🔍 ProfilesList: Component rendered')

	const router = useRouter()
	const { user } = useAuth()
	const [profiles, setProfiles] = useState<CreatorProfile[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)

	const fetchProfiles = async (pageNum: number = 1) => {
		try {
			console.log('🔍 ProfilesList: Fetching profiles, page:', pageNum)
			setLoading(true)
			const response = await axiosInstance.get<{ success: boolean; data: PaginatedResponse<CreatorProfile> }>(
				`/api/profiles?page=${pageNum}&limit=12`
			)

			console.log('🔍 ProfilesList: Response received:', response.data)

			if (response.data.success && response.data.data) {
				console.log('✅ ProfilesList: Profiles count:', response.data.data.items.length)
				if (pageNum === 1) {
					setProfiles(response.data.data.items)
				} else {
					setProfiles(prev => [...prev, ...response.data.data!.items])
				}
				setHasMore(response.data.data.page < response.data.data.totalPages)
			} else {
				console.log('❌ ProfilesList: Response not successful')
				setError('Failed to load profiles')
			}
		} catch (err) {
			console.error('❌ ProfilesList: Error fetching profiles:', err)
			setError('Failed to load profiles')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchProfiles()
	}, [])

	const loadMore = () => {
		if (!loading && hasMore) {
			const nextPage = page + 1
			setPage(nextPage)
			fetchProfiles(nextPage)
		}
	}

	const handleProfileClick = (id: string) => {
		// Use profile ID (which is the same as user ID)
		router.push(`/profile/${id}`)
	}

	// Check if user can see contacts (only admins can see contacts)
	const canSeeContacts = user?.role === UserRole.Admin

	if (error) {
		return (
			<section className={classNames(styles.root, className)}>
				<Wrapper>
					<Heading tagName="h2">Профили</Heading>
					<div className={styles.error}>
						<p>{error}</p>
						<Button onClick={() => fetchProfiles()}>Попробовать снова</Button>
					</div>
				</Wrapper>
			</section>
		)
	}

	return (
		<section className={classNames(styles.root, className)}>
			<Wrapper>
				<Heading tagName="h2">Профили специалистов</Heading>

				{/* Debug info */}
				<div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
					Debug: loading={loading.toString()}, profiles.length={profiles.length}, error={error || 'none'}, userRole={user?.role || 'none'}, canSeeContacts={canSeeContacts.toString()}
				</div>

				{loading && profiles.length === 0 ? (
					<div className={styles.loading}>Загрузка профилей...</div>
				) : (
					<>
						<div className={styles.grid}>
							{profiles.map((profile) => (
								<article key={profile.id} className={styles.card} onClick={() => handleProfileClick(profile.id)}>
									<div className={styles.avatar}>
										{profile.avatar ? (
											<Image
												src={profile.avatar}
												alt={profile.name}
												width={80}
												height={80}
												className={styles.avatarImage}
											/>
										) : (
											<div className={styles.avatarPlaceholder}>
												{profile.name.charAt(0).toUpperCase()}
											</div>
										)}
									</div>
									<div className={styles.content}>
										<h3 className={styles.name}>{profile.name}</h3>
										<p className={styles.bio}>{profile.bio}</p>
										<div className={styles.specialization}>
											{profile.specialization.slice(0, 2).map((spec, i) => (
												<span key={i} className={styles.tag}>{spec}</span>
											))}
											{profile.specialization.length > 2 && (
												<span className={styles.more}>+{profile.specialization.length - 2}</span>
											)}
										</div>
										<div className={styles.rating}>
											<span className={styles.stars}>★★★★★</span>
											<span className={styles.ratingValue}>{profile.rating.toFixed(1)}</span>
										</div>

										{/* Contacts section - only visible to admins and producers */}
										{canSeeContacts && profile.contacts && (
											<div className={styles.contacts}>
												{profile.contacts.telegram && (
													<div className={styles.contactItem}>
														<span className={styles.contactLabel}>Telegram:</span>
														<span className={styles.contactValue}>{profile.contacts.telegram}</span>
													</div>
												)}
												{profile.contacts.instagram && (
													<div className={styles.contactItem}>
														<span className={styles.contactLabel}>Instagram:</span>
														<span className={styles.contactValue}>{profile.contacts.instagram}</span>
													</div>
												)}
												{profile.contacts.behance && (
													<div className={styles.contactItem}>
														<span className={styles.contactLabel}>Behance:</span>
														<span className={styles.contactValue}>{profile.contacts.behance}</span>
													</div>
												)}
												{profile.contacts.linkedin && (
													<div className={styles.contactItem}>
														<span className={styles.contactLabel}>LinkedIn:</span>
														<span className={styles.contactValue}>{profile.contacts.linkedin}</span>
													</div>
												)}
											</div>
										)}
									</div>

									{/* Paywall overlay for non-admin users */}
									{!canSeeContacts && (
										<div className={styles.paywallOverlay}>
											<div className={styles.paywallContent}>
												<div className={styles.paywallIcon}>🔒</div>
												<div className={styles.paywallText}>
													Контакты доступны только для администраторов
												</div>
												<button className={styles.paywallButton} onClick={(e) => {
													e.stopPropagation()
													router.push('/subscriptions')
												}}>
													Подписаться
												</button>
											</div>
										</div>
									)}
								</article>
							))}
						</div>

						{hasMore && (
							<div className={styles.loadMore}>
								<Button onClick={loadMore} disabled={loading}>
									{loading ? 'Загрузка...' : 'Загрузить еще'}
								</Button>
							</div>
						)}
					</>
				)}
			</Wrapper>
		</section>
	)
}

export default ProfilesList
