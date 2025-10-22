'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Ensure component is mounted (hydration safety)
    setIsMounted(true)
    
    try {
      // Check if user has already consented
      const consent = localStorage.getItem('cookie-consent')
      if (!consent) {
        // Show banner after a short delay for better UX
        const timer = setTimeout(() => setShowBanner(true), 1000)
        return () => clearTimeout(timer)
      }
    } catch (error) {
      // If localStorage fails, just don't show the banner
      console.error('Failed to check cookie consent:', error)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie-consent', 'accepted')
      setShowBanner(false)
      
      // Enable analytics/tracking here if needed
      // Example: window.gtag('consent', 'update', { analytics_storage: 'granted' })
    } catch (error) {
      console.error('Failed to save cookie consent:', error)
      // Still close the banner even if we can't save
      setShowBanner(false)
    }
  }

  const handleReject = () => {
    try {
      localStorage.setItem('cookie-consent', 'rejected')
      setShowBanner(false)
      
      // Disable analytics/tracking here
      // Example: window.gtag('consent', 'update', { analytics_storage: 'denied' })
    } catch (error) {
      console.error('Failed to save cookie consent:', error)
      // Still close the banner even if we can't save
      setShowBanner(false)
    }
  }

  // Don't render anything until mounted (prevents hydration issues)
  if (!isMounted || !showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 md:left-auto md:right-6 md:max-w-md z-50 animate-[slideUp_0.4s_ease-out]">
      <div 
        className="relative rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Subtle gradient overlay for depth */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%)'
          }}
        />
        
        <div className="relative p-5">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-white mb-2">
                Как да поръчаме
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Използваме бисквитки (cookies) за подобряване на вашето изживяване. 
                Като продължите да използвате сайта, вие приемате използването на бисквитки.{' '}
                <Link 
                  href="/privacy-policy" 
                  className="text-[#ef4444] hover:text-[#dc2626] underline transition-colors"
                >
                  Научете повече
                </Link>
              </p>
            </div>
            
            <div className="flex gap-2.5">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white border border-white/20 rounded-2xl hover:bg-white/10 transition-all duration-200"
              >
                Откажи
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-2xl transition-all duration-200 shadow-lg shadow-red-500/30"
              >
                Приемам
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






