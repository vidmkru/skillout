"use client"
import { FC, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Wrapper, Input } from '@/ui'

import styles from './profiles.module.scss'
import { ProfilesListProps } from './profiles.types'
import { CreatorProfile } from '@/shared/types/common'

const MOCK_PROFILES: CreatorProfile[] = [
	{ id: '1', name: 'Анна Видеомейкер', specialization: ['Видеомонтаж'], tools: ['Runway'], experience: '2+', rating: 4.8 },
	{ id: '2', name: 'Иван CGI', specialization: ['CGI', '3D'], tools: ['Blender', 'MJ'], experience: '1-2', rating: 4.5 },
	{ id: '3', name: 'Мария Prompt', specialization: ['Промпт-инженер'], tools: ['MJ', 'Veo'], experience: 'lt1', rating: 4.2 },
	{ id: '4', name: 'Олег VFX', specialization: ['VFX'], tools: ['Nuke'], experience: '2+', rating: 4.9 }
]

const ProfilesList: FC<ProfilesListProps> = ({ className }) => {
	const rootClassName = classNames(styles.root, className)
	const [query, setQuery] = useState('')

	const filtered = useMemo(() => {
		const q = query.toLowerCase().trim()
		if (!q) return MOCK_PROFILES
		return MOCK_PROFILES.filter((p) =>
			[p.name, ...p.specialization, ...p.tools].join(' ').toLowerCase().includes(q)
		)
	}, [query])

	return (
		<section className={rootClassName}>
			<Wrapper>
				<div className={styles.toolbar}>
					<Input placeholder="Поиск" value={query} onChange={(e) => setQuery(e.target.value)} />
				</div>
				<div className={styles.grid}>
					{filtered.map((p) => (
						<article key={p.id} className={styles.card}>
							<div className={styles.name}>{p.name}</div>
							<div>{p.specialization.join(', ')}</div>
							<div>Инструменты: {p.tools.join(', ')}</div>
						</article>
					))}
				</div>
			</Wrapper>
		</section>
	)
}

export default ProfilesList
