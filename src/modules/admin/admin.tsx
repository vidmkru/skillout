"use client"
import { FC, useState } from 'react'
import { Wrapper, Heading, Button, Input } from '@/ui'
import styles from './admin.module.scss'

interface Report { id: string; profileId: string; reason: string; status: 'new' | 'approved' | 'rejected' }

const AdminPanel: FC = () => {
	const [reports, setReports] = useState<Report[]>([
		{ id: 'r1', profileId: '2', reason: 'Спам', status: 'new' }
	])
	const [search, setSearch] = useState('')

	const updateStatus = (id: string, status: Report['status']) => {
		setReports((arr) => arr.map((r) => (r.id === id ? { ...r, status } : r)))
	}

	return (
		<section className={styles.root}>
			<Wrapper>
				<Heading tagName="h2">Админ: модерация</Heading>
				<div style={{ margin: '12px 0' }}>
					<Input placeholder="Поиск по профилю" value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>ID</th>
							<th>Профиль</th>
							<th>Причина</th>
							<th>Статус</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						{reports
							.filter((r) => r.profileId.includes(search))
							.map((r) => (
								<tr key={r.id}>
									<td>{r.id}</td>
									<td>{r.profileId}</td>
									<td>{r.reason}</td>
									<td>{r.status}</td>
									<td>
										<div className={styles.actions}>
											<Button onClick={() => updateStatus(r.id, 'approved')}>Одобрить</Button>
											<Button onClick={() => updateStatus(r.id, 'rejected')}>Отклонить</Button>
										</div>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</Wrapper>
		</section>
	)
}

export default AdminPanel
