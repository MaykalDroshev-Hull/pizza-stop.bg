'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
    
    // Enable analytics/tracking here if needed
    // Example: window.gtag('consent', 'update', { analytics_storage: 'granted' })
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setShowBanner(false)
    
    // Disable analytics/tracking here
    // Example: window.gtag('consent', 'update', { analytics_storage: 'denied' })
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-text-secondary">
              Използваме бисквитки (cookies) за подобряване на вашето изживяване. 
              Като продължите да използвате сайта, вие приемате използването на бисквитки.{' '}
              <Link 
                href="/privacy-policy" 
                className="text-primary hover:text-primary-hover underline"
              >
                Научете повече
              </Link>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white border border-gray-600 rounded-lg hover:bg-bg-hover transition-colors"
            >
              Откажи
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
            >
              Приемам
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}






