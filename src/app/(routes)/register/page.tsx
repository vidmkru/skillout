'use client'

import { useSearchParams } from 'next/navigation'
import { RegisterForm } from '@/modules/auth/register-form'

export default function RegisterPage() {
	const searchParams = useSearchParams()
	const inviteCode = searchParams.get('code')
	const inviteType = searchParams.get('type')

	return (
		<RegisterForm
			inviteCode={inviteCode || undefined}
			inviteType={inviteType || undefined}
		/>
	)
}
