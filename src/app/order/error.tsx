'use client'

import { useEffect } from 'react'

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Order page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Грешка при зареждане на менюто
        </h2>
        <p className="text-text-secondary mb-8">
          Не успяхме да заредим менюто. Моля, опитайте отново или ни се обадете директно.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-hover transition-colors"
          >
            Опитай отново
          </button>
          <a
            href="tel:+359888123456"
            className="block w-full px-6 py-3 bg-secondary text-white rounded-2xl font-semibold hover:bg-secondary-hover transition-colors"
          >
            Обади се за поръчка
          </a>
        </div>
      </div>
    </div>
  )
}



