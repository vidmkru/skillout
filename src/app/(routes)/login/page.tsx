'use client'

import { useState } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Heading } from '@/ui/heading'
import styles from './login.module.scss'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [message, setMessage] = useState('')
	const [messageType, setMessageType] = useState<'success' | 'error'>('error')
	const { login } = useAuth()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setMessage('')

		try {
			const result = await login(email)
			
			if (result.success) {
				setMessageType('success')
				setMessage('Вход выполнен успешно! Перенаправляем...')
				// Redirect after successful login
				setTimeout(() => {
					window.location.href = '/'
				}, 1000)
			} else {
				setMessageType('error')
				setMessage(result.message)
			}
		} catch (error) {
			setMessageType('error')
			setMessage('Ошибка входа. Попробуйте еще раз.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className={styles.container}>
			<div className={styles.form}>
				<Heading size="lg" tagName="h1" className={styles.title}>
					Вход в систему
				</Heading>

				<p className={styles.subtitle}>
					Введите ваш email для входа в систему
				</p>

				<form onSubmit={handleSubmit} className={styles.formContent}>
					<Input
						type="email"
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className={styles.input}
					/>

					<Button
						type="submit"
						disabled={isLoading}
						className={styles.button}
					>
						{isLoading ? 'Входим...' : 'Войти'}
					</Button>
				</form>

				{message && (
					<div className={`${styles.message} ${styles[messageType]}`}>
						{message}
					</div>
				)}

				<div className={styles.links}>
					<p>
						Нет аккаунта?{' '}
						<a href="/register" className={styles.link}>
							Зарегистрироваться
						</a>
					</p>
				</div>
			</div>
		</div>
	)
}
