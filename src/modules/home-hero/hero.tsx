"use client"
import { FC } from 'react'
import classNames from 'classnames'
import { useRouter } from 'next/navigation'

import { Wrapper, Button, Heading } from '@/ui'
import { useAuth } from '@/shared/hooks/useAuth'

import styles from './hero.module.scss'
import { HeroProps } from './hero.types'

const Hero: FC<HeroProps> = ({ className }) => {
	const rootClassName = classNames(styles.root, className)
	const router = useRouter()
	const { user } = useAuth()

	const handleGetStarted = () => {
		if (user) {
			router.push('/profiles')
		} else {
			router.push('/register')
		}
	}

	return (
		<section className={rootClassName}>
			<Wrapper className={styles.content}>
				<div className={styles.heroContent}>
					<Heading tagName="h1" className={styles.title}>
						SkillOut
					</Heading>
					<p className={styles.subtitle}>
						Платформа для креаторов и продюсеров. Найдите идеального специалиста для вашего проекта или покажите свои навыки миру.
					</p>
					<div className={styles.ctaGroup}>
						<Button
							className={styles.cta}
							onClick={handleGetStarted}
						>
							{user ? 'Найти креаторов' : 'Начать'}
						</Button>
						{!user && (
							<Button
								className={styles.secondaryCta}
								onClick={() => router.push('/login')}
							>
								Войти
							</Button>
						)}
					</div>
				</div>

				<div className={styles.features}>
					<div className={styles.feature}>
						<div className={styles.featureIcon}>🎬</div>
						<h3>Видеомонтаж</h3>
						<p>Профессиональные видеомонтажеры</p>
					</div>
					<div className={styles.feature}>
						<div className={styles.featureIcon}>🎨</div>
						<h3>Дизайн</h3>
						<p>Креативные дизайнеры</p>
					</div>
					<div className={styles.feature}>
						<div className={styles.featureIcon}>📱</div>
						<h3>Анимация</h3>
						<p>Современная анимация</p>
					</div>
				</div>
			</Wrapper>
		</section>
	)
}

export default Hero
