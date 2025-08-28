"use client"

import { FC, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/shared/types/enums'
import { axiosInstance as api } from '@/shared/api/instances'
import { Input, Button } from '@/ui'

import styles from './register-pro-form.module.scss'

interface RegisterProFormProps {
	className?: string
}

const RegisterProForm: FC<RegisterProFormProps> = () => {
	const router = useRouter()
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		name: '',
		bio: '',
		specialization: '',
		tools: '',
		clients: '',
		contacts: {
			telegram: '',
			instagram: '',
			behance: '',
			linkedin: ''
		}
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const handleInputChange = (field: string, value: string) => {
		if (field.includes('.')) {
			const [parent, child] = field.split('.')
			setFormData(prev => ({
				...prev,
				[parent]: {
					...prev[parent as keyof typeof prev] as Record<string, string>,
					[child]: value
				}
			}))
		} else {
			setFormData(prev => ({
				...prev,
				[field]: value
			}))
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setSuccess(null)

		try {
			const requestData = {
				email: formData.email,
				password: formData.password,
				role: UserRole.CreatorPro,
				// Creator-specific fields
				name: formData.name,
				bio: formData.bio,
				specialization: formData.specialization.split(',').map(s => s.trim()).filter(Boolean),
				tools: formData.tools.split(',').map(s => s.trim()).filter(Boolean),
				clients: formData.clients.split(',').map(s => s.trim()).filter(Boolean),
				contacts: formData.contacts
			}

			const response = await api.post('/api/auth/register', requestData)

			if (response.data.success) {
				setSuccess('Регистрация успешна! Перенаправляем на вход...')
				setTimeout(() => {
					router.push('/login')
				}, 2000)
			} else {
				setError(response.data.error || 'Ошибка регистрации')
			}
		} catch (error: unknown) {
			console.error('Registration error:', error)
			setError((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Ошибка регистрации')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className={styles.container}>
			<div className={styles.formWrapper}>
				<div className={styles.header}>
					<h1 className={styles.title}>Регистрация Creator Pro</h1>
					<p className={styles.subtitle}>
						Создайте аккаунт Creator Pro и начните получать заказы
					</p>
				</div>

				<form className={styles.form} onSubmit={handleSubmit}>
					<div className={styles.formGroup}>
						<label className={styles.label}>Email *</label>
						<Input
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange('email', e.target.value)}
							placeholder="your@email.com"
							required
							className={styles.input}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Пароль *</label>
						<Input
							type="password"
							value={formData.password}
							onChange={(e) => handleInputChange('password', e.target.value)}
							placeholder="Минимум 6 символов"
							required
							minLength={6}
							className={styles.input}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Имя *</label>
						<Input
							type="text"
							value={formData.name}
							onChange={(e) => handleInputChange('name', e.target.value)}
							placeholder="Ваше полное имя"
							required
							className={styles.input}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Биография</label>
						<textarea
							value={formData.bio}
							onChange={(e) => handleInputChange('bio', e.target.value)}
							placeholder="Расскажите о себе и своем опыте"
							className={styles.textarea}
							rows={3}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Специализация *</label>
						<Input
							type="text"
							value={formData.specialization}
							onChange={(e) => handleInputChange('specialization', e.target.value)}
							placeholder="Видеомонтаж, Дизайн, Анимация"
							required
							className={styles.input}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Инструменты</label>
						<Input
							type="text"
							value={formData.tools}
							onChange={(e) => handleInputChange('tools', e.target.value)}
							placeholder="Adobe Premiere, Figma, After Effects"
							className={styles.input}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Клиенты</label>
						<Input
							type="text"
							value={formData.clients}
							onChange={(e) => handleInputChange('clients', e.target.value)}
							placeholder="Названия компаний или проектов"
							className={styles.input}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Контакты</label>
						<div className={styles.contactsGrid}>
							<Input
								type="text"
								value={formData.contacts.telegram}
								onChange={(e) => handleInputChange('contacts.telegram', e.target.value)}
								placeholder="Telegram"
								className={styles.input}
							/>
							<Input
								type="text"
								value={formData.contacts.instagram}
								onChange={(e) => handleInputChange('contacts.instagram', e.target.value)}
								placeholder="Instagram"
								className={styles.input}
							/>
							<Input
								type="text"
								value={formData.contacts.behance}
								onChange={(e) => handleInputChange('contacts.behance', e.target.value)}
								placeholder="Behance"
								className={styles.input}
							/>
							<Input
								type="text"
								value={formData.contacts.linkedin}
								onChange={(e) => handleInputChange('contacts.linkedin', e.target.value)}
								placeholder="LinkedIn"
								className={styles.input}
							/>
						</div>
					</div>

					<Button
						type="submit"
						disabled={loading}
						className={styles.submitButton}
					>
						{loading ? 'Регистрация...' : 'Создать аккаунт Creator Pro'}
					</Button>

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

export default RegisterProForm
