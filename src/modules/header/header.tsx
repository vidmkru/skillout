'use client'

import { FC, useEffect, useState } from 'react'
import { Wrapper } from '@/ui'
import classNames from 'classnames'

import config from '../../../package.json'
import styles from './header.module.scss'
import { HeaderProps } from './header.types'
import Logo from './logo'

const Header: FC<HeaderProps> = ({ className }) => {
  const [isSticky, setSticky] = useState(false)
  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headerClassName = classNames(styles.root, className, { [styles.sticky]: isSticky })
  return (
    <header className={headerClassName}>
      <Wrapper className={styles.wrapper}>
        <Logo />
        <nav className={styles.nav} aria-label="Главная навигация">
          <a className={styles.link} href="/">Главная</a>
          <a className={styles.link} href="/register">Регистрация</a>
          <a className={styles.link} href="/profiles">Профили</a>
          <a className={styles.link} href="/invite">Инвайт</a>
          <a className={styles.link} href="/subscriptions">Подписки</a>
          <strong>v {config.version}</strong>
        </nav>
      </Wrapper>
    </header>
  )
}

export default Header
