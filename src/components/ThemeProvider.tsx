'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  theme: string
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    // Get theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('theme', theme)
    
    // Update document class and CSS variables
    document.documentElement.className = theme
    document.documentElement.setAttribute('data-theme', theme)
    
    // Update CSS custom properties
    const root = document.documentElement
    if (theme === 'light') {
      root.style.setProperty('--bg', '#ffffff')
      root.style.setProperty('--text', '#1a1a1a')
      root.style.setProperty('--muted', '#666666')
      root.style.setProperty('--card', '#f8f9fa')
      root.style.setProperty('--border', 'rgba(0, 0, 0, 0.1)')
      root.style.setProperty('--shadow', '0 10px 25px rgba(0, 0, 0, 0.1)')
    } else {
      root.style.setProperty('--bg', '#0b1020')
      root.style.setProperty('--text', '#f8fafc')
      root.style.setProperty('--muted', '#cbd5e1')
      root.style.setProperty('--card', '#0f172a')
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.08)')
      root.style.setProperty('--shadow', '0 10px 25px rgba(0, 0, 0, 0.25)')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
