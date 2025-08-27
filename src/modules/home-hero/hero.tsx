"use client"
import { FC } from 'react'
import classNames from 'classnames'

import { Wrapper, Button, Heading } from '@/ui'
import { track } from '@/shared/analytics'
import { useCountdown } from '@/shared/hooks'

import styles from './hero.module.scss'
import { HeroProps } from './hero.types'

const DEFAULT_TARGET = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)

const Hero: FC<HeroProps> = ({ className, targetDate = DEFAULT_TARGET }) => {
	const rootClassName = classNames(styles.root, className)
	const { formatted, isExpired } = useCountdown({ targetDate })

	return (
		<section className={rootClassName}>
			<Wrapper className={styles.content}>
				<div>
					<Heading tagName="h1" className={styles.title}>
						SKILOUT HACKATHON
					</Heading>
					<p className={styles.subtitle}>Хакатон генеративного контента от создателей VidMK</p>
					<Button className={styles.cta} onClick={() => track('cta_click', { source: 'hero' })}>Записаться</Button>
				</div>

				<div aria-live="polite" className={styles.timer}>
					<div className={styles.timerItem}>
						<div className={styles.time}>{formatted.days}</div>
						<div className={styles.label}>Дня</div>
					</div>
					<div className={styles.timerItem}>
						<div className={styles.time}>{formatted.hours}</div>
						<div className={styles.label}>Часов</div>
					</div>
					<div className={styles.timerItem}>
						<div className={styles.time}>{formatted.minutes}</div>
						<div className={styles.label}>Минут</div>
					</div>
					<div className={styles.timerItem}>
						<div className={styles.time}>{formatted.seconds}</div>
						<div className={styles.label}>Секунд</div>
					</div>
				</div>
			</Wrapper>
			{isExpired && <span className="visually-hidden">Событие началось</span>}
		</section>
	)
}

export default Hero
