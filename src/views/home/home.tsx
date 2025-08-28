import { FC } from 'react'
import { HomeHero } from '@/modules/home-hero'
import classNames from 'classnames'

import styles from './home.module.scss'
import { HomeProps } from './home.types'

const Home: FC<HomeProps> = ({ className }) => {
  const rootClassName = classNames(styles.root, className)

  return (
    <main className={rootClassName}>
      <HomeHero />
    </main>
  )
}

export default Home
