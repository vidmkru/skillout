'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/shared/types/enums'
import { axiosInstance as api } from '@/shared/api/instances'
import styles from './register-form.module.scss'

interface RegisterFormProps {
	className?: string
	inviteCode?: string
	inviteType?: string
}

// Skills and programs options
const SKILLS_OPTIONS = [
	'AI-креатор',
	'Режиссер',
	'Видеомонтаж',
	'Оператор',
	'Сценарист',
	'Колорист',
	'Звукорежиссер'
]

const PROGRAMS_OPTIONS = [
	'VEO',
	'Midjourney',
	'Runway',
	'Sora',
	'Pika Labs',
	'Genmo',
	'Stable Diffusion'
]

const AI_EXPERIENCE_OPTIONS = [
	'меньше года',
	'1-2 года',
	'2-5 лет',
	'больше 5 лет'
]

export const RegisterForm: React.FC<RegisterFormProps> = ({
	className,
	inviteCode: initialInviteCode,
	inviteType: initialInviteType
}) => {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<UserRole>(
		initialInviteType as UserRole || UserRole.Creator
	)
	const [inviteCode, setInviteCode] = useState(initialInviteCode || '')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	// Creator fields
	const [name, setName] = useState('')
	const [city, setCity] = useState('')
	const [photo, setPhoto] = useState<File | null>(null)
	const [bio, setBio] = useState('')
	const [skills, setSkills] = useState<string[]>([])
	const [programs, setPrograms] = useState<string[]>([])
	const [otherSkill, setOtherSkill] = useState('')
	const [otherProgram, setOtherProgram] = useState('')
	const [showOtherSkill, setShowOtherSkill] = useState(false)
	const [showOtherProgram, setShowOtherProgram] = useState(false)
	const [aiExperience, setAiExperience] = useState('')
	const [projects, setProjects] = useState('')
	const [hackathonParticipation, setHackathonParticipation] = useState(false)
	const [portfolio, setPortfolio] = useState<File | null>(null)
	const [achievements, setAchievements] = useState('')
	const [creatorContacts, setCreatorContacts] = useState({
		telegram: '',
		vk: '',
		kinopoisk: '',
		vimeo: '',
		youtube: ''
	})
	const [userAgreement, setUserAgreement] = useState(false)
	const [showInHub, setShowInHub] = useState(false)

	// Producer fields
	const [producerName, setProducerName] = useState('')
	const [company, setCompany] = useState('')
	const [description, setDescription] = useState('')
	const [producerCity, setProducerCity] = useState('')
	const [website, setWebsite] = useState('')
	const [producerContacts, setProducerContacts] = useState({
		email: '',
		phone: '',
		socials: ''
	})

	// Helper functions for skills and programs
	const toggleSkill = (skill: string) => {
		setSkills(prev =>
			prev.includes(skill)
				? prev.filter(s => s !== skill)
				: [...prev, skill]
		)
	}

	const toggleProgram = (program: string) => {
		setPrograms(prev =>
			prev.includes(program)
				? prev.filter(p => p !== program)
				: [...prev, program]
		)
	}

	const handleOtherSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setOtherSkill(value)

		// Обновляем массив skills
		const otherSkillValue = value.trim()
		if (otherSkillValue) {
			// Удаляем предыдущее значение "другое" если было
			const filteredSkills = skills.filter(skill => !skill.startsWith('Другое: '))
			// Добавляем новое значение
			setSkills([...filteredSkills, `Другое: ${otherSkillValue}`])
		} else {
			// Если поле пустое, удаляем "другое" из массива
			setSkills(prev => prev.filter(skill => !skill.startsWith('Другое: ')))
		}
	}

	const handleOtherProgramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setOtherProgram(value)

		// Обновляем массив programs
		const otherProgramValue = value.trim()
		if (otherProgramValue) {
			// Удаляем предыдущее значение "другое" если было
			const filteredPrograms = programs.filter(program => !program.startsWith('Другое: '))
			// Добавляем новое значение
			setPrograms([...filteredPrograms, `Другое: ${otherProgramValue}`])
		} else {
			// Если поле пустое, удаляем "другое" из массива
			setPrograms(prev => prev.filter(program => !program.startsWith('Другое: ')))
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setSuccess(null)

		// Validate invite code requirement for all roles
		if (!inviteCode.trim()) {
			setError('Код приглашения обязателен для регистрации')
			setLoading(false)
			return
		}

		// Validate creator-specific fields
		if (role === UserRole.Creator) {
			if (!name.trim()) {
				setError('Имя Фамилия обязательны')
				setLoading(false)
				return
			}
			if (!photo) {
				setError('Фото обязательно')
				setLoading(false)
				return
			}
			if (!bio.trim()) {
				setError('Биография обязательна')
				setLoading(false)
				return
			}
			if (skills.length === 0) {
				setError('Выберите хотя бы один навык')
				setLoading(false)
				return
			}
			if (programs.length === 0) {
				setError('Выберите хотя бы одну программу')
				setLoading(false)
				return
			}
			if (!aiExperience) {
				setError('Укажите опыт работы с ИИ')
				setLoading(false)
				return
			}
			if (!portfolio) {
				setError('Загрузите портфолио')
				setLoading(false)
				return
			}
			if (!creatorContacts.telegram.trim()) {
				setError('Telegram обязателен')
				setLoading(false)
				return
			}
			if (!userAgreement) {
				setError('Необходимо согласие с пользовательским соглашением')
				setLoading(false)
				return
			}
		}

		// Validate producer and production-specific fields
		if (role === UserRole.Producer || role === UserRole.CreatorPro) {
			if (!producerName.trim()) {
				setError('Имя Фамилия продюсера обязательны')
				setLoading(false)
				return
			}
			if (!company.trim()) {
				setError('Название компании обязательно')
				setLoading(false)
				return
			}
			if (!producerContacts.phone.trim()) {
				setError('Номер телефона обязателен')
				setLoading(false)
				return
			}
		}

		try {
			const requestData: Record<string, unknown> = {
				email,
				role,
				inviteCode: inviteCode || undefined
			}

			// Add creator-specific fields if role is Creator
			if (role === UserRole.Creator) {
				requestData.name = name
				requestData.city = city
				requestData.photo = photo
				requestData.bio = bio
				requestData.skills = skills
				requestData.programs = programs
				requestData.aiExperience = aiExperience
				requestData.projects = projects
				requestData.hackathonParticipation = hackathonParticipation
				requestData.portfolio = portfolio
				requestData.achievements = achievements
				requestData.contacts = creatorContacts
				requestData.userAgreement = userAgreement
				requestData.showInHub = showInHub
			}

			// Add producer and production-specific fields
			if (role === UserRole.Producer || role === UserRole.CreatorPro) {
				requestData.name = producerName
				requestData.company = company
				requestData.description = description
				requestData.city = producerCity
				requestData.website = website
				requestData.contacts = producerContacts
			}

			const response = await api.post('/api/auth/register', requestData)

			if (response.data.success) {
				setSuccess('Регистрация успешна! Перенаправление...')
				setTimeout(() => {
					router.push('/')
				}, 1500)
			} else {
				setError(response.data.error || 'Ошибка регистрации')
			}
		} catch (error: unknown) {
			console.error('Registration error:', error)
			const errorMessage = error && typeof error === 'object' && 'response' in error
				? (error.response as { data?: { error?: string } })?.data?.error || 'Ошибка регистрации'
				: 'Ошибка регистрации'
			setError(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	const validateInviteCode = async (code: string) => {
		if (!code) {
			setError('Код приглашения обязателен для регистрации')
			return
		}

		try {
			const response = await api.put('/api/invites', { code })
			if (response.data.success) {
				const inviteType = response.data.data.invite.type
				setRole(inviteType)
				setError(null)
			} else {
				setError(response.data.error || 'Неверный код приглашения')
			}
		} catch (error: unknown) {
			const errorMessage = error && typeof error === 'object' && 'response' in error
				? (error.response as { data?: { error?: string } })?.data?.error || 'Ошибка проверки кода'
				: 'Ошибка проверки кода'
			setError(errorMessage)
		}
	}

	const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const code = e.target.value
		setInviteCode(code)

		if (code.length >= 8) {
			validateInviteCode(code)
		} else {
			if (code.length === 0) {
				setError('Код приглашения обязателен для регистрации')
			} else {
				setError(null)
			}
		}
	}

	return (
		<div className={`${styles.container} ${className || ''}`}>
			<div className={styles.formWrapper}>
				<h2 className={styles.title}>Регистрация</h2>
				<p className={styles.subtitle}>
					Присоединяйтесь к сообществу креаторов
				</p>

				<form onSubmit={handleSubmit} className={styles.form}>
					{/* Role Selection - moved to top */}
					<div className={styles.formGroup}>
						<label className={styles.label}>
							Выберите вашу роль *
						</label>
						<div className={styles.roleButtons}>
							<button
								type="button"
								onClick={() => {
									const newRole = UserRole.Creator
									setRole(newRole)
									// Show error if no invite code
									if (!inviteCode.trim()) {
										setError('Код приглашения обязателен для регистрации')
									}
								}}
								className={`${styles.roleButton} ${role === UserRole.Creator ? styles.roleButtonActive : ''}`}
							>
								<div className={styles.roleButtonContent}>
									<div className={styles.roleButtonTitle}>Креатор</div>
									<div className={styles.roleButtonDescription}>Базовый доступ к платформе</div>
								</div>
							</button>

							<button
								type="button"
								onClick={() => {
									const newRole = UserRole.CreatorPro
									setRole(newRole)
									// Show error if no invite code
									if (!inviteCode.trim()) {
										setError('Код приглашения обязателен для регистрации')
									}
								}}
								className={`${styles.roleButton} ${role === UserRole.CreatorPro ? styles.roleButtonActive : ''}`}
							>
								<div className={styles.roleButtonContent}>
									<div className={styles.roleButtonTitle}>Продакшн</div>
									<div className={styles.roleButtonDescription}>Расширенные возможности и приоритет</div>
								</div>
							</button>

							<button
								type="button"
								onClick={() => {
									const newRole = UserRole.Producer
									setRole(newRole)
									// Show error if no invite code
									if (!inviteCode.trim()) {
										setError('Код приглашения обязателен для регистрации')
									}
								}}
								className={`${styles.roleButton} ${role === UserRole.Producer ? styles.roleButtonActive : ''}`}
							>
								<div className={styles.roleButtonContent}>
									<div className={styles.roleButtonTitle}>Продюсер</div>
									<div className={styles.roleButtonDescription}>Доступ к поиску креаторов</div>
								</div>
							</button>
						</div>
					</div>
					{/* Email field */}
					<div className={styles.formGroup}>
						<label htmlFor="email" className={styles.label}>
							Email *
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={styles.input}
							placeholder="your@email.com"
							required
						/>
					</div>

					{/* Invite Code field */}
					<div className={styles.formGroup}>
						<label htmlFor="inviteCode" className={styles.label}>
							Код приглашения *
						</label>
						<input
							id="inviteCode"
							type="text"
							value={inviteCode}
							onChange={handleInviteCodeChange}
							className={`${styles.input} ${!inviteCode.trim()
								? styles.requiredField
								: ''
								}`}
							placeholder="Введите код приглашения (обязательно)"
							required
						/>
						<p className={styles.helpText}>
							Код приглашения обязателен для регистрации и автоматически определит вашу роль
						</p>
					</div>

					{/* Creator Form */}
					{role === UserRole.Creator && (
						<>
							{/* 1. Имя Фамилия (обязательное) */}
							<div className={styles.formGroup}>
								<label htmlFor="name" className={styles.label}>
									Имя Фамилия *
								</label>
								<input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className={styles.input}
									placeholder="Иван Иванов"
									required
								/>
							</div>

							{/* 2. Город */}
							<div className={styles.formGroup}>
								<label htmlFor="city" className={styles.label}>
									Город
								</label>
								<input
									id="city"
									type="text"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									className={styles.input}
									placeholder="Москва"
								/>
							</div>

							{/* 3. Ваше фото (обязательное - возможность прикрепить файл) */}
							<div className={styles.formGroup}>
								<label htmlFor="photo" className={styles.label}>
									Ваше фото *
								</label>
								<input
									id="photo"
									type="file"
									accept="image/*"
									onChange={(e) => setPhoto(e.target.files?.[0] || null)}
									className={styles.input}
									required
								/>
							</div>

							{/* 4. Краткое био... Расскажите о себе (обязательное, ограничить) */}
							<div className={styles.formGroup}>
								<label htmlFor="bio" className={styles.label}>
									Краткое био... Расскажите о себе *
								</label>
								<textarea
									id="bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									className={styles.textarea}
									placeholder="Расскажите о себе и своем опыте"
									rows={3}
									maxLength={500}
									required
								/>
								<p className={styles.helpText}>
									Ограничение: 500 символов ({bio.length}/500)
								</p>
							</div>

							{/* 5. Skills (обязательное, сделать всплывашки на выбор или возможность написать свое) */}
							<div className={styles.formGroup}>
								<label className={styles.label}>
									Skills *
								</label>
								<div className={styles.checkboxGrid}>
									{SKILLS_OPTIONS.map((skill) => (
										<label key={skill} className={styles.checkboxLabel}>
											<input
												type="checkbox"
												checked={skills.includes(skill)}
												onChange={() => toggleSkill(skill)}
												className={styles.checkbox}
											/>
											{skill}
										</label>
									))}

									{/* Чекбокс "Другое" для навыков */}
									<label className={styles.checkboxLabel}>
										<input
											type="checkbox"
											checked={showOtherSkill}
											onChange={(e) => {
												setShowOtherSkill(e.target.checked)
												if (!e.target.checked) {
													setOtherSkill('')
													setSkills(prev => prev.filter(skill => !skill.startsWith('Другое: ')))
												}
											}}
											className={styles.checkbox}
										/>
										Другое
									</label>
								</div>

								{/* Поле ввода для "Другое" навыка */}
								{showOtherSkill && (
									<div className={styles.otherField}>
										<input
											type="text"
											value={otherSkill}
											onChange={handleOtherSkillChange}
											className={styles.input}
											placeholder="Укажите ваш навык"
										/>
									</div>
								)}

								<p className={styles.helpText}>
									Выберите ваши навыки или добавьте свои
								</p>
							</div>

							{/* 6. Программы (обязательное. сделать всплывашки на выбор или возможность написать свое) */}
							<div className={styles.formGroup}>
								<label className={styles.label}>
									Программы *
								</label>
								<div className={styles.checkboxGrid}>
									{PROGRAMS_OPTIONS.map((program) => (
										<label key={program} className={styles.checkboxLabel}>
											<input
												type="checkbox"
												checked={programs.includes(program)}
												onChange={() => toggleProgram(program)}
												className={styles.checkbox}
											/>
											{program}
										</label>
									))}

									{/* Чекбокс "Другое" для программ */}
									<label className={styles.checkboxLabel}>
										<input
											type="checkbox"
											checked={showOtherProgram}
											onChange={(e) => {
												setShowOtherProgram(e.target.checked)
												if (!e.target.checked) {
													setOtherProgram('')
													setPrograms(prev => prev.filter(program => !program.startsWith('Другое: ')))
												}
											}}
											className={styles.checkbox}
										/>
										Другое
									</label>
								</div>

								{/* Поле ввода для "Другое" программы */}
								{showOtherProgram && (
									<div className={styles.otherField}>
										<input
											type="text"
											value={otherProgram}
											onChange={handleOtherProgramChange}
											className={styles.input}
											placeholder="Укажите вашу программу"
										/>
									</div>
								)}

								<p className={styles.helpText}>
									Выберите программы, которыми владеете
								</p>
							</div>

							{/* 7. Опыт работы с ИИ: меньше года, 1-2 года, 2-5 лет, больше 5 лет (обязательное) */}
							<div className={styles.formGroup}>
								<label htmlFor="aiExperience" className={styles.label}>
									Опыт работы с ИИ *
								</label>
								<select
									id="aiExperience"
									value={aiExperience}
									onChange={(e) => setAiExperience(e.target.value)}
									className={styles.select}
									required
								>
									<option value="">Выберите опыт</option>
									{AI_EXPERIENCE_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</div>

							{/* 8. Перечислите проекты в генеративном контенте (необязательное) */}
							<div className={styles.formGroup}>
								<label htmlFor="projects" className={styles.label}>
									Перечислите проекты в генеративном контенте
								</label>
								<textarea
									id="projects"
									value={projects}
									onChange={(e) => setProjects(e.target.value)}
									className={styles.textarea}
									placeholder="Опишите ваши проекты с использованием ИИ"
									rows={3}
								/>
							</div>

							{/* 9. Тамблер: Номинируюсь в Skillout hackathon / не участвую */}
							<div className={styles.formGroup}>
								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={hackathonParticipation}
										onChange={(e) => setHackathonParticipation(e.target.checked)}
										className={styles.checkbox}
									/>
									Номинируюсь в Skillout hackathon
								</label>
							</div>

							{/* 10. Загрузите свои работы (сделать возможность загрузить видео - реализация через Kinescope, обязательное) */}
							<div className={styles.formGroup}>
								<label htmlFor="portfolio" className={styles.label}>
									Загрузите свои работы *
								</label>
								<input
									id="portfolio"
									type="file"
									accept="video/*"
									onChange={(e) => setPortfolio(e.target.files?.[0] || null)}
									className={styles.input}
									required
								/>
								<p className={styles.helpText}>
									Загрузите видео через Kinescope
								</p>
							</div>

							{/* 11. Достижения: перечислите участие в ИИ-конкурсах, награды (необязательное) */}
							<div className={styles.formGroup}>
								<label htmlFor="achievements" className={styles.label}>
									Достижения
								</label>
								<textarea
									id="achievements"
									value={achievements}
									onChange={(e) => setAchievements(e.target.value)}
									className={styles.textarea}
									placeholder="Участие в ИИ-конкурсах, награды"
									rows={3}
								/>
							</div>

							{/* 12. Контакты: ТГ, ВК, Кинопоиск, Vmeo, YT (Тг - обязательное, остальное на выбор) */}
							<div className={styles.formGroup}>
								<label className={styles.label}>Контакты</label>
								<div className={styles.contactsGrid}>
									<input
										type="text"
										value={creatorContacts.telegram}
										onChange={(e) => setCreatorContacts(prev => ({ ...prev, telegram: e.target.value }))}
										className={styles.input}
										placeholder="Telegram *"
										required
									/>
									<input
										type="text"
										value={creatorContacts.vk}
										onChange={(e) => setCreatorContacts(prev => ({ ...prev, vk: e.target.value }))}
										className={styles.input}
										placeholder="ВКонтакте"
									/>
									<input
										type="text"
										value={creatorContacts.kinopoisk}
										onChange={(e) => setCreatorContacts(prev => ({ ...prev, kinopoisk: e.target.value }))}
										className={styles.input}
										placeholder="Кинопоиск"
									/>
									<input
										type="text"
										value={creatorContacts.vimeo}
										onChange={(e) => setCreatorContacts(prev => ({ ...prev, vimeo: e.target.value }))}
										className={styles.input}
										placeholder="Vimeo"
									/>
									<input
										type="text"
										value={creatorContacts.youtube}
										onChange={(e) => setCreatorContacts(prev => ({ ...prev, youtube: e.target.value }))}
										className={styles.input}
										placeholder="YouTube"
									/>
								</div>
								<p className={styles.helpText}>
									Telegram обязателен, остальные опционально
								</p>
							</div>

							{/* 13. Галочка пользовательского соглашения */}
							<div className={styles.formGroup}>
								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={userAgreement}
										onChange={(e) => setUserAgreement(e.target.checked)}
										className={styles.checkbox}
										required
									/>
									Пользовательское соглашение *
								</label>
							</div>

							{/* 14. Галочка "Показывать меня в базе SKILLOUT Hub" */}
							<div className={styles.formGroup}>
								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={showInHub}
										onChange={(e) => setShowInHub(e.target.checked)}
										className={styles.checkbox}
									/>
									Показывать меня в базе SKILLOUT Hub
								</label>
							</div>
						</>
					)}

					{/* Production Form (same as Producer) */}
					{role === UserRole.CreatorPro && (
						<>
							{/* 1. Имя Фамилия продюсера */}
							<div className={styles.formGroup}>
								<label htmlFor="productionName" className={styles.label}>
									Имя Фамилия продюсера *
								</label>
								<input
									id="productionName"
									type="text"
									value={producerName}
									onChange={(e) => setProducerName(e.target.value)}
									className={styles.input}
									placeholder="Петр Петров"
									required
								/>
							</div>

							{/* 2. Продакшн / Компания */}
							<div className={styles.formGroup}>
								<label htmlFor="productionCompany" className={styles.label}>
									Продакшн / Компания *
								</label>
								<input
									id="productionCompany"
									type="text"
									value={company}
									onChange={(e) => setCompany(e.target.value)}
									className={styles.input}
									placeholder="Название компании"
									required
								/>
							</div>

							{/* 3. Описание */}
							<div className={styles.formGroup}>
								<label htmlFor="productionDescription" className={styles.label}>
									Описание
								</label>
								<textarea
									id="productionDescription"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className={styles.textarea}
									placeholder="Опишите вашу компанию"
									rows={3}
								/>
							</div>

							{/* 4. Город */}
							<div className={styles.formGroup}>
								<label htmlFor="productionCity" className={styles.label}>
									Город
								</label>
								<input
									id="productionCity"
									type="text"
									value={producerCity}
									onChange={(e) => setProducerCity(e.target.value)}
									className={styles.input}
									placeholder="Москва"
								/>
							</div>

							{/* 5. Сайт */}
							<div className={styles.formGroup}>
								<label htmlFor="productionWebsite" className={styles.label}>
									Сайт
								</label>
								<input
									id="productionWebsite"
									type="url"
									value={website}
									onChange={(e) => setWebsite(e.target.value)}
									className={styles.input}
									placeholder="https://example.com"
								/>
							</div>

							{/* 7. Контакты: почта, номер (обязательно), соцсети - опционально */}
							<div className={styles.formGroup}>
								<label className={styles.label}>Контакты</label>
								<div className={styles.contactsGrid}>
									<input
										type="email"
										value={producerContacts.email}
										onChange={(e) => setProducerContacts(prev => ({ ...prev, email: e.target.value }))}
										className={styles.input}
										placeholder="Email"
									/>
									<input
										type="tel"
										value={producerContacts.phone}
										onChange={(e) => setProducerContacts(prev => ({ ...prev, phone: e.target.value }))}
										className={styles.input}
										placeholder="Номер телефона *"
										required
									/>
									<input
										type="text"
										value={producerContacts.socials}
										onChange={(e) => setProducerContacts(prev => ({ ...prev, socials: e.target.value }))}
										className={styles.input}
										placeholder="Социальные сети"
									/>
								</div>
								<p className={styles.helpText}>
									Номер телефона обязателен, остальные опционально
								</p>
							</div>
						</>
					)}

					{/* Producer Form */}
					{role === UserRole.Producer && (
						<>
							{/* 1. Имя Фамилия продюсера */}
							<div className={styles.formGroup}>
								<label htmlFor="producerName" className={styles.label}>
									Имя Фамилия продюсера *
								</label>
								<input
									id="producerName"
									type="text"
									value={producerName}
									onChange={(e) => setProducerName(e.target.value)}
									className={styles.input}
									placeholder="Петр Петров"
									required
								/>
							</div>

							{/* 2. Продакшн / Компания */}
							<div className={styles.formGroup}>
								<label htmlFor="company" className={styles.label}>
									Продакшн / Компания *
								</label>
								<input
									id="company"
									type="text"
									value={company}
									onChange={(e) => setCompany(e.target.value)}
									className={styles.input}
									placeholder="Название компании"
									required
								/>
							</div>

							{/* 3. Описание */}
							<div className={styles.formGroup}>
								<label htmlFor="description" className={styles.label}>
									Описание
								</label>
								<textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className={styles.textarea}
									placeholder="Опишите вашу компанию"
									rows={3}
								/>
							</div>

							{/* 4. Город */}
							<div className={styles.formGroup}>
								<label htmlFor="producerCity" className={styles.label}>
									Город
								</label>
								<input
									id="producerCity"
									type="text"
									value={producerCity}
									onChange={(e) => setProducerCity(e.target.value)}
									className={styles.input}
									placeholder="Москва"
								/>
							</div>

							{/* 5. Сайт */}
							<div className={styles.formGroup}>
								<label htmlFor="website" className={styles.label}>
									Сайт
								</label>
								<input
									id="website"
									type="url"
									value={website}
									onChange={(e) => setWebsite(e.target.value)}
									className={styles.input}
									placeholder="https://example.com"
								/>
							</div>

							{/* 7. Контакты: почта, номер (обязательно), соцсети - опционально */}
							<div className={styles.formGroup}>
								<label className={styles.label}>Контакты</label>
								<div className={styles.contactsGrid}>
									<input
										type="email"
										value={producerContacts.email}
										onChange={(e) => setProducerContacts(prev => ({ ...prev, email: e.target.value }))}
										className={styles.input}
										placeholder="Email"
									/>
									<input
										type="tel"
										value={producerContacts.phone}
										onChange={(e) => setProducerContacts(prev => ({ ...prev, phone: e.target.value }))}
										className={styles.input}
										placeholder="Номер телефона *"
										required
									/>
									<input
										type="text"
										value={producerContacts.socials}
										onChange={(e) => setProducerContacts(prev => ({ ...prev, socials: e.target.value }))}
										className={styles.input}
										placeholder="Социальные сети"
									/>
								</div>
								<p className={styles.helpText}>
									Номер телефона обязателен, остальные опционально
								</p>
							</div>
						</>
					)}

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

					<button
						type="submit"
						disabled={loading}
						className={styles.submitButton}
					>
						{loading ? 'Регистрация...' : 'Зарегистрироваться'}
					</button>
				</form>

				<div className={styles.footer}>
					<p>
						Уже есть аккаунт?{' '}
						<a href="/login" className={styles.link}>
							Войти
						</a>
					</p>
				</div>
			</div>
		</div>
	)
}
