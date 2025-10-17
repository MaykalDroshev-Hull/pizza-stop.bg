'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Грешка в таблото
        </h2>
        <p className="text-text-secondary mb-8">
          Не успяхме да заредим вашето табло. Моля, опитайте отново.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-hover transition-colors"
        >
          Опитай отново
        </button>
      </div>
    </div>
  )
}



