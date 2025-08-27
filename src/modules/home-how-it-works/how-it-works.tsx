import { FC } from 'react'
import classNames from 'classnames'
import { Wrapper, Heading } from '@/ui'

import styles from './how-it-works.module.scss'
import { HowItWorksProps } from './how-it-works.types'

const steps = [
	{ title: 'Принимаем ваши заявки', desc: 'Можно одному или в команде до 4 человек.' },
	{ title: 'Отбираем лучших специалистов', desc: 'Критерии: бриф, оригинальность, качество.' },
	{ title: 'Собираем 100 человек офлайн', desc: 'Делим на команды.' },
	{ title: 'Вскрываем конверт', desc: 'Единый бриф от реального клиента.' },
	{ title: 'За 24 часа', desc: 'Команды создают рекламное видео с ИИ.' },
	{ title: 'Выявляем победителей', desc: 'Вручаем награды.' },
	{ title: 'Собеседования', desc: 'По необходимости — в лучшие компании России.' }
]

const HowItWorks: FC<HowItWorksProps> = ({ className }) => {
	const rootClassName = classNames(styles.root, className)

	return (
		<section className={rootClassName}>
			<Wrapper>
				<Heading tagName="h2" className={styles.title}>Как это работает?</Heading>
				<div className={styles.grid}>
					{steps.map((s, i) => (
						<article key={i} className={styles.card}>
							<div className={styles.title}>{s.title}</div>
							<div className={styles.desc}>{s.desc}</div>
						</article>
					))}
				</div>
			</Wrapper>
		</section>
	)
}

export default HowItWorks
