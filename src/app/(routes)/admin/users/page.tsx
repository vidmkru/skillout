'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heading } from '@/ui/heading'
import { Input } from '@/ui/input'
import { UserRole } from '@/shared/types/enums'
import styles from './users.module.scss'

interface User {
	id: string
	email: string
	role: UserRole
	createdAt: string
	isVerified: boolean
	subscriptionTier: string
	inviteQuota: {
		creator: number
		creatorPro: number
		producer: number
	}
	invitesUsed: {
		creator: number
		creatorPro: number
		producer: number
	}
}

export default function AdminUsersPage() {
	const [users, setUsers] = useState<User[]>([])
	const [filteredUsers, setFilteredUsers] = useState<User[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedRole, setSelectedRole] = useState<string>('all')
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		fetchUsers()
	}, [])

	const filterUsers = useCallback(() => {
		let filtered = users

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter(user =>
				user.email.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		// Filter by role
		if (selectedRole !== 'all') {
			filtered = filtered.filter(user => user.role === selectedRole)
		}

		setFilteredUsers(filtered)
	}, [users, searchTerm, selectedRole])

	useEffect(() => {
		filterUsers()
	}, [filterUsers])

	const fetchUsers = async () => {
		try {
			const response = await fetch('/api/admin/users')
			if (response.ok) {
				const data = await response.json()
				setUsers(data.users)
			} else {
				setError('Не удалось загрузить пользователей')
			}
		} catch (error) {
			setError('Ошибка сети')
		} finally {
			setIsLoading(false)
		}
	}



	const updateUserRole = async (userId: string, newRole: UserRole) => {
		try {
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ role: newRole }),
			})

			if (response.ok) {
				// Update local state
				setUsers(users.map(user =>
					user.id === userId ? { ...user, role: newRole } : user
				))
			} else {
				setError('Не удалось обновить роль пользователя')
			}
		} catch (error) {
			setError('Ошибка сети')
		}
	}

	const getRoleLabel = (role: UserRole) => {
		switch (role) {
			case UserRole.Admin:
				return 'Администратор'
			case UserRole.Creator:
				return 'Креатор'
			case UserRole.CreatorPro:
				return 'Креатор Про'
			case UserRole.Producer:
				return 'Продюсер'
			default:
				return role
		}
	}

	const getRoleColor = (role: UserRole) => {
		switch (role) {
			case UserRole.Admin:
				return '#ff6b35'
			case UserRole.CreatorPro:
				return '#4caf50'
			case UserRole.Creator:
				return '#2196f3'
			case UserRole.Producer:
				return '#9c27b0'
			default:
				return '#666'
		}
	}

	if (isLoading) {
		return <div className={styles.loading}>Загрузка пользователей...</div>
	}

	return (
		<div className={styles.container}>
			<Heading size="lg" tagName="h1" className={styles.title}>
				Управление пользователями
			</Heading>

			<div className={styles.controls}>
				<div className={styles.searchSection}>
					<Input
						type="text"
						placeholder="Поиск по email..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className={styles.searchInput}
					/>
				</div>

				<div className={styles.filterSection}>
					<select
						value={selectedRole}
						onChange={(e) => setSelectedRole(e.target.value)}
						className={styles.roleFilter}
					>
						<option value="all">Все роли</option>
						{Object.values(UserRole).map((role) => (
							<option key={role} value={role}>
								{getRoleLabel(role)}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className={styles.usersList}>
				<div className={styles.listHeader}>
					<span>Email</span>
					<span>Роль</span>
					<span>Дата регистрации</span>
					<span>Статус</span>
					<span>Действия</span>
				</div>

				{filteredUsers.length === 0 ? (
					<div className={styles.emptyState}>
						Пользователи не найдены
					</div>
				) : (
					filteredUsers.map((user) => (
						<div key={user.id} className={styles.userCard}>
							<div className={styles.userInfo}>
								<span className={styles.email}>{user.email}</span>
								<span
									className={styles.role}
									style={{ color: getRoleColor(user.role) }}
								>
									{getRoleLabel(user.role)}
								</span>
								<span className={styles.date}>
									{new Date(user.createdAt).toLocaleDateString()}
								</span>
								<span className={styles.status}>
									{user.isVerified ? 'Подтвержден' : 'Не подтвержден'}
								</span>
							</div>

							<div className={styles.actions}>
								<select
									value={user.role}
									onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
									className={styles.roleSelect}
								>
									{Object.values(UserRole).map((role) => (
										<option key={role} value={role}>
											{getRoleLabel(role)}
										</option>
									))}
								</select>
							</div>
						</div>
					))
				)}
			</div>

			{error && (
				<div className={styles.error}>
					{error}
				</div>
			)}
		</div>
	)
}
