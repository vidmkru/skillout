import { FC } from 'react'
import { RegisterProForm } from '@/modules/auth/register-pro-form'
import { Wrapper } from '@/ui'

import styles from './page.module.scss'

const RegisterProPage: FC = () => {
	return (
		<Wrapper className={styles.wrapper}>
			<RegisterProForm />
		</Wrapper>
	)
}

export default RegisterProPage
