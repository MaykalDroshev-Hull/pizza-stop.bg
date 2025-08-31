'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import styles from '../styles/ThemeToggle.module.css'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button className={styles.themeToggle} aria-label="Loading theme toggle">
        <div className={styles.toggleTrack}>
          <div className={styles.toggleThumb} />
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className={styles.toggleTrack}>
        <div className={`${styles.toggleThumb} ${theme === 'light' ? styles.light : styles.dark}`}>
          {theme === 'dark' ? (
            <Moon className={styles.icon} size={16} />
          ) : (
            <Sun className={styles.icon} size={16} />
          )}
        </div>
      </div>
    </button>
  )
}

