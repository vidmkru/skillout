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

	// Additional fields for creators
	const [name, setName] = useState('')
	const [bio, setBio] = useState('')
	const [specialization, setSpecialization] = useState('')
	const [tools, setTools] = useState('')
	const [clients, setClients] = useState('')
	const [contacts, setContacts] = useState({
		telegram: '',
		instagram: '',
		behance: '',
		linkedin: ''
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setSuccess(null)

		// Validate invite code requirement for creators
		if ((role === UserRole.Creator || role === UserRole.CreatorPro) && !inviteCode.trim()) {
			setError('Код приглашения обязателен для регистрации креаторов и креаторов Pro')
			setLoading(false)
			return
		}

		try {
			const requestData: {
				email: string
				role: UserRole
				inviteCode?: string
				name?: string
				bio?: string
				specialization?: string[]
				tools?: string[]
				clients?: string[]
				contacts?: {
					telegram: string
					instagram: string
					behance: string
					linkedin: string
				}
			} = {
				email,
				role,
				inviteCode: inviteCode || undefined
			}

			// Add creator-specific fields if role is Creator or CreatorPro
			if (role === UserRole.Creator || role === UserRole.CreatorPro) {
				requestData.name = name
				requestData.bio = bio
				requestData.specialization = specialization.split(',').map(s => s.trim()).filter(s => s)
				requestData.tools = tools.split(',').map(s => s.trim()).filter(s => s)
				requestData.clients = clients.split(',').map(s => s.trim()).filter(s => s)
				requestData.contacts = contacts
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
			if (role === UserRole.Creator || role === UserRole.CreatorPro) {
				setError('Код приглашения обязателен для креаторов и креаторов Pro')
			}
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
			if (code.length === 0 && (role === UserRole.Creator || role === UserRole.CreatorPro)) {
				setError('Код приглашения обязателен для креаторов и креаторов Pro')
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

					<div className={styles.formGroup}>
						<label htmlFor="inviteCode" className={styles.label}>
							Код приглашения {(role === UserRole.Creator || role === UserRole.CreatorPro) && '*'}
						</label>
						<input
							id="inviteCode"
							type="text"
							value={inviteCode}
							onChange={handleInviteCodeChange}
							className={`${styles.input} ${(role === UserRole.Creator || role === UserRole.CreatorPro) && !inviteCode.trim()
								? styles.requiredField
								: ''
								}`}
							placeholder={
								role === UserRole.Creator || role === UserRole.CreatorPro
									? "Введите код приглашения (обязательно)"
									: "Введите код приглашения (если есть)"
							}
							required={role === UserRole.Creator || role === UserRole.CreatorPro}
						/>
						{(role === UserRole.Creator || role === UserRole.CreatorPro) && (
							<p className={styles.helpText}>
								Код приглашения обязателен для регистрации креаторов и креаторов Pro
							</p>
						)}
						{inviteCode && role !== UserRole.Creator && role !== UserRole.CreatorPro && (
							<p className={styles.helpText}>
								Код приглашения автоматически определит вашу роль
							</p>
						)}
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="role" className={styles.label}>
							Роль *
						</label>
						<select
							id="role"
							value={role}
							onChange={(e) => {
								const newRole = e.target.value as UserRole
								setRole(newRole)
								// Clear error when switching to Producer role (no invite required)
								if (newRole === UserRole.Producer) {
									setError(null)
								} else if (newRole === UserRole.Creator || newRole === UserRole.CreatorPro) {
									// Show error if no invite code for creators
									if (!inviteCode.trim()) {
										setError('Код приглашения обязателен для креаторов и креаторов Pro')
									}
								}
							}}
							className={styles.select}
							required
						>
							<option value={UserRole.Creator}>Креатор</option>
							<option value={UserRole.CreatorPro}>Креатор Pro</option>
							<option value={UserRole.Producer}>Продюсер</option>
						</select>
						<p className={styles.helpText}>
							{role === UserRole.Creator && 'Базовый доступ к платформе'}
							{role === UserRole.CreatorPro && 'Расширенные возможности и приоритет'}
							{role === UserRole.Producer && 'Доступ к поиску креаторов'}
						</p>
					</div>

					{/* Additional fields for creators */}
					{(role === UserRole.Creator || role === UserRole.CreatorPro) && (
						<>
							<div className={styles.formGroup}>
								<label htmlFor="name" className={styles.label}>
									Имя *
								</label>
								<input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className={styles.input}
									placeholder="Ваше имя"
									required
								/>
							</div>

							<div className={styles.formGroup}>
								<label htmlFor="bio" className={styles.label}>
									Биография *
								</label>
								<textarea
									id="bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									className={styles.textarea}
									placeholder="Расскажите о себе и своем опыте"
									rows={3}
									required
								/>
							</div>

							<div className={styles.formGroup}>
								<label htmlFor="specialization" className={styles.label}>
									Специализация *
								</label>
								<input
									id="specialization"
									type="text"
									value={specialization}
									onChange={(e) => setSpecialization(e.target.value)}
									className={styles.input}
									placeholder="Видеомонтаж, Цветокоррекция, Анимация"
									required
								/>
								<p className={styles.helpText}>
									Укажите через запятую ваши специализации
								</p>
							</div>

							<div className={styles.formGroup}>
								<label htmlFor="tools" className={styles.label}>
									Инструменты *
								</label>
								<input
									id="tools"
									type="text"
									value={tools}
									onChange={(e) => setTools(e.target.value)}
									className={styles.input}
									placeholder="Adobe Premiere Pro, After Effects, DaVinci Resolve"
									required
								/>
								<p className={styles.helpText}>
									Укажите через запятую инструменты, которыми владеете
								</p>
							</div>

							<div className={styles.formGroup}>
								<label htmlFor="clients" className={styles.label}>
									Клиенты
								</label>
								<input
									id="clients"
									type="text"
									value={clients}
									onChange={(e) => setClients(e.target.value)}
									className={styles.input}
									placeholder="Nike, Adidas, Coca-Cola"
								/>
								<p className={styles.helpText}>
									Укажите через запятую известных клиентов (необязательно)
								</p>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.label}>Контакты</label>
								<div className={styles.contactsGrid}>
									<input
										type="text"
										value={contacts.telegram}
										onChange={(e) => setContacts(prev => ({ ...prev, telegram: e.target.value }))}
										className={styles.input}
										placeholder="Telegram"
									/>
									<input
										type="text"
										value={contacts.instagram}
										onChange={(e) => setContacts(prev => ({ ...prev, instagram: e.target.value }))}
										className={styles.input}
										placeholder="Instagram"
									/>
									<input
										type="text"
										value={contacts.behance}
										onChange={(e) => setContacts(prev => ({ ...prev, behance: e.target.value }))}
										className={styles.input}
										placeholder="Behance"
									/>
									<input
										type="text"
										value={contacts.linkedin}
										onChange={(e) => setContacts(prev => ({ ...prev, linkedin: e.target.value }))}
										className={styles.input}
										placeholder="LinkedIn"
									/>
								</div>
								<p className={styles.helpText}>
									Укажите ваши социальные сети (необязательно)
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
