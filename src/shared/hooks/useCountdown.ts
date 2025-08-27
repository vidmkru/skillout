'use client'

import { useEffect, useMemo, useState } from 'react'

export interface UseCountdownOptions {
	targetDate: Date | string | number
}

interface TimeLeftState {
	totalMs: number
	days: number
	hours: number
	minutes: number
	seconds: number
}

const MILLISECONDS_IN_SECOND = 1000
const MILLISECONDS_IN_MINUTE = 60 * MILLISECONDS_IN_SECOND
const MILLISECONDS_IN_HOUR = 60 * MILLISECONDS_IN_MINUTE
const MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR

function getTimeLeft(targetDate: Date): TimeLeftState {
	const now = Date.now()
	const target = targetDate.getTime()
	const diff = Math.max(target - now, 0)

	const days = Math.floor(diff / MILLISECONDS_IN_DAY)
	const hours = Math.floor((diff % MILLISECONDS_IN_DAY) / MILLISECONDS_IN_HOUR)
	const minutes = Math.floor((diff % MILLISECONDS_IN_HOUR) / MILLISECONDS_IN_MINUTE)
	const seconds = Math.floor((diff % MILLISECONDS_IN_MINUTE) / MILLISECONDS_IN_SECOND)

	return { totalMs: diff, days, hours, minutes, seconds }
}

const pad2 = (value: number) => String(value).padStart(2, '0')

export const useCountdown = ({ targetDate }: UseCountdownOptions) => {
	const target = useMemo(() => new Date(targetDate), [targetDate])
	const [timeLeft, setTimeLeft] = useState<TimeLeftState>(() => getTimeLeft(target))

	useEffect(() => {
		setTimeLeft(getTimeLeft(target))
		const timer = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000)
		return () => clearInterval(timer)
	}, [target])

	const isExpired = timeLeft.totalMs === 0

	const formatted = {
		days: pad2(timeLeft.days),
		hours: pad2(timeLeft.hours),
		minutes: pad2(timeLeft.minutes),
		seconds: pad2(timeLeft.seconds)
	}

	return { ...timeLeft, formatted, isExpired }
}
