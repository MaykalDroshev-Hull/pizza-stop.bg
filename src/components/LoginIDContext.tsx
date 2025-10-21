'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  LocationText?: string
  addressInstructions?: string
  LocationCoordinates?: string
  created_at?: string
}

interface LoginIDContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  refreshUser: () => void
}

const LoginIDContext = createContext<LoginIDContextType | undefined>(undefined)

export function LoginIDProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error)
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const parsedUser = JSON.parse(e.newValue)
            setUser(parsedUser)
            setIsAuthenticated(true)
          } catch (error) {
            console.error('Error parsing user data from storage event:', error)
          }
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('user', JSON.stringify(userData))
    // Store user ID for authorization headers (temporary solution)
    localStorage.setItem('user_id', userData.id.toString())
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    localStorage.removeItem('user_id')
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const refreshUser = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error refreshing user:', error)
        logout()
      }
    } else {
      logout()
    }
  }

  return (
    <LoginIDContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateUser,
      refreshUser
    }}>
      {children}
    </LoginIDContext.Provider>
  )
}

export function useLoginID() {
  const context = useContext(LoginIDContext)
  if (context === undefined) {
    throw new Error('useLoginID must be used within a LoginIDProvider')
  }
  return context
}

