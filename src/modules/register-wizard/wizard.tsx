"use client"
import { FC, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Button, Input, Wrapper, Heading } from '@/ui'

import styles from './wizard.module.scss'
import { CreatorProfileInput, RegisterWizardProps } from './wizard.types'

type Step = 0 | 1 | 2 | 3

const defaultData: CreatorProfileInput = {
	name: '',
	about: '',
	specialization: [],
	tools: [],
	experience: 'lt1',
	clients: '',
	portfolioLinks: [],
	achievements: '',
	telegram: '',
	socials: '',
	agreeHub: false
}

const RegisterWizard: FC<RegisterWizardProps> = ({ className }) => {
	const rootClassName = classNames(styles.root, className)
	const [step, setStep] = useState<Step>(0)
	const [data, setData] = useState<CreatorProfileInput>(defaultData)

	const canNext = useMemo(() => {
		if (step === 0) return data.name.trim().length > 1
		if (step === 1) return data.specialization.length > 0
		if (step === 2) return true
		return true
	}, [step, data])

	const set = (patch: Partial<CreatorProfileInput>) => setData((d) => ({ ...d, ...patch }))

	const submit = () => {
		// placeholder for API call
		console.log('submit registration', data)
		alert('Заявка отправлена')
	}

	return (
		<section className={rootClassName}>
			<Wrapper>
				<Heading tagName="h1">Регистрация</Heading>
				<div className={styles.grid}>
					{step === 0 && (
						<div>
							<div className={styles.field}>
								<label className={styles.label}>Имя</label>
								<Input value={data.name} onChange={(e) => set({ name: e.target.value })} />
							</div>

							<div className={styles.field}>
								<label className={styles.label}>О себе</label>
								<Input value={data.about} onChange={(e) => set({ about: e.target.value })} />
							</div>
						</div>
					)}

					{step === 1 && (
						<div>
							<div className={styles.field}>
								<label className={styles.label}>Специализация (через запятую)</label>
								<Input value={data.specialization.join(', ')} onChange={(e) => set({ specialization: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
							</div>

							<div className={styles.field}>
								<label className={styles.label}>Инструменты (через запятую)</label>
								<Input value={data.tools.join(', ')} onChange={(e) => set({ tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
							</div>
						</div>
					)}

					{step === 2 && (
						<div>
							<div className={styles.field}>
								<label className={styles.label}>Опыт</label>
								<select value={data.experience} onChange={(e) => set({ experience: e.target.value as CreatorProfileInput['experience'] })}>
									<option value="lt1">меньше года</option>
									<option value="1-2">1-2 года</option>
									<option value="2+">2+ года</option>
								</select>
							</div>

							<div className={styles.field}>
								<label className={styles.label}>Клиенты/проекты</label>
								<Input value={data.clients} onChange={(e) => set({ clients: e.target.value })} />
							</div>

							<div className={styles.field}>
								<label className={styles.label}>Портфолио (ссылки через запятую)</label>
								<Input value={(data.portfolioLinks || []).join(', ')} onChange={(e) => set({ portfolioLinks: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
							</div>
						</div>
					)}

					{step === 3 && (
						<div>
							<div className={styles.field}>
								<label className={styles.label}>Достижения</label>
								<Input value={data.achievements} onChange={(e) => set({ achievements: e.target.value })} />
							</div>

							<div className={styles.field}>
								<label className={styles.label}>Telegram и соцсети</label>
								<Input value={data.telegram} onChange={(e) => set({ telegram: e.target.value })} />
								<Input value={data.socials} onChange={(e) => set({ socials: e.target.value })} />
							</div>
						</div>
					)}

					<div className={styles.actions}>
						<Button onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}>
							Назад
						</Button>
						{step < 3 && (
							<Button onClick={() => setStep((s) => ((s + 1) as Step))} disabled={!canNext}>
								Далее
							</Button>
						)}
						{step === 3 && (
							<Button onClick={submit} disabled={!data.name || data.specialization.length === 0}>Отправить</Button>
						)}
					</div>
				</div>
			</Wrapper>
		</section>
	)
}

export default RegisterWizard
