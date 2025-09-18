"use client"
import { FC, useEffect, useState, useCallback, useMemo } from 'react'
import classNames from 'classnames'
import { useRouter } from 'next/navigation'

import { Wrapper, Heading, Button } from '@/ui'
import { axiosInstance } from '@/shared/api'
import { useAuth } from '@/shared/hooks/useAuth'
import type { CreatorProfile, PaginatedResponse } from '@/shared/types/database'
import { UserRole, ExperienceLevel } from '@/shared/types/enums'
import Image from 'next/image'

import styles from './profiles.module.scss'

interface ProfilesListProps { className?: string }

interface ProfileFilters {
	search: string
	skills: string[]
	programs: string[]
	experience: string
	hackathon: boolean | null
	city: string
	withPortfolio: boolean
}

// Filter options
const SKILLS_OPTIONS = [
	'Motion Graphics',
	'Video Editing',
	'3D Animation',
	'AI Video Generation',
	'Machine Learning',
	'Computer Vision',
	'Creative Direction',
	'Brand Strategy',
	'Content Creation',
	'After Effects',
	'Cinema 4D',
	'Blender',
	'Runway ML',
	'Stable Video Diffusion',
	'Python',
	'Figma',
	'Adobe Creative Suite',
	'Midjourney'
]

const PROGRAMS_OPTIONS = [
	'After Effects',
	'Cinema 4D',
	'Blender',
	'Runway ML',
	'Stable Video Diffusion',
	'Python',
	'Figma',
	'Adobe Creative Suite',
	'Midjourney',
	'Premiere Pro',
	'DaVinci Resolve',
	'Unity',
	'Unreal Engine'
]

const EXPERIENCE_OPTIONS = [
	'менее 1 года',
	'1-2 года',
	'2-5 лет',
	'больше 5 лет'
]

const ProfilesList: FC<ProfilesListProps> = ({ className }) => {
	console.log('🔍 ProfilesList: Component rendered')

	const router = useRouter()
	const { user } = useAuth()
	const [profiles, setProfiles] = useState<CreatorProfile[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState(1)
	const [hasMore, setHasMore] = useState(true)

	// Filter states
	const [filters, setFilters] = useState<ProfileFilters>({
		search: '',
		skills: [],
		programs: [],
		experience: '',
		hackathon: null,
		city: '',
		withPortfolio: false
	})
	const [showFilters, setShowFilters] = useState(false)

	// Mock profiles data
	const mockProfiles = useMemo((): CreatorProfile[] => [
		{
			id: 'profile-1',
			userId: 'user-1',
			name: 'Анна Смирнова',
			avatar: '',
			bio: 'Специалист по генеративному видео с 3-летним опытом. Создаю креативные ролики для брендов.',
			specialization: ['Motion Graphics', 'Video Editing', '3D Animation'],
			tools: ['After Effects', 'Cinema 4D', 'Blender'],
			experience: ExperienceLevel.OneToTwo,
			clients: ['Nike', 'Adidas', 'Coca-Cola'],
			portfolio: [{ id: '1', title: 'Nike Campaign', videoUrl: 'https://example.com', tags: ['motion', 'branding'], createdAt: new Date().toISOString() }],
			achievements: [],
			rating: 4.8,
			recommendations: [],
			badges: [],
			contacts: {
				telegram: '@anna_sm',
				instagram: '@anna_motion'
			},
			isPublic: true,
			isPro: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: 'profile-2',
			userId: 'user-2',
			name: 'Дмитрий Козлов',
			avatar: '',
			bio: 'Эксперт по AI-генерации видео. Работаю с новейшими технологиями создания контента.',
			specialization: ['AI Video Generation', 'Machine Learning', 'Computer Vision'],
			tools: ['Runway ML', 'Stable Video Diffusion', 'Python'],
			experience: ExperienceLevel.TwoPlus,
			clients: ['Google', 'Microsoft', 'Tesla'],
			portfolio: [{ id: '2', title: 'AI Demo', videoUrl: 'https://example.com', tags: ['ai', 'video'], createdAt: new Date().toISOString() }],
			achievements: [],
			rating: 4.9,
			recommendations: [],
			badges: [],
			contacts: {
				telegram: '@dmitry_ai',
				linkedin: 'dmitry-kozlov-ai'
			},
			isPublic: true,
			isPro: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: 'profile-3',
			userId: 'user-3',
			name: 'Елена Петрова',
			avatar: '',
			bio: 'Креативный директор с фокусом на генеративном контенте. 5+ лет в индустрии.',
			specialization: ['Creative Direction', 'Brand Strategy', 'Content Creation'],
			tools: ['Figma', 'Adobe Creative Suite', 'Midjourney'],
			experience: ExperienceLevel.TwoPlus,
			clients: ['Apple', 'Samsung', 'Spotify'],
			portfolio: [{ id: '3', title: 'Brand Campaign', videoUrl: 'https://example.com', tags: ['branding', 'creative'], createdAt: new Date().toISOString() }],
			achievements: [],
			rating: 4.7,
			recommendations: [],
			badges: [],
			contacts: {
				telegram: '@elena_creative',
				behance: 'elena-petrov'
			},
			isPublic: true,
			isPro: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: 'profile-4',
			userId: 'user-4',
			name: 'Максим Волков',
			avatar: '',
			bio: 'Motion дизайнер с опытом работы в рекламе. Специализируюсь на 3D анимации.',
			specialization: ['3D Animation', 'Motion Graphics'],
			tools: ['Cinema 4D', 'After Effects', 'Blender'],
			experience: ExperienceLevel.OneToTwo,
			clients: ['BMW', 'Mercedes', 'Audi'],
			portfolio: [],
			achievements: [],
			rating: 4.6,
			recommendations: [],
			badges: [],
			contacts: {
				telegram: '@max_3d',
				instagram: '@max_motion'
			},
			isPublic: true,
			isPro: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: 'profile-5',
			userId: 'user-5',
			name: 'София Новикова',
			avatar: '',
			bio: 'AI-художник и генеративный дизайнер. Создаю уникальный контент с помощью ИИ.',
			specialization: ['AI Video Generation', 'Creative Direction'],
			tools: ['Midjourney', 'Runway ML', 'Stable Video Diffusion'],
			experience: ExperienceLevel.OneToTwo,
			clients: ['Netflix', 'Disney', 'Warner Bros'],
			portfolio: [{ id: '5', title: 'AI Art Project', videoUrl: 'https://example.com', tags: ['ai', 'art'], createdAt: new Date().toISOString() }],
			achievements: [],
			rating: 4.9,
			recommendations: [],
			badges: [],
			contacts: {
				telegram: '@sofia_ai',
				behance: 'sofia-ai-art'
			},
			isPublic: true,
			isPro: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}
	], [])

	const fetchProfiles = useCallback(async (pageNum: number = 1) => {
		try {
			console.log('🔍 ProfilesList: Fetching profiles, page:', pageNum)
			setLoading(true)

			// Mock data for local testing
			if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
				console.log('🔧 Using mock profiles data for local testing')

				// Simulate API delay
				await new Promise(resolve => setTimeout(resolve, 500))

				// Apply filters
				const filteredProfiles = mockProfiles.filter((profile: CreatorProfile) => {
					// Search filter
					if (filters.search && !profile.name.toLowerCase().includes(filters.search.toLowerCase()) &&
						!profile.bio.toLowerCase().includes(filters.search.toLowerCase())) {
						return false
					}

					// Skills filter
					if (filters.skills.length > 0 && !filters.skills.some(skill =>
						profile.specialization.includes(skill) || profile.tools.includes(skill))) {
						return false
					}

					// Programs filter
					if (filters.programs.length > 0 && !filters.programs.some(program =>
						profile.tools.includes(program))) {
						return false
					}

					// Experience filter
					if (filters.experience) {
						const experienceMap: Record<string, ExperienceLevel> = {
							'менее 1 года': ExperienceLevel.LessThanYear,
							'1-2 года': ExperienceLevel.OneToTwo,
							'2-5 лет': ExperienceLevel.TwoPlus,
							'больше 5 лет': ExperienceLevel.TwoPlus
						}
						if (profile.experience !== experienceMap[filters.experience]) {
							return false
						}
					}

					// Portfolio filter
					if (filters.withPortfolio && profile.portfolio.length === 0) {
						return false
					}

					return true
				})

				// Simulate pagination
				const startIndex = (pageNum - 1) * 12
				const endIndex = startIndex + 12
				const pageProfiles = filteredProfiles.slice(startIndex, endIndex)

				if (pageNum === 1) {
					setProfiles(pageProfiles)
				} else {
					setProfiles(prev => [...prev, ...pageProfiles])
				}
				setHasMore(endIndex < filteredProfiles.length)

				return
			}

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
	}, [filters, mockProfiles])

	useEffect(() => {
		fetchProfiles()
	}, [fetchProfiles])

	const loadMore = () => {
		if (!loading && hasMore) {
			const nextPage = page + 1
			setPage(nextPage)
			fetchProfiles(nextPage)
		}
	}

	// Filter handlers
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilters(prev => ({ ...prev, search: e.target.value }))
	}

	const toggleSkill = (skill: string) => {
		setFilters(prev => ({
			...prev,
			skills: prev.skills.includes(skill)
				? prev.skills.filter(s => s !== skill)
				: [...prev.skills, skill]
		}))
	}

	const toggleProgram = (program: string) => {
		setFilters(prev => ({
			...prev,
			programs: prev.programs.includes(program)
				? prev.programs.filter(p => p !== program)
				: [...prev.programs, program]
		}))
	}

	const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilters(prev => ({ ...prev, experience: e.target.value }))
	}

	const handleHackathonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value
		setFilters(prev => ({
			...prev,
			hackathon: value === 'all' ? null : value === 'yes'
		}))
	}

	const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilters(prev => ({ ...prev, city: e.target.value }))
	}

	const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilters(prev => ({ ...prev, withPortfolio: e.target.checked }))
	}

	const applyFilters = () => {
		setPage(1)
		fetchProfiles(1)
	}

	const clearFilters = () => {
		setFilters({
			search: '',
			skills: [],
			programs: [],
			experience: '',
			hackathon: null,
			city: '',
			withPortfolio: false
		})
		setPage(1)
		fetchProfiles(1)
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

				{/* Search and Filters */}
				<div className={styles.searchControls}>
					<div className={styles.searchBar}>
						<input
							type="text"
							placeholder="Поиск по имени или описанию..."
							value={filters.search}
							onChange={handleSearchChange}
							className={styles.searchInput}
						/>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className={styles.filterToggle}
						>
							{showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
						</button>
					</div>

					{showFilters && (
						<div className={styles.filtersPanel}>
							<div className={styles.filtersGrid}>
								{/* Skills Filter */}
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Навыки:</label>
									<div className={styles.checkboxGrid}>
										{SKILLS_OPTIONS.map(skill => (
											<label key={skill} className={styles.checkboxLabel}>
												<input
													type="checkbox"
													checked={filters.skills.includes(skill)}
													onChange={() => toggleSkill(skill)}
													className={styles.checkbox}
												/>
												{skill}
											</label>
										))}
									</div>
								</div>

								{/* Programs Filter */}
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Программы:</label>
									<div className={styles.checkboxGrid}>
										{PROGRAMS_OPTIONS.map(program => (
											<label key={program} className={styles.checkboxLabel}>
												<input
													type="checkbox"
													checked={filters.programs.includes(program)}
													onChange={() => toggleProgram(program)}
													className={styles.checkbox}
												/>
												{program}
											</label>
										))}
									</div>
								</div>

								{/* Experience Filter */}
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Опыт работы с ИИ:</label>
									<select
										value={filters.experience}
										onChange={handleExperienceChange}
										className={styles.select}
									>
										<option value="">Любой опыт</option>
										{EXPERIENCE_OPTIONS.map(exp => (
											<option key={exp} value={exp}>{exp}</option>
										))}
									</select>
								</div>

								{/* Hackathon Filter */}
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Статус &quot;Номинант SkillOut hackathon&quot;:</label>
									<select
										value={filters.hackathon === null ? 'all' : filters.hackathon ? 'yes' : 'no'}
										onChange={handleHackathonChange}
										className={styles.select}
									>
										<option value="all">Все</option>
										<option value="yes">Номинант</option>
										<option value="no">Не номинант</option>
									</select>
								</div>

								{/* City Filter */}
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Город:</label>
									<input
										type="text"
										placeholder="Введите город..."
										value={filters.city}
										onChange={handleCityChange}
										className={styles.input}
									/>
								</div>

								{/* Portfolio Filter */}
								<div className={styles.filterGroup}>
									<label className={styles.checkboxLabel}>
										<input
											type="checkbox"
											checked={filters.withPortfolio}
											onChange={handlePortfolioChange}
											className={styles.checkbox}
										/>
										С портфолио
									</label>
								</div>
							</div>

							<div className={styles.filterActions}>
								<button onClick={applyFilters} className={styles.applyButton}>
									Применить фильтры
								</button>
								<button onClick={clearFilters} className={styles.clearButton}>
									Очистить фильтры
								</button>
							</div>
						</div>
					)}
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
