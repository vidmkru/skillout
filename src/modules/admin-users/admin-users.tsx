'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { UserRole } from '@/shared/types/enums'
import { axiosInstance as api } from '@/shared/api/instances'
import type { User } from '@/shared/types/database'
import styles from './admin-users.module.scss'

interface AdminUsersProps {
	className?: string
}

interface CreateUserForm {
	email: string
	role: UserRole
	name: string
	bio: string
	specialization: string[]
	tools: string[]
	clients: string[]
	contacts: {
		telegram: string
		instagram: string
		behance: string
		linkedin: string
	}
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ className }) => {
	const { user } = useAuth()
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [editingUser, setEditingUser] = useState<User | null>(null)
	const [createForm, setCreateForm] = useState<CreateUserForm>({
		email: '',
		role: UserRole.Creator,
		name: '',
		bio: '',
		specialization: [''],
		tools: [''],
		clients: [''],
		contacts: {
			telegram: '',
			instagram: '',
			behance: '',
			linkedin: ''
		}
	})

	useEffect(() => {
		fetchUsers()
	}, [])

	// Check admin access
	if (!user || user.role !== UserRole.Admin) {
		return (
			<div className={styles.container}>
				<div className={styles.error}>
					<h2>Доступ запрещен</h2>
					<p>Только администраторы могут просматривать эту страницу.</p>
				</div>
			</div>
		)
	}

	const fetchUsers = async () => {
		try {
			setLoading(true)
			const response = await api.get('/api/admin/users')
			if (response.data.success) {
				console.log('🔍 Users loaded from API:', response.data.data.users)
				response.data.data.users.forEach((user: User) => {
					console.log('👤 User:', user.email, 'role:', user.role, 'type:', typeof user.role)
				})
				setUsers(response.data.data.users)
			} else {
				setError('Ошибка загрузки пользователей')
			}
		} catch (error) {
			console.error('Fetch users error:', error)
			setError('Ошибка загрузки пользователей')
		} finally {
			setLoading(false)
		}
	}

	const createUser = async (userData: CreateUserForm) => {
		try {
			const response = await api.post('/api/admin/users', userData)
			if (response.data.success) {
				setUsers(prev => [...prev, response.data.data.user])
				setShowCreateForm(false)
				setCreateForm({
					email: '',
					role: UserRole.Creator,
					name: '',
					bio: '',
					specialization: [''],
					tools: [''],
					clients: [''],
					contacts: {
						telegram: '',
						instagram: '',
						behance: '',
						linkedin: ''
					}
				})
			} else {
				setError(response.data.error || 'Ошибка создания пользователя')
			}
		} catch (error: unknown) {
			console.error('Create user error:', error)
			const errorMessage = error && typeof error === 'object' && 'response' in error
				? (error.response as { data?: { error?: string } })?.data?.error || 'Ошибка создания пользователя'
				: 'Ошибка создания пользователя'
			setError(errorMessage)
		}
	}

	const updateUser = async (userId: string, updates: Partial<User>) => {
		try {
			const response = await api.put(`/api/admin/users/${userId}`, updates)
			if (response.data.success) {
				setUsers(prev => prev.map(u => u.id === userId ? response.data.user : u))
				setEditingUser(null)
			} else {
				setError(response.data.error || 'Ошибка обновления пользователя')
			}
		} catch (error: unknown) {
			console.error('Update user error:', error)
			const errorMessage = error && typeof error === 'object' && 'response' in error
				? (error.response as { data?: { error?: string } })?.data?.error || 'Ошибка обновления пользователя'
				: 'Ошибка обновления пользователя'
			setError(errorMessage)
		}
	}

	const deleteUser = async (userId: string) => {
		if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return

		try {
			const response = await api.delete(`/api/admin/users?userId=${userId}`)
			if (response.data.success) {
				setUsers(prev => prev.filter(u => u.id !== userId))
			} else {
				setError(response.data.error || 'Ошибка удаления пользователя')
			}
		} catch (error: unknown) {
			console.error('Delete user error:', error)
			const errorMessage = error && typeof error === 'object' && 'response' in error
				? (error.response as { data?: { error?: string } })?.data?.error || 'Ошибка удаления пользователя'
				: 'Ошибка удаления пользователя'
			setError(errorMessage)
		}
	}

	const toggleUserVerification = async (userId: string, currentStatus: boolean) => {
		try {
			const response = await api.put(`/api/admin/users/${userId}/verify`, {
				isVerified: !currentStatus
			})
			if (response.data.success) {
				setUsers(users.map(u =>
					u.id === userId
						? { ...u, isVerified: !currentStatus, updatedAt: new Date().toISOString() }
						: u
				))
			} else {
				setError('Ошибка обновления статуса пользователя')
			}
		} catch (error) {
			console.error('Error updating user verification:', error)
			setError('Ошибка обновления статуса пользователя')
		}
	}

	const migrateRoles = async () => {
		if (!confirm('Вы уверены, что хотите выполнить миграцию ролей? Это обновит всех пользователей с старыми ролями.')) return

		try {
			setLoading(true)
			const response = await api.post('/api/admin/migrate-roles')
			if (response.data.success) {
				alert(`Миграция завершена! Обновлено пользователей: ${response.data.data.migratedCount}`)
				fetchUsers() // Reload users
			} else {
				setError(response.data.message || 'Ошибка миграции ролей')
			}
		} catch (error) {
			console.error('Error migrating roles:', error)
			setError('Ошибка миграции ролей')
		} finally {
			setLoading(false)
		}
	}

	// Filter users
	const filteredUsers = users.filter(user => {
		const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesRole = roleFilter === 'all' || user.role === roleFilter
		return matchesSearch && matchesRole
	})

	// Get role display info
	const getRoleInfo = (role: UserRole) => {
		console.log('🔍 getRoleInfo called with role:', role, 'type:', typeof role)
		console.log('🔍 Available UserRole values:', Object.values(UserRole))
		switch (role) {
			case UserRole.Admin:
				return { label: 'Администратор', color: '#ff4757', bgColor: '#ffe0e0' }
			case UserRole.Production:
				return { label: 'Production', color: '#2ed573', bgColor: '#e0ffe0' }
			case UserRole.Creator:
				return { label: 'Креатор', color: '#3742fa', bgColor: '#e0e0ff' }
			case UserRole.Producer:
				return { label: 'Продюсер', color: '#ffa502', bgColor: '#fff0e0' }
			default:
				console.log('⚠️ Unknown role:', role, 'falling back to default')
				return { label: 'Неизвестно', color: '#747d8c', bgColor: '#f0f0f0' }
		}
	}

	const handleCreateSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		createUser(createForm)
	}

	const handleEditSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingUser) return

		const updates: Partial<User> = {
			role: editingUser.role,
			isVerified: editingUser.isVerified
		}
		updateUser(editingUser.id, updates)
	}

	const addArrayItem = (field: keyof CreateUserForm, value: string) => {
		setCreateForm(prev => ({
			...prev,
			[field]: [...(prev[field] as string[]), value]
		}))
	}

	const removeArrayItem = (field: keyof CreateUserForm, index: number) => {
		setCreateForm(prev => ({
			...prev,
			[field]: (prev[field] as string[]).filter((_, i) => i !== index)
		}))
	}

	const updateArrayItem = (field: keyof CreateUserForm, index: number, value: string) => {
		setCreateForm(prev => ({
			...prev,
			[field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
		}))
	}

	if (loading) {
		return (
			<div className={styles.container}>
				<div className={styles.loading}>Загрузка пользователей...</div>
			</div>
		)
	}

	return (
		<div className={`${styles.container} ${className || ''}`}>
			<div className={styles.header}>
				<h1>Управление пользователями</h1>
				<button
					className={styles.createButton}
					onClick={() => setShowCreateForm(true)}
				>
					+ Создать пользователя
				</button>
			</div>

			{error && (
				<div className={styles.error}>
					{error}
					<button onClick={() => setError(null)}>✕</button>
				</div>
			)}

			<div className={styles.filters}>
				<div className={styles.searchBox}>
					<input
						type="text"
						placeholder="Поиск по email..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className={styles.roleFilter}>
					<select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}>
						<option value="all">Все роли</option>
						<option value={UserRole.Admin}>Администраторы</option>
						<option value={UserRole.Creator}>Креаторы</option>
						<option value={UserRole.Production}>Production</option>
						<option value={UserRole.Producer}>Продюсеры</option>
					</select>
				</div>
				<button
					onClick={migrateRoles}
					className={styles.migrateButton}
					disabled={loading}
				>
					Мигрировать роли
				</button>
			</div>

			<div className={styles.stats}>
				<div className={styles.statCard}>
					<div className={styles.statNumber}>{users.length}</div>
					<div className={styles.statLabel}>Всего пользователей</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statNumber}>{users.filter(u => u.role === UserRole.Creator).length}</div>
					<div className={styles.statLabel}>Креаторов</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statNumber}>{users.filter(u => u.role === UserRole.Production).length}</div>
					<div className={styles.statLabel}>Production</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statNumber}>{users.filter(u => u.role === UserRole.Producer).length}</div>
					<div className={styles.statLabel}>Продюсеров</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statNumber}>{users.filter(u => u.role === UserRole.Admin).length}</div>
					<div className={styles.statLabel}>Администраторов</div>
				</div>
			</div>

			<div className={styles.usersList}>
				{filteredUsers.map(user => (
					<div key={user.id} className={styles.userCard}>
						<div className={styles.userInfo}>
							<div className={styles.userHeader}>
								<div className={styles.userEmail}>{user.email}</div>
								<div
									className={styles.roleBadge}
									style={{
										color: getRoleInfo(user.role).color,
										backgroundColor: getRoleInfo(user.role).bgColor
									}}
								>
									{getRoleInfo(user.role).label}
								</div>
							</div>
							<div className={styles.userDetails}>
								<div className={styles.userDetail}>
									<span className={styles.detailLabel}>ID:</span>
									<span className={styles.detailValue}>{user.id}</span>
								</div>
								<div className={styles.userDetail}>
									<span className={styles.detailLabel}>Создан:</span>
									<span className={styles.detailValue}>
										{new Date(user.createdAt).toLocaleDateString('ru-RU')}
									</span>
								</div>
								<div className={styles.userDetail}>
									<span className={styles.detailLabel}>Подтвержден:</span>
									<span className={styles.detailValue}>
										{user.isVerified ? 'Да' : 'Нет'}
									</span>
								</div>
							</div>
						</div>
						<div className={styles.userActions}>
							<button
								className={styles.editButton}
								onClick={() => setEditingUser(user)}
							>
								Редактировать
							</button>
							<button
								className={styles.viewProfileButton}
								onClick={() => window.open(`/profile/${user.id}`, '_blank')}
							>
								Профиль
							</button>
							<button
								className={user.isVerified ? styles.unverifyButton : styles.verifyButton}
								onClick={() => toggleUserVerification(user.id, user.isVerified)}
							>
								{user.isVerified ? 'Отменить подтверждение' : 'Подтвердить'}
							</button>
							{user.role !== UserRole.Admin && (
								<button
									className={styles.deleteButton}
									onClick={() => deleteUser(user.id)}
								>
									Удалить
								</button>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Create User Modal */}
			{showCreateForm && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<div className={styles.modalHeader}>
							<h2>Создать пользователя</h2>
							<button onClick={() => setShowCreateForm(false)}>✕</button>
						</div>
						<form onSubmit={handleCreateSubmit} className={styles.form}>
							<div className={styles.formGroup}>
								<label>Email *</label>
								<input
									type="email"
									required
									value={createForm.email}
									onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
								/>
							</div>
							<div className={styles.formGroup}>
								<label>Роль *</label>
								<select
									required
									value={createForm.role}
									onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
								>
									<option value={UserRole.Creator}>Креатор</option>
									<option value={UserRole.Production}>Креатор Pro</option>
									<option value={UserRole.Producer}>Продюсер</option>
									<option value={UserRole.Admin}>Администратор</option>
								</select>
							</div>
							{(createForm.role === UserRole.Creator || createForm.role === UserRole.Production) && (
								<>
									<div className={styles.formGroup}>
										<label>Имя</label>
										<input
											type="text"
											value={createForm.name}
											onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
										/>
									</div>
									<div className={styles.formGroup}>
										<label>Биография</label>
										<textarea
											value={createForm.bio}
											onChange={(e) => setCreateForm(prev => ({ ...prev, bio: e.target.value }))}
										/>
									</div>
									<div className={styles.formGroup}>
										<label>Специализация</label>
										{createForm.specialization.map((item, index) => (
											<div key={index} className={styles.arrayInput}>
												<input
													type="text"
													value={item}
													onChange={(e) => updateArrayItem('specialization', index, e.target.value)}
												/>
												<button type="button" onClick={() => removeArrayItem('specialization', index)}>✕</button>
											</div>
										))}
										<button type="button" onClick={() => addArrayItem('specialization', '')}>+ Добавить</button>
									</div>
									<div className={styles.formGroup}>
										<label>Инструменты</label>
										{createForm.tools.map((item, index) => (
											<div key={index} className={styles.arrayInput}>
												<input
													type="text"
													value={item}
													onChange={(e) => updateArrayItem('tools', index, e.target.value)}
												/>
												<button type="button" onClick={() => removeArrayItem('tools', index)}>✕</button>
											</div>
										))}
										<button type="button" onClick={() => addArrayItem('tools', '')}>+ Добавить</button>
									</div>
									<div className={styles.formGroup}>
										<label>Клиенты</label>
										{createForm.clients.map((item, index) => (
											<div key={index} className={styles.arrayInput}>
												<input
													type="text"
													value={item}
													onChange={(e) => updateArrayItem('clients', index, e.target.value)}
												/>
												<button type="button" onClick={() => removeArrayItem('clients', index)}>✕</button>
											</div>
										))}
										<button type="button" onClick={() => addArrayItem('clients', '')}>+ Добавить</button>
									</div>
									<div className={styles.formGroup}>
										<label>Контакты</label>
										<div className={styles.contactsGrid}>
											<input
												type="text"
												placeholder="Telegram"
												value={createForm.contacts.telegram}
												onChange={(e) => setCreateForm(prev => ({
													...prev,
													contacts: { ...prev.contacts, telegram: e.target.value }
												}))}
											/>
											<input
												type="text"
												placeholder="Instagram"
												value={createForm.contacts.instagram}
												onChange={(e) => setCreateForm(prev => ({
													...prev,
													contacts: { ...prev.contacts, instagram: e.target.value }
												}))}
											/>
											<input
												type="text"
												placeholder="Behance"
												value={createForm.contacts.behance}
												onChange={(e) => setCreateForm(prev => ({
													...prev,
													contacts: { ...prev.contacts, behance: e.target.value }
												}))}
											/>
											<input
												type="text"
												placeholder="LinkedIn"
												value={createForm.contacts.linkedin}
												onChange={(e) => setCreateForm(prev => ({
													...prev,
													contacts: { ...prev.contacts, linkedin: e.target.value }
												}))}
											/>
										</div>
									</div>
								</>
							)}
							<div className={styles.formActions}>
								<button type="submit" className={styles.submitButton}>
									Создать пользователя
								</button>
								<button type="button" onClick={() => setShowCreateForm(false)}>
									Отмена
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit User Modal */}
			{editingUser && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<div className={styles.modalHeader}>
							<h2>Редактировать пользователя</h2>
							<button onClick={() => setEditingUser(null)}>✕</button>
						</div>
						<form onSubmit={handleEditSubmit} className={styles.form}>
							<div className={styles.formGroup}>
								<label>Email</label>
								<input type="email" value={editingUser.email} disabled />
							</div>
							<div className={styles.formGroup}>
								<label>Роль</label>
								<select
									value={editingUser.role}
									onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value as UserRole } : null)}
								>
									<option value={UserRole.Creator}>Креатор</option>
									<option value={UserRole.Production}>Креатор Pro</option>
									<option value={UserRole.Producer}>Продюсер</option>
									<option value={UserRole.Admin}>Администратор</option>
								</select>
							</div>
							<div className={styles.formGroup}>
								<label>
									<input
										type="checkbox"
										checked={editingUser.isVerified}
										onChange={(e) => setEditingUser(prev => prev ? { ...prev, isVerified: e.target.checked } : null)}
									/>
									Подтвержден
								</label>
							</div>
							<div className={styles.formActions}>
								<button type="submit" className={styles.submitButton}>
									Сохранить
								</button>
								<button type="button" onClick={() => setEditingUser(null)}>
									Отмена
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
