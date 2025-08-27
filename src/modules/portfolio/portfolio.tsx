"use client"
import { FC, useState } from 'react'
import classNames from 'classnames'
import { Wrapper, Heading } from '@/ui'

import styles from './portfolio.module.scss'
import { track } from '@/shared/analytics'

export interface PortfolioItem { id: string; title: string; thumb?: string; videoUrl?: string }

const MOCK: PortfolioItem[] = [
	{ id: 'v1', title: 'Case 1', videoUrl: 'https://player.kinescope.io/latest/iframe.html?video=demo' },
	{ id: 'v2', title: 'Case 2', videoUrl: 'https://player.kinescope.io/latest/iframe.html?video=demo' },
	{ id: 'v3', title: 'Case 3', videoUrl: 'https://player.kinescope.io/latest/iframe.html?video=demo' },
	{ id: 'v4', title: 'Case 4', videoUrl: 'https://player.kinescope.io/latest/iframe.html?video=demo' }
]

interface PortfolioProps { className?: string }

const Portfolio: FC<PortfolioProps> = ({ className }) => {
	const [openId, setOpenId] = useState<string | null>(null)
	const open = (id: string) => { setOpenId(id); track('portfolio_open', { id }) }
	const close = () => setOpenId(null)

	const current = MOCK.find((i) => i.id === openId)

	return (
		<section className={classNames(styles.root, className)}>
			<Wrapper>
				<Heading tagName="h3">Портфолио</Heading>
				<div className={styles.grid}>
					{MOCK.map((item) => (
						<div key={item.id} className={styles.item} onClick={() => open(item.id)}>
							<div className={styles.thumb} />
							<div className={styles.caption}>{item.title}</div>
						</div>
					))}
				</div>

				{current && (
					<div className={styles.modalBackdrop} onClick={close}>
						<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
							<iframe src={current.videoUrl} width="100%" height="100%" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen></iframe>
						</div>
					</div>
				)}
			</Wrapper>
		</section>
	)
}

export default Portfolio
