'use client'

import { FC } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { Wrapper } from '@/ui'
import classNames from 'classnames'

import styles from './user-info.module.scss'
import { UserInfoProps } from './user-info.types'

const UserInfo: FC<UserInfoProps> = ({ className }) => {
	const { user, isAuthenticated } = useAuth()

	if (!isAuthenticated || !user) {
		return null
	}

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

	const rootClassName = classNames(styles.root, className)

	return (
		<section className={rootClassName}>
			<Wrapper>
				<div className={styles.container}>
					<div className={styles.userCard}>
						<div className={styles.avatar}>
							<span className={styles.avatarText}>
								{user.email.charAt(0).toUpperCase()}
							</span>
						</div>
						<div className={styles.userDetails}>
							<h3 className={styles.email}>{user.email}</h3>
							<div className={styles.roleInfo}>
								<span className={classNames(styles.role, getRoleColor(user.role))}>
									{getRoleDisplayName(user.role)}
								</span>
								<span className={styles.verified}>
									{user.isVerified ? '✓ Подтвержден' : '⏳ Ожидает подтверждения'}
								</span>
							</div>
							<div className={styles.stats}>
								<div className={styles.stat}>
									<span className={styles.statLabel}>Инвайты создано:</span>
									<span className={styles.statValue}>
										{Object.values(user.invitesUsed).reduce((sum, count) => sum + count, 0)}
									</span>
								</div>
								<div className={styles.stat}>
									<span className={styles.statLabel}>Подписка:</span>
									<span className={styles.statValue}>
										{user.subscriptionTier === 'free' ? 'Бесплатная' : user.subscriptionTier}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Wrapper>
		</section>
	)
}

export default UserInfo
