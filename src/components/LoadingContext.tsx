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
  const [isLoading, setIsLoading] = useState(true) // Start with loading true
  const [isInitialLoad, setIsInitialLoad] = useState(true) // Track initial page load

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
