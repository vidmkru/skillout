import { FC } from 'react'
import classNames from 'classnames'
import { Wrapper } from '@/ui'

import styles from './wow-card.module.scss'

interface WowCardProps { className?: string }

const WowCard: FC<WowCardProps> = ({ className }) => {
	return (
		<section className={styles.root}>
			<Wrapper>
				<div className={classNames(styles.card, className)}>
					<div className={styles.neonRing} />
					<div className={styles.content}>Skillout — создавай будущее</div>
				</div>
			</Wrapper>
		</section>
	)
}

export default WowCard
