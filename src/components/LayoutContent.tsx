'use client'

import { useEffect } from 'react'
import { useLoading } from './LoadingContext'
import LoadingOverlay from './LoadingOverlay'
import NavBar from './NavBar'
import Footer from './Footer'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, stopInitialLoading } = useLoading()

  // Stop initial loading after a short delay to show the loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      stopInitialLoading()
    }, 1500) // Show loading screen for 1.5 seconds

    return () => clearTimeout(timer)
  }, [stopInitialLoading])

  return (
    <div className="min-h-screen bg-bg text-text">
      {!isLoading && <NavBar />}
      <main className="flex-1">
        {children}
      </main>
      {!isLoading && <Footer />}
      <LoadingOverlay />
    </div>
  )
}
