"use client"
import { FC, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import classNames from 'classnames'
import { useRouter, useSearchParams } from 'next/navigation'

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
	const searchParams = useSearchParams()
	const { user, isAuthenticated } = useAuth()

	// Get user type from URL params (creators, producers, or all)
	const userType = searchParams.get('type') || 'creators'
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
	const [selectedProfile, setSelectedProfile] = useState<CreatorProfile | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

	// Ref to store the latest fetchProfiles function
	const fetchProfilesRef = useRef<typeof fetchProfiles>()

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

	// Build query parameters for API
	const buildQueryParams = useCallback((pageNum: number) => {
		const params = new URLSearchParams()
		params.append('page', pageNum.toString())
		params.append('limit', '12')

		// Add user type filter
		params.append('userType', userType)

		if (filters.search) {
			params.append('search', filters.search)
		}

		if (filters.skills.length > 0) {
			params.append('skills', filters.skills.join(','))
		}

		if (filters.programs.length > 0) {
			params.append('programs', filters.programs.join(','))
		}

		if (filters.experience) {
			const experienceMap: Record<string, string> = {
				'менее 1 года': 'lt1',
				'1-2 года': '1-2',
				'2-5 лет': '2+',
				'больше 5 лет': '2+'
			}
			params.append('experience', experienceMap[filters.experience])
		}

		if (filters.hackathon !== null) {
			params.append('hackathon', filters.hackathon.toString())
		}

		if (filters.city) {
			params.append('city', filters.city)
		}

		if (filters.withPortfolio) {
			params.append('withPortfolio', 'true')
		}

		return params.toString()
	}, [filters, userType])

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
					// User type filter
					if (userType === 'creators' && profile.isPro) {
						return false
					}
					if (userType === 'producers' && !profile.isPro) {
						return false
					}

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

				// Apply sorting for producers
				if (userType === 'producers') {
					filteredProfiles.sort((a, b) => {
						const nameA = a.name.toLowerCase()
						const nameB = b.name.toLowerCase()
						return sortOrder === 'asc'
							? nameA.localeCompare(nameB, 'ru')
							: nameB.localeCompare(nameA, 'ru')
					})
				}

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

			const queryParams = buildQueryParams(pageNum)
			console.log('🔍 ProfilesList: API query params:', queryParams)
			const response = await axiosInstance.get<{ success: boolean; data: PaginatedResponse<CreatorProfile> }>(
				`/api/profiles?${queryParams}`
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
	}, [filters, mockProfiles, buildQueryParams, userType, sortOrder])

	// Update ref when fetchProfiles changes
	useEffect(() => {
		fetchProfilesRef.current = fetchProfiles
	}, [fetchProfiles])

	useEffect(() => {
		if (fetchProfilesRef.current) {
			fetchProfilesRef.current()
		}
	}, [])

	// Reload profiles when userType changes
	useEffect(() => {
		setPage(1)
		if (fetchProfilesRef.current) {
			fetchProfilesRef.current(1)
		}
	}, [userType])

	// Reload profiles when sort order changes (for producers)
	useEffect(() => {
		if (userType === 'producers') {
			setPage(1)
			if (fetchProfilesRef.current) {
				fetchProfilesRef.current(1)
			}
		}
	}, [sortOrder, userType])

	// Auto-apply all filters with smart debounce
	useEffect(() => {
		// Check if any text-based filters changed (need debounce)
		const textFiltersChanged = filters.search !== '' || filters.city !== ''

		// Check if any immediate filters changed (no debounce needed)
		const immediateFiltersChanged = filters.skills.length > 0 ||
			filters.programs.length > 0 ||
			filters.experience !== '' ||
			filters.hackathon !== null ||
			filters.withPortfolio

		if (immediateFiltersChanged) {
			// Apply immediately for checkboxes/selects
			setPage(1)
			if (fetchProfilesRef.current) {
				fetchProfilesRef.current(1)
			}
		} else if (textFiltersChanged) {
			// Apply with debounce for text inputs
			const timeoutId = setTimeout(() => {
				setPage(1)
				if (fetchProfilesRef.current) {
					fetchProfilesRef.current(1)
				}
			}, 500)

			return () => clearTimeout(timeoutId)
		}
	}, [filters.search, filters.city, filters.skills, filters.programs, filters.experience, filters.hackathon, filters.withPortfolio])

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
		if (fetchProfilesRef.current) {
			fetchProfilesRef.current(1)
		}
	}

	const handleProfileClick = (profile: CreatorProfile) => {
		setSelectedProfile(profile)
		setShowModal(true)
	}

	const handleCloseModal = () => {
		setShowModal(false)
		setSelectedProfile(null)
	}

	const handleViewFullProfile = (id: string) => {
		handleCloseModal()
		router.push(`/profile/${id}`)
	}

	// Check if user can see contacts (only authenticated creators and admins can see contacts)
	const canSeeContacts = isAuthenticated && (user?.role === UserRole.Admin || user?.role === UserRole.Creator || user?.role === UserRole.Production)

	if (error) {
		return (
			<section className={classNames(styles.root, className)}>
				<Wrapper>
					<Heading tagName="h2">
						{userType === 'creators' ? 'Креаторы' :
							userType === 'producers' ? 'Продакшны и продюсеры' :
								'Профили'}
					</Heading>
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
				<Heading tagName="h2">
					{userType === 'creators' ? 'Креаторы' :
						userType === 'producers' ? 'Продакшны и продюсеры' :
							'Профили специалистов'}
				</Heading>

				{/* Search and Filters */}
				<div className={styles.searchControls}>
					<div className={styles.searchBar}>
						<input
							type="text"
							placeholder={userType === 'producers' ? "Поиск по названию..." : "Поиск по имени или описанию..."}
							value={filters.search}
							onChange={handleSearchChange}
							className={styles.searchInput}
						/>
						{userType === 'creators' && (
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={styles.filterToggle}
							>
								{showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
							</button>
						)}
						{userType === 'producers' && (
							<button
								onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
								className={styles.filterToggle}
							>
								{sortOrder === 'asc' ? 'А-Я' : 'Я-А'}
							</button>
						)}
					</div>

					{showFilters && userType === 'creators' && (
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
								<button onClick={clearFilters} className={styles.clearButton}>
									Очистить фильтры
								</button>
							</div>
						</div>
					)}
				</div>

				{loading && profiles.length === 0 ? (
					<div className={styles.loading}>Загрузка профилей...</div>
				) : profiles.length === 0 ? (
					<div className={styles.noResults}>
						<h3>Ничего не найдено</h3>
						<p>Попробуйте изменить параметры поиска или фильтры</p>
						<button onClick={clearFilters} className={styles.clearButton}>
							Очистить все фильтры
						</button>
					</div>
				) : (
					<>
						<div className={styles.grid}>
							{profiles.map((profile) => (
								<article key={profile.id} className={styles.card} onClick={() => handleProfileClick(profile)}>
									{userType === 'producers' ? (
										// Simplified card for producers
										<div className={styles.content}>
											<h3 className={styles.name}>{profile.name}</h3>
											{/* City - extract from bio or use placeholder */}
											<div className={styles.producerInfo}>
												<span className={styles.city}>
													{profile.bio.includes('Москва') ? 'Москва' :
														profile.bio.includes('Санкт-Петербург') ? 'Санкт-Петербург' :
															profile.bio.includes('город') ? 'Город указан' : 'Город не указан'}
												</span>
												{/* Website - use behance or linkedin as website */}
												<span className={styles.website}>
													{profile.contacts.behance ? 'Behance' :
														profile.contacts.linkedin ? 'LinkedIn' : 'Сайт не указан'}
												</span>
											</div>
										</div>
									) : (
										// Full card for creators
										<>
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
										</>
									)}

									{/* Contacts section - only visible to creators and admins */}
									{userType === 'creators' && canSeeContacts && profile.contacts && (
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

									{/* Paywall overlay for non-creator users */}
									{userType === 'creators' && !canSeeContacts && (
										<div className={styles.paywallOverlay}>
											<div className={styles.paywallContent}>
												<div className={styles.paywallIcon}>🔒</div>
												<div className={styles.paywallText}>
													{!isAuthenticated
														? "Доступ только по инвайтам. Как получить?"
														: "Контакты доступны только для креаторов и администраторов"
													}
												</div>
												<button className={styles.paywallButton} onClick={(e) => {
													e.stopPropagation()
													router.push(!isAuthenticated ? '/register' : '/subscriptions')
												}}>
													{!isAuthenticated ? 'Зарегистрироваться' : 'Подписаться'}
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

			{/* Profile Modal */}
			{showModal && selectedProfile && (
				<div className={styles.modalOverlay} onClick={handleCloseModal}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>{selectedProfile.name}</h2>
							<button className={styles.closeButton} onClick={handleCloseModal}>
								×
							</button>
						</div>

						<div className={styles.modalContent}>
							<div className={styles.modalLeft}>
								<div className={styles.modalAvatar}>
									{selectedProfile.avatar ? (
										<Image
											src={selectedProfile.avatar}
											alt={selectedProfile.name}
											width={200}
											height={200}
											className={styles.modalAvatarImage}
										/>
									) : (
										<div className={styles.modalAvatarPlaceholder}>
											{selectedProfile.name.charAt(0).toUpperCase()}
										</div>
									)}
								</div>

								{canSeeContacts && (
									<div className={styles.socialLinks}>
										{selectedProfile.contacts.telegram && (
											<a href={`https://t.me/${selectedProfile.contacts.telegram.replace('@', '')}`} className={styles.socialLink}>
												📱
											</a>
										)}
										{selectedProfile.contacts.instagram && (
											<a href={`https://instagram.com/${selectedProfile.contacts.instagram.replace('@', '')}`} className={styles.socialLink}>
												📷
											</a>
										)}
										{selectedProfile.contacts.linkedin && (
											<a href={`https://linkedin.com/in/${selectedProfile.contacts.linkedin}`} className={styles.socialLink}>
												💼
											</a>
										)}
										{selectedProfile.contacts.behance && (
											<a href={`https://behance.net/${selectedProfile.contacts.behance}`} className={styles.socialLink}>
												🎨
											</a>
										)}
									</div>
								)}
							</div>

							<div className={styles.modalRight}>
								<div className={styles.profileInfo}>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Специализация:</span>
										<span className={styles.infoValue}>{selectedProfile.specialization.join(', ')}</span>
									</div>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Инструменты:</span>
										<span className={styles.infoValue}>{selectedProfile.tools.join(', ')}</span>
									</div>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Опыт:</span>
										<span className={styles.infoValue}>
											{selectedProfile.experience === ExperienceLevel.LessThanYear ? 'Менее 1 года' :
												selectedProfile.experience === ExperienceLevel.OneToTwo ? '1-2 года' :
													'2+ года'}
										</span>
									</div>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Рейтинг:</span>
										<span className={styles.infoValue}>
											<span className={styles.stars}>★★★★★</span>
											{selectedProfile.rating.toFixed(1)}
										</span>
									</div>
									{selectedProfile.clients.length > 0 && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Клиенты:</span>
											<span className={styles.infoValue}>{selectedProfile.clients.join(', ')}</span>
										</div>
									)}
								</div>

								<div className={styles.bio}>
									<p>{selectedProfile.bio}</p>
								</div>

								{selectedProfile.portfolio.length > 0 && (
									<div className={styles.portfolio}>
										<h4>Портфолио ({selectedProfile.portfolio.length})</h4>
										<div className={styles.portfolioItems}>
											{selectedProfile.portfolio.slice(0, 3).map((item) => (
												<div key={item.id} className={styles.portfolioItem}>
													{item.videoUrl && (
														<a href={item.videoUrl} target="_blank" rel="noopener noreferrer">
															{item.title}
														</a>
													)}
												</div>
											))}
											{selectedProfile.portfolio.length > 3 && (
												<div className={styles.portfolioMore}>
													+{selectedProfile.portfolio.length - 3} еще
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>

						<div className={styles.modalActions}>
							<button
								onClick={() => handleViewFullProfile(selectedProfile.id)}
								className={styles.fullProfileButton}
							>
								Полная страница профиля
							</button>
							<button onClick={handleCloseModal} className={styles.closeModalButton}>
								Закрыть
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	)
}

export default ProfilesList
