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
			const response = await api.post('/api/auth/register', {
				email,
				role,
				inviteCode: inviteCode || undefined
			})

			if (response.data.success) {
				setSuccess('Регистрация успешна! Перенаправление...')
				setTimeout(() => {
					router.push('/')
				}, 1500)
			} else {
				setError(response.data.error || 'Ошибка регистрации')
			}
		} catch (error: any) {
			console.error('Registration error:', error)
			setError(error.response?.data?.error || 'Ошибка регистрации')
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
		} catch (error: any) {
			setError(error.response?.data?.error || 'Ошибка проверки кода')
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
