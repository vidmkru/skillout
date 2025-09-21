import { User } from '@/shared/types/database'
import { UserRole, InviteType } from '@/shared/types/enums'

// Функция для получения базовой квоты по роли
export function getBaseQuota(role: UserRole) {
	switch (role) {
		case UserRole.Admin:
			return { creator: 1000, production: 500, producer: 2000 }
		case UserRole.CreatorPro:
			return { creator: 10, production: 2, producer: 20 }
		case UserRole.Creator:
			return { creator: 2, production: 0, producer: 5 }
		case UserRole.Producer:
			return { creator: 0, production: 0, producer: 0 }
		default:
			return { creator: 0, production: 0, producer: 0 }
	}
}

// Функция для проверки и обновления квоты
export function checkAndUpdateQuota(user: User): User {
	const now = new Date()
	const lastReset = user.quotaLastReset ? new Date(user.quotaLastReset) : new Date(user.createdAt)

	// Проверяем, прошло ли больше месяца с последнего сброса
	const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 +
		(now.getMonth() - lastReset.getMonth())

	if (monthsSinceReset >= 1) {
		// Сбрасываем квоту и счетчики использования
		const baseQuota = getBaseQuota(user.role)
		return {
			...user,
			inviteQuota: baseQuota,
			invitesUsed: { creator: 0, production: 0, producer: 0 },
			quotaLastReset: now.toISOString()
		}
	}

	return user
}

// Функция для получения времени до следующего обновления квоты
export function getTimeUntilNextReset(user: User): {
	days: number
	hours: number
	minutes: number
	seconds: number
	totalSeconds: number
} {
	const now = new Date()
	const lastReset = user.quotaLastReset ? new Date(user.quotaLastReset) : new Date(user.createdAt)

	// Вычисляем дату следующего сброса (через месяц)
	const nextReset = new Date(lastReset)
	nextReset.setMonth(nextReset.getMonth() + 1)

	const diffMs = nextReset.getTime() - now.getTime()
	const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))

	const days = Math.floor(totalSeconds / (24 * 60 * 60))
	const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
	const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
	const seconds = totalSeconds % 60

	return { days, hours, minutes, seconds, totalSeconds }
}

// Функция для форматирования времени до сброса
export function formatTimeUntilReset(user: User): string {
	const time = getTimeUntilNextReset(user)

	if (time.days > 0) {
		return `${time.days}д ${time.hours}ч ${time.minutes}м`
	} else if (time.hours > 0) {
		return `${time.hours}ч ${time.minutes}м`
	} else if (time.minutes > 0) {
		return `${time.minutes}м ${time.seconds}с`
	} else {
		return `${time.seconds}с`
	}
}

// Функция для проверки, можно ли создать инвайт
export function canCreateInvite(user: User, type: InviteType): boolean {
	const updatedUser = checkAndUpdateQuota(user)
	const typeKey = getTypeKey(type)

	return updatedUser.invitesUsed[typeKey] < updatedUser.inviteQuota[typeKey]
}

// Функция для получения ключа типа инвайта
export function getTypeKey(type: InviteType): 'creator' | 'production' | 'producer' {
	switch (type) {
		case InviteType.Creator:
			return 'creator'
		case InviteType.CreatorPro:
			return 'production'
		case InviteType.Producer:
			return 'producer'
		default:
			return 'creator'
	}
}
