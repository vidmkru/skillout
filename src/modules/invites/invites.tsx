"use client"
import { FC, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Wrapper, Button, Input, Heading } from '@/ui'
import styles from './invites.module.scss'
import { track } from '@/shared/analytics'

interface InviteItem { code: string; sentTo?: string; used?: boolean }

const generateCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

const Invites: FC = () => {
	const [quota, setQuota] = useState(2)
	const [email, setEmail] = useState('')
	const [invites, setInvites] = useState<InviteItem[]>([])

	const canSend = useMemo(() => quota > 0 && /.+@.+/.test(email), [quota, email])

	const sendInvite = () => {
		if (!canSend) return
		const code = generateCode()
		setInvites((arr) => [{ code, sentTo: email, used: false }, ...arr])
		setQuota((q) => q - 1)
		setEmail('')
		track('invite_sent')
	}

	const redeem = (code: string) => {
		setInvites((arr) => arr.map((i) => (i.code === code ? { ...i, used: true } : i)))
		track('invite_redeemed')
	}

	const refreshMonthly = () => setQuota(2)

	return (
		<section className={classNames(styles.root)}>
			<Wrapper>
				<Heading tagName="h2">Инвайты</Heading>
				<div className={styles.row}>
					<div className={styles.quota}>Доступно: {quota}</div>
					<Button onClick={refreshMonthly}>Обновить квоту</Button>
				</div>

				<div className={styles.row}>
					<Input placeholder="email получателя" value={email} onChange={(e) => setEmail(e.target.value)} />
					<Button onClick={sendInvite} disabled={!canSend}>Выдать инвайт</Button>
				</div>

				<div className={styles.list}>
					{invites.map((i) => (
						<div key={i.code}>
							<span className={styles.code}>{i.code}</span> → {i.sentTo} {i.used ? '(использован)' : <Button onClick={() => redeem(i.code)}>Redeem</Button>}
						</div>
					))}
				</div>
			</Wrapper>
		</section>
	)
}

export default Invites
