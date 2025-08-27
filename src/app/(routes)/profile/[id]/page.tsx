import { ProfileDetails } from '@modules/profile-details'

interface Props { params: { id: string } }

export default function ProfilePage({ params }: Props) {
	return <ProfileDetails id={params.id} />
}
