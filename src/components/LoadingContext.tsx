'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LoadingContextType {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
  stopInitialLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false) // Start with loading false
  const [isInitialLoad, setIsInitialLoad] = useState(false) // Track initial page load

  // Automatically stop initial loading after page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitialLoad) {
        setIsInitialLoad(false)
        setIsLoading(false)
      }
    }, 1000) // Stop loading after 1 second

    return () => clearTimeout(timer)
  }, [isInitialLoad])

  const startLoading = () => {
    setIsLoading(true)
  }

  const stopLoading = () => {
    setIsLoading(false)
  }

  const stopInitialLoading = () => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      setIsLoading(false)
    }
  }

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, stopInitialLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
