'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

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

  const startLoading = () => {
    console.log('🚀 LoadingContext: startLoading() called')
    setIsLoading(true)
    console.log('✅ LoadingContext: isLoading set to true')
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
