import { FC } from 'react'
import classNames from 'classnames'

import { Wrapper } from '@/ui'

import styles from './overview.module.scss'
import { OverviewProps } from './overview.types'

const Overview: FC<OverviewProps> = ({ className }) => {
	const rootClassName = classNames(styles.root, className)

	return (
		<section className={rootClassName}>
			<Wrapper>
				<div className={styles.grid}>
					<div className={classNames(styles.panel, styles.a)}>
						<div className={styles.num}>100</div>
						<div className={styles.caption}>участников</div>
					</div>
					<div className={classNames(styles.panel, styles.b)}>
						<div className={styles.num}>24</div>
						<div className={styles.caption}>часа</div>
					</div>
					<div className={classNames(styles.panel, styles.c)}>
						<div className={styles.offline}>Offline</div>
					</div>
				</div>
			</Wrapper>
		</section>
	)
}

export default Overview
