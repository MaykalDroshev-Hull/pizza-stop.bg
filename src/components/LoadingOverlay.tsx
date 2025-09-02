'use client'

import { useLoading } from './LoadingContext'

export default function LoadingOverlay() {
  const { isLoading } = useLoading()

  // Debug logging
  console.log('🔄 LoadingOverlay render - isLoading:', isLoading)

  if (!isLoading) {
    console.log('❌ LoadingOverlay: not showing (isLoading = false)')
    return null
  }

  console.log('✅ LoadingOverlay: showing (isLoading = true)')

  return (
    <>
      {/* Global backdrop blur - covers entire viewport */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[9998]" />
      
      {/* Loading overlay - highest z-index */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        {/* Logo container */}
        <div className="flex flex-col items-center justify-center pointer-events-auto">
          <img 
            src="https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU2Mzk1NzY5LCJleHAiOjI3MDI0NzU3Njl9.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg"
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
