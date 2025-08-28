import { ProfileDetails } from '@modules/profile-details'

interface ProfilePageProps {
	params: { id: string }
}

export default function ProfilePage({ params }: ProfilePageProps) {
	return <ProfileDetails id={params.id} />
}
