'use client'

import { FC, useEffect, useState } from 'react'
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
          <a className={styles.link} href="/">Главная</a>

          {/* Show registration only if not authenticated */}
          {!isAuthenticated && (
            <a className={styles.link} href="/register">Регистрация</a>
          )}

          {/* Show profiles for all authenticated users */}
          {isAuthenticated && (
            <a className={styles.link} href="/profiles">Профили</a>
          )}

          {/* Show invite page for creators and admins */}
          {isAuthenticated && (user?.role === 'creator' || user?.role === 'creator-pro' || user?.role === 'admin') && (
            <a className={styles.link} href="/invite">Инвайты</a>
          )}

          {/* Show subscriptions for producers */}
          {isAuthenticated && user?.role === 'producer' && (
            <a className={styles.link} href="/subscriptions">Подписки</a>
          )}

          {/* Show admin panel for admins */}
          {isAuthenticated && user?.role === 'admin' && (
            <a className={styles.link} href="/admin">Админ панель</a>
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
              <a className={styles.link} href="/login">Войти</a>
            )}
          </div>

          <strong className={styles.version}>v {config.version}</strong>
        </nav>
      </Wrapper>
    </header>
  )
}

export default Header
