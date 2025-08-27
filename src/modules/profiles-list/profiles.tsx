"use client"
import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'
import { useRouter } from 'next/navigation'

import { Wrapper, Heading, Button } from '@/ui'
import { axiosInstance } from '@/shared/api'
import type { CreatorProfile, PaginatedResponse } from '@/shared/types/database'
import Image from 'next/image'

import styles from './profiles.module.scss'

interface ProfilesListProps { className?: string }

const ProfilesList: FC<ProfilesListProps> = ({ className }) => {
	const router = useRouter()
	const [profiles, setProfiles] = useState<CreatorProfile[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)

	const fetchProfiles = async (pageNum: number = 1) => {
		try {
			setLoading(true)
			const response = await axiosInstance.get<{ success: boolean; data: PaginatedResponse<CreatorProfile> }>(
				`/api/profiles?page=${pageNum}&limit=12`
			)

			if (response.data.success && response.data.data) {
				if (pageNum === 1) {
					setProfiles(response.data.data.items)
				} else {
					setProfiles(prev => [...prev, ...response.data.data!.items])
				}
				setHasMore(response.data.data.page < response.data.data.totalPages)
			} else {
				setError('Failed to load profiles')
			}
		} catch (err) {
			console.error('Error fetching profiles:', err)
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
		router.push(`/profile/${id}`)
	}

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
									</div>
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
