'use client'

import { FC, useEffect, useState } from 'react'
import Link from 'next/link'
import { Wrapper } from '@/ui'
import { useAuth } from '@/shared/hooks/useAuth'
import { Button } from '@/ui/button'
import classNames from 'classnames'

import config from '../../../package.json'
import styles from './header.module.scss'
import { HeaderProps } from './header.types'
import Logo from './logo'

const Header: FC<HeaderProps> = ({ className }) => {
  const [isSticky, setSticky] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const headerClassName = classNames(styles.root, className, { [styles.sticky]: isSticky })

  return (
    <header className={headerClassName}>
      <Wrapper className={styles.wrapper}>
        <Logo />
        <nav className={styles.nav} aria-label="Главная навигация">
          {/* Show registration only if not authenticated */}
          {!isAuthenticated && (
            <Link className={styles.link} href="/register">Регистрация</Link>
          )}

          {/* Navigation for authenticated users */}
          {isAuthenticated && (
            <>
              <a className={styles.link} href="https://skillout.pro/" target="_blank" rel="noopener noreferrer">Главная</a>
              <Link className={styles.link} href="/profiles">Креаторы</Link>
              <Link className={styles.link} href="/profiles">Продакшны</Link>
              <Link className={styles.link} href="/invite">Инвайты</Link>
            </>
          )}

          {/* Show admin panel for admins */}
          {isAuthenticated && user?.role === 'admin' && (
            <Link className={styles.link} href="/admin">Админ панель</Link>
          )}

          {/* Authentication section */}
          <div className={styles.authSection}>
            {isAuthenticated ? (
              <div className={styles.userInfo}>
                <span className={styles.userEmail}>{user?.email}</span>
                <span className={styles.userRole}>({user?.role})</span>
                <Button
                  onClick={handleLogout}
                  className={styles.logoutButton}
                  size="sm"
                >
                  Выйти
                </Button>
              </div>
            ) : (
              <Link className={styles.link} href="/login">Войти</Link>
            )}
          </div>

          <strong className={styles.version}>v {config.version}</strong>
        </nav>
      </Wrapper>
    </header>
  )
}

export default Header
