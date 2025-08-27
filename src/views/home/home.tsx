import { FC } from 'react'
import { HomeHero } from '@/modules/home-hero'
import { HomeOverview } from '@/modules/home-overview'
import { HomeHowItWorks } from '@/modules/home-how-it-works'
import { WowCard } from '@/modules/wow-card'
import { UserInfo } from '@/modules/user-info'
import classNames from 'classnames'

import styles from './home.module.scss'
import { HomeProps } from './home.types'

const Home: FC<HomeProps> = ({ className }) => {
  const rootClassName = classNames(styles.root, className)

  return (
    <main className={rootClassName}>
      <HomeHero />
      <UserInfo />
      <HomeOverview />
      <HomeHowItWorks />
      <WowCard />
    </main>
  )
}

export default Home
