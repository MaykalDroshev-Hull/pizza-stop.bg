'use client'

import { useLoading } from './LoadingContext'

export default function LoadingOverlay() {
  const { isLoading } = useLoading()

  if (!isLoading) {
    return null
  }

  return (
    <>
      {/* Global backdrop blur - covers entire viewport */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[9998]" />
      
      {/* Loading overlay - highest z-index */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        {/* Logo container */}
        <div className="flex flex-col items-center justify-center pointer-events-auto">
          <img 
            src="/images/home/logo.png"
            alt="PIZZA STOP Logo"
            className="w-32 h-32 object-contain"
            style={{
              animation: 'logoSpin 1s linear forwards'
            }}
          />
          
          {/* Loading text */}
          <div className="mt-6 text-center">
            <p className="text-white text-lg font-semibold mb-2">Зареждане...</p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle"></div>
              <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
