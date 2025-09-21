'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Wrapper, Heading, Button, Input } from '@/ui'
import { useAuth } from '@/shared/hooks/useAuth'
import { axiosInstance } from '@/shared/api'
import type { CreatorProfile } from '@/shared/types/database'
import { ExperienceLevel } from '@/shared/types/enums'
import classNames from 'classnames'

import styles from './settings-form.module.scss'

interface SettingsFormProps {
	className?: string
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ className }) => {
	const router = useRouter()
	const { user, isAuthenticated } = useAuth()

	const [profile, setProfile] = useState<CreatorProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	// Form fields
	const [formData, setFormData] = useState({
		name: '',
		bio: '',
		specialization: [] as string[],
		tools: [] as string[],
		experience: ExperienceLevel.LessThanYear,
		clients: [] as string[],
		contacts: {
			telegram: '',
			instagram: '',
			behance: '',
			linkedin: ''
		},
		isPublic: true
	})

	// Specialization options
	const specializationOptions = [
		'UI/UX Design',
		'Graphic Design',
		'Web Design',
		'Mobile Design',
		'Branding',
		'Illustration',
		'Animation',
		'Video Production',
		'Photography',
		'3D Modeling',
		'Frontend Development',
		'Backend Development',
		'Full Stack Development',
		'Mobile Development',
		'Game Development',
		'Data Science',
		'Machine Learning',
		'DevOps',
		'Product Management',
		'Marketing',
		'Content Creation',
		'Copywriting',
		'Project Management'
	]

	// Tools options
	const toolsOptions = [
		'Figma',
		'Adobe Photoshop',
		'Adobe Illustrator',
		'Adobe After Effects',
		'Adobe Premiere Pro',
		'Sketch',
		'InVision',
		'Principle',
		'Framer',
		'React',
		'Vue.js',
		'Angular',
		'Node.js',
		'Python',
		'JavaScript',
		'TypeScript',
		'HTML/CSS',
		'SASS/SCSS',
		'Git',
		'Docker',
		'AWS',
		'Google Cloud',
		'Firebase',
		'MongoDB',
		'PostgreSQL',
		'MySQL',
		'Redis',
		'GraphQL',
		'REST API',
		'Webpack',
		'Vite',
		'Next.js',
		'Nuxt.js',
		'Express.js',
		'Django',
		'Flask',
		'Laravel',
		'Ruby on Rails',
		'Unity',
		'Unreal Engine',
		'Blender',
		'Maya',
		'Cinema 4D',
		'ZBrush'
	]

	// Experience options
	const experienceOptions = [
		{ value: ExperienceLevel.LessThanYear, label: 'Менее 1 года' },
		{ value: ExperienceLevel.OneToTwo, label: '1-2 года' },
		{ value: ExperienceLevel.TwoPlus, label: '2+ года' }
	]

	// Redirect if not authenticated
	useEffect(() => {
		if (!isAuthenticated) {
			router.push('/login')
		}
	}, [isAuthenticated, router])

	// Fetch user profile
	const fetchProfile = useCallback(async () => {
		if (!user?.id) return

		try {
			setLoading(true)
			const response = await axiosInstance.get(`/api/profiles/user/${user.id}`)

			if (response.data.success && response.data.data) {
				const profileData = response.data.data
				setProfile(profileData)
				setFormData({
					name: profileData.name || '',
					bio: profileData.bio || '',
					specialization: profileData.specialization || [],
					tools: profileData.tools || [],
					experience: profileData.experience || ExperienceLevel.LessThanYear,
					clients: profileData.clients || [],
					contacts: {
						telegram: profileData.contacts?.telegram || '',
						instagram: profileData.contacts?.instagram || '',
						behance: profileData.contacts?.behance || '',
						linkedin: profileData.contacts?.linkedin || ''
					},
					isPublic: profileData.isPublic !== false
				})
			}
		} catch (err) {
			console.error('Error fetching profile:', err)
			setError('Ошибка загрузки профиля')
		} finally {
			setLoading(false)
		}
	}, [user?.id])

	useEffect(() => {
		fetchProfile()
	}, [fetchProfile])

	// Handle form field changes
	const handleInputChange = (field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}))
	}

	const handleContactChange = (field: string, value: string) => {
		setFormData(prev => ({
			...prev,
			contacts: {
				...prev.contacts,
				[field]: value
			}
		}))
	}

	const handleArrayChange = (field: 'specialization' | 'tools' | 'clients', value: string[]) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}))
	}

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!user?.id) return

		try {
			setSaving(true)
			setError(null)
			setSuccess(null)

			const response = await axiosInstance.put(`/api/profiles/user/${user.id}`, formData)

			if (response.data.success) {
				setSuccess('Профиль успешно обновлен!')
				// Refresh profile data
				await fetchProfile()
			} else {
				setError(response.data.message || 'Ошибка обновления профиля')
			}
		} catch (err) {
			console.error('Error updating profile:', err)
			setError('Ошибка обновления профиля')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<section className={classNames(styles.root, className)}>
				<Wrapper>
					<div className={styles.loading}>Загрузка настроек...</div>
				</Wrapper>
			</section>
		)
	}

	if (!isAuthenticated) {
		return null
	}

	return (
		<section className={classNames(styles.root, className)}>
			<Wrapper>
				<div className={styles.header}>
					<Heading tagName="h1">Настройки профиля</Heading>
					<p className={styles.subtitle}>
						Редактируйте информацию о себе. Email и роль изменить нельзя.
					</p>
				</div>

				{error && (
					<div className={styles.error}>
						{error}
					</div>
				)}

				{success && (
					<div className={styles.success}>
						{success}
					</div>
				)}

				<form onSubmit={handleSubmit} className={styles.form}>
					{/* Basic Information */}
					<div className={styles.section}>
						<Heading tagName="h2">Основная информация</Heading>

						<div className={styles.field}>
							<label className={styles.label}>Имя/Название</label>
							<Input
								type="text"
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder="Введите ваше имя или название компании"
								required
							/>
						</div>

						<div className={styles.field}>
							<label className={styles.label}>О себе</label>
							<textarea
								value={formData.bio}
								onChange={(e) => handleInputChange('bio', e.target.value)}
								placeholder="Расскажите о себе, своих навыках и опыте"
								className={styles.textarea}
								rows={4}
							/>
						</div>

						<div className={styles.field}>
							<label className={styles.label}>Опыт работы</label>
							<select
								value={formData.experience}
								onChange={(e) => handleInputChange('experience', e.target.value as ExperienceLevel)}
								className={styles.select}
							>
								{experienceOptions.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>

						<div className={styles.field}>
							<label className={styles.label}>
								<input
									type="checkbox"
									checked={formData.isPublic}
									onChange={(e) => handleInputChange('isPublic', e.target.checked)}
									className={styles.checkbox}
								/>
								Публичный профиль
							</label>
							<p className={styles.helpText}>
								Если включено, ваш профиль будет виден в каталоге
							</p>
						</div>
					</div>

					{/* Specialization */}
					<div className={styles.section}>
						<Heading tagName="h2">Специализация</Heading>
						<div className={styles.field}>
							<label className={styles.label}>Области деятельности</label>
							<div className={styles.checkboxGrid}>
								{specializationOptions.map(option => (
									<label key={option} className={styles.checkboxItem}>
										<input
											type="checkbox"
											checked={formData.specialization.includes(option)}
											onChange={(e) => {
												const newSpecialization = e.target.checked
													? [...formData.specialization, option]
													: formData.specialization.filter(item => item !== option)
												handleArrayChange('specialization', newSpecialization)
											}}
											className={styles.checkbox}
										/>
										<span>{option}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					{/* Tools */}
					<div className={styles.section}>
						<Heading tagName="h2">Инструменты и технологии</Heading>
						<div className={styles.field}>
							<label className={styles.label}>Используемые инструменты</label>
							<div className={styles.checkboxGrid}>
								{toolsOptions.map(option => (
									<label key={option} className={styles.checkboxItem}>
										<input
											type="checkbox"
											checked={formData.tools.includes(option)}
											onChange={(e) => {
												const newTools = e.target.checked
													? [...formData.tools, option]
													: formData.tools.filter(item => item !== option)
												handleArrayChange('tools', newTools)
											}}
											className={styles.checkbox}
										/>
										<span>{option}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					{/* Contacts */}
					<div className={styles.section}>
						<Heading tagName="h2">Контакты</Heading>

						<div className={styles.field}>
							<label className={styles.label}>Telegram</label>
							<Input
								type="text"
								value={formData.contacts.telegram}
								onChange={(e) => handleContactChange('telegram', e.target.value)}
								placeholder="@username"
							/>
						</div>

						<div className={styles.field}>
							<label className={styles.label}>Instagram</label>
							<Input
								type="text"
								value={formData.contacts.instagram}
								onChange={(e) => handleContactChange('instagram', e.target.value)}
								placeholder="@username"
							/>
						</div>

						<div className={styles.field}>
							<label className={styles.label}>Behance</label>
							<Input
								type="text"
								value={formData.contacts.behance}
								onChange={(e) => handleContactChange('behance', e.target.value)}
								placeholder="behance.net/username"
							/>
						</div>

						<div className={styles.field}>
							<label className={styles.label}>LinkedIn</label>
							<Input
								type="text"
								value={formData.contacts.linkedin}
								onChange={(e) => handleContactChange('linkedin', e.target.value)}
								placeholder="linkedin.com/in/username"
							/>
						</div>
					</div>

					{/* Clients */}
					<div className={styles.section}>
						<Heading tagName="h2">Клиенты</Heading>
						<div className={styles.field}>
							<label className={styles.label}>Список клиентов (через запятую)</label>
							<textarea
								value={formData.clients.join(', ')}
								onChange={(e) => {
									const clients = e.target.value.split(',').map(client => client.trim()).filter(Boolean)
									handleArrayChange('clients', clients)
								}}
								placeholder="Название компании 1, Название компании 2, ..."
								className={styles.textarea}
								rows={3}
							/>
						</div>
					</div>

					{/* Submit Button */}
					<div className={styles.actions}>
						<Button
							type="submit"
							disabled={saving}
							className={styles.submitButton}
						>
							{saving ? 'Сохранение...' : 'Сохранить изменения'}
						</Button>
					</div>
				</form>
			</Wrapper>
		</section>
	)
}
