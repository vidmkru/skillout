import { FC } from 'react'
import Image from 'next/image'
import { Heading, Wrapper } from '@/ui'
import { HomeHero } from '@/modules/home-hero'
import { HomeOverview } from '@/modules/home-overview'
import { HomeHowItWorks } from '@/modules/home-how-it-works'
import { WowCard } from '@/modules/wow-card'
import classNames from 'classnames'

import styles from './home.module.scss'
import { HomeProps } from './home.types'

const Home: FC<HomeProps> = ({ className }) => {
  const rootClassName = classNames(styles.root, className)

  return (
    <main className={rootClassName}>
      <HomeHero />
      <HomeOverview />
      <HomeHowItWorks />
      <WowCard />
      <Wrapper>
        <Heading tagName="h2" className={styles.title}>Demo assets</Heading>
        <Image src="/images/sticker-shark.png" width={512} height={492} quality={85} alt="Ligazavr" className={styles.image} />
      </Wrapper>
    </main>
  )
}

export default Home
