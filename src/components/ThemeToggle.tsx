'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import styles from '../styles/ThemeToggle.module.css'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className={styles.toggleContainer}>
        <div className={`${styles.toggleTrack} ${theme === 'light' ? styles.light : styles.dark}`}>
          <div className={`${styles.toggleThumb} ${theme === 'light' ? styles.light : styles.dark}`}>
            {theme === 'dark' ? (
              <Moon className={styles.icon} size={16} />
            ) : (
              <Sun className={styles.icon} size={16} />
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

