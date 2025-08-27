'use client'

import { FC, useState, useEffect } from 'react'
import { Wrapper } from '@/ui'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { UserRole } from '@/shared/types/enums'
import { axiosInstance } from '@/shared/api/instances'
import classNames from 'classnames'

import styles from './admin-users.module.scss'
import { AdminUsersProps } from './admin-users.types'

interface User {
	id: string
	email: string
	role: string
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

interface UsersResponse {
	users: User[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
	stats: {
		totalUsers: number
		usersByRole: {
			admin: number
			creator: number
			creatorPro: number
			producer: number
		}
	}
}

const AdminUsers: FC<AdminUsersProps> = ({ className }) => {
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [stats, setStats] = useState<any>(null)
	const [pagination, setPagination] = useState<any>(null)

	// Filters
	const [search, setSearch] = useState('')
	const [roleFilter, setRoleFilter] = useState('all')
	const [currentPage, setCurrentPage] = useState(1)
	const [sortBy, setSortBy] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState('desc')

	// Create user modal
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [newUser, setNewUser] = useState({
		email: '',
		role: 'creator',
		isVerified: true
	})
	const [creating, setCreating] = useState(false)

	const fetchUsers = async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '20',
				sortBy,
				sortOrder
			})

			if (search) params.append('search', search)
			if (roleFilter !== 'all') params.append('role', roleFilter)

			const response = await axiosInstance.get<{ success: boolean; data: UsersResponse }>(`/api/admin/users?${params}`)

			if (response.data.success) {
				setUsers(response.data.data.users)
				setPagination(response.data.data.pagination)
				setStats(response.data.data.stats)
			} else {
				setError('Failed to load users')
			}
		} catch (err) {
			console.error('Fetch users error:', err)
			setError('Failed to load users')
		} finally {
			setLoading(false)
		}
	}

	const createUser = async () => {
		try {
			setCreating(true)

			const response = await axiosInstance.post<{ success: boolean; data: User }>('/api/admin/users', newUser)

			if (response.data.success) {
				setShowCreateModal(false)
				setNewUser({ email: '', role: 'creator', isVerified: true })
				fetchUsers() // Refresh the list
			} else {
				setError('Failed to create user')
			}
		} catch (err: any) {
			console.error('Create user error:', err)
			setError(err.response?.data?.error || 'Failed to create user')
		} finally {
			setCreating(false)
		}
	}

	useEffect(() => {
		fetchUsers()
	}, [currentPage, search, roleFilter, sortBy, sortOrder])

	const getRoleDisplayName = (role: string) => {
		switch (role) {
			case 'admin':
				return 'Администратор'
			case 'creator-pro':
				return 'Creator Pro'
			case 'creator':
				return 'Creator'
			case 'producer':
				return 'Producer'
			default:
				return role
		}
	}

	const getRoleColor = (role: string) => {
		switch (role) {
			case 'admin':
				return styles.admin
			case 'creator-pro':
				return styles.creatorPro
			case 'creator':
				return styles.creator
			case 'producer':
				return styles.producer
			default:
				return ''
		}
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const rootClassName = classNames(styles.root, className)

	if (loading && !users.length) {
		return (
			<div className={rootClassName}>
				<Wrapper>
					<div className={styles.loading}>Загрузка пользователей...</div>
				</Wrapper>
			</div>
		)
	}

	if (error && !users.length) {
		return (
			<div className={rootClassName}>
				<Wrapper>
					<div className={styles.error}>
						<div className={styles.errorMessage}>{error}</div>
						<Button onClick={fetchUsers}>Попробовать снова</Button>
					</div>
				</Wrapper>
			</div>
		)
	}

	return (
		<div className={rootClassName}>
			<Wrapper>
				<div className={styles.header}>
					<h1 className={styles.title}>Управление пользователями</h1>
					<Button onClick={() => setShowCreateModal(true)} className={styles.createButton}>
						+ Добавить пользователя
					</Button>
				</div>

				{/* Statistics */}
				{stats && (
					<div className={styles.stats}>
						<div className={styles.statCard}>
							<div className={styles.statValue}>{stats.totalUsers}</div>
							<div className={styles.statLabel}>Всего пользователей</div>
						</div>
						<div className={styles.statCard}>
							<div className={styles.statValue}>{stats.usersByRole.admin}</div>
							<div className={styles.statLabel}>Администраторы</div>
						</div>
						<div className={styles.statCard}>
							<div className={styles.statValue}>{stats.usersByRole.creator + stats.usersByRole.creatorPro}</div>
							<div className={styles.statLabel}>Креаторы</div>
						</div>
						<div className={styles.statCard}>
							<div className={styles.statValue}>{stats.usersByRole.producer}</div>
							<div className={styles.statLabel}>Продюсеры</div>
						</div>
					</div>
				)}

				{/* Filters */}
				<div className={styles.filters}>
					<div className={styles.searchGroup}>
						<Input
							type="text"
							placeholder="Поиск по email..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className={styles.searchInput}
						/>
					</div>

					<div className={styles.filterGroup}>
						<select
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value)}
							className={styles.select}
						>
							<option value="all">Все роли</option>
							<option value="admin">Администраторы</option>
							<option value="creator">Creators</option>
							<option value="creator-pro">Creator Pro</option>
							<option value="producer">Producers</option>
						</select>

						<select
							value={`${sortBy}-${sortOrder}`}
							onChange={(e) => {
								const [field, order] = e.target.value.split('-')
								setSortBy(field)
								setSortOrder(order)
							}}
							className={styles.select}
						>
							<option value="createdAt-desc">Дата создания (новые)</option>
							<option value="createdAt-asc">Дата создания (старые)</option>
							<option value="email-asc">Email (А-Я)</option>
							<option value="email-desc">Email (Я-А)</option>
						</select>
					</div>
				</div>

				{/* Users Table */}
				<div className={styles.tableContainer}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Email</th>
								<th>Роль</th>
								<th>Статус</th>
								<th>Инвайты</th>
								<th>Дата регистрации</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr key={user.id}>
									<td className={styles.emailCell}>
										<div className={styles.emailInfo}>
											<span className={styles.email}>{user.email}</span>
											{!user.isVerified && (
												<span className={styles.unverified}>Не подтвержден</span>
											)}
										</div>
									</td>
									<td>
										<span className={classNames(styles.role, getRoleColor(user.role))}>
											{getRoleDisplayName(user.role)}
										</span>
									</td>
									<td>
										<span className={classNames(styles.status, user.isVerified ? styles.verified : styles.unverified)}>
											{user.isVerified ? '✓ Подтвержден' : '⏳ Ожидает'}
										</span>
									</td>
									<td>
										<div className={styles.invitesInfo}>
											<span className={styles.invitesUsed}>
												{Object.values(user.invitesUsed).reduce((sum, count) => sum + count, 0)}
											</span>
											<span className={styles.invitesTotal}>
												/ {Object.values(user.inviteQuota).reduce((sum, count) => sum + count, 0)}
											</span>
										</div>
									</td>
									<td className={styles.dateCell}>
										{formatDate(user.createdAt)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{pagination && pagination.totalPages > 1 && (
					<div className={styles.pagination}>
						<Button
							onClick={() => setCurrentPage(currentPage - 1)}
							disabled={currentPage === 1}
							className={styles.paginationButton}
						>
							← Назад
						</Button>

						<div className={styles.pageInfo}>
							Страница {currentPage} из {pagination.totalPages}
						</div>

						<Button
							onClick={() => setCurrentPage(currentPage + 1)}
							disabled={currentPage === pagination.totalPages}
							className={styles.paginationButton}
						>
							Вперед →
						</Button>
					</div>
				)}

				{/* Create User Modal */}
				{showCreateModal && (
					<div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
						<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
							<div className={styles.modalHeader}>
								<h2>Добавить пользователя</h2>
								<button
									onClick={() => setShowCreateModal(false)}
									className={styles.closeButton}
								>
									×
								</button>
							</div>

							<div className={styles.modalBody}>
								<div className={styles.formGroup}>
									<label>Email</label>
									<Input
										type="email"
										value={newUser.email}
										onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
										placeholder="user@example.com"
									/>
								</div>

								<div className={styles.formGroup}>
									<label>Роль</label>
									<select
										value={newUser.role}
										onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
										className={styles.select}
									>
										<option value="creator">Creator</option>
										<option value="creator-pro">Creator Pro</option>
										<option value="producer">Producer</option>
										<option value="admin">Admin</option>
									</select>
								</div>

								<div className={styles.formGroup}>
									<label>
										<input
											type="checkbox"
											checked={newUser.isVerified}
											onChange={(e) => setNewUser({ ...newUser, isVerified: e.target.checked })}
										/>
										Подтвержден
									</label>
								</div>
							</div>

							<div className={styles.modalFooter}>
								<Button onClick={() => setShowCreateModal(false)} variant="secondary">
									Отмена
								</Button>
								<Button onClick={createUser} disabled={creating || !newUser.email}>
									{creating ? 'Создание...' : 'Создать'}
								</Button>
							</div>
						</div>
					</div>
				)}
			</Wrapper>
		</div>
	)
}

export default AdminUsers
