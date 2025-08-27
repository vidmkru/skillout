'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/useAuth'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Heading } from '@/ui/heading'
import { UserRole } from '@/shared/types/enums'
import styles from './register.module.scss'

export default function RegisterPage() {
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<UserRole>(UserRole.Producer)
	const [inviteCode, setInviteCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const router = useRouter()
	const { login } = useAuth()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setMessage('')
		setError('')

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					role,
					inviteCode: role === UserRole.Creator || role === UserRole.CreatorPro ? inviteCode : undefined
				}),
			})

			const data = await response.json()

			if (response.ok) {
				setMessage('Регистрация успешна! Теперь войдите в систему.')
				// Auto-login after successful registration
				setTimeout(async () => {
					try {
						await login(email)
						router.push('/')
					} catch (error) {
						console.error('Auto-login failed:', error)
					}
				}, 2000)
			} else {
				setError(data.error || 'Ошибка при регистрации')
			}
		} catch (error) {
			setError('Ошибка сети. Попробуйте еще раз.')
		} finally {
			setIsLoading(false)
		}
	}

	const requiresInvite = role === UserRole.Creator || role === UserRole.CreatorPro

	return (
		<div className={styles.container}>
			<div className={styles.form}>
				<Heading size="lg" tagName="h1" className={styles.title}>
					Регистрация
				</Heading>

				<p className={styles.subtitle}>
					Создайте аккаунт для доступа к платформе
				</p>

				<form onSubmit={handleSubmit} className={styles.formContent}>
					<div className={styles.roleSelector}>
						<label className={styles.label}>Выберите роль:</label>
						<div className={styles.roleOptions}>
							{Object.values(UserRole).map((userRole) => (
								<label key={userRole} className={styles.roleOption}>
									<input
										type="radio"
										name="role"
										value={userRole}
										checked={role === userRole}
										onChange={(e) => setRole(e.target.value as UserRole)}
										className={styles.radio}
									/>
									<span className={styles.roleLabel}>
										{userRole === UserRole.Admin && 'Администратор'}
										{userRole === UserRole.Creator && 'Креатор'}
										{userRole === UserRole.CreatorPro && 'Креатор Про'}
										{userRole === UserRole.Producer && 'Продюсер'}
									</span>
								</label>
							))}
						</div>
					</div>

					<Input
						type="email"
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className={styles.input}
					/>

					{requiresInvite && (
						<Input
							type="text"
							placeholder="Код приглашения"
							value={inviteCode}
							onChange={(e) => setInviteCode(e.target.value)}
							required
							className={styles.input}
						/>
					)}

					{requiresInvite && (
						<div className={styles.inviteInfo}>
							<p>Для регистрации креаторов требуется код приглашения</p>
						</div>
					)}

					<Button
						type="submit"
						disabled={isLoading}
						className={styles.button}
					>
						{isLoading ? 'Регистрируем...' : 'Зарегистрироваться'}
					</Button>
				</form>

				{message && (
					<div className={styles.message}>
						{message}
					</div>
				)}

				{error && (
					<div className={styles.error}>
						{error}
					</div>
				)}

				<div className={styles.links}>
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
