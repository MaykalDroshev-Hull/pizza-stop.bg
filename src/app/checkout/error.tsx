'use client'

import { useEffect } from 'react'

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Checkout error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-[#FF4D4D] mb-4">
          Грешка при поръчката
        </h2>
        <p className="text-gray-300 mb-8">
          Възникна проблем при обработката на вашата поръчка. Моля, проверете кошницата си и опитайте отново.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full px-6 py-3 bg-[#FF4D4D] text-white rounded-2xl font-semibold hover:bg-[#e64444] transition-colors"
          >
            Опитай отново
          </button>
          <a
            href="/order"
            className="block w-full px-6 py-3 bg-[#00D66C] text-white rounded-2xl font-semibold hover:bg-[#00c061] transition-colors"
          >
            Обратно към менюто
          </a>
        </div>
      </div>
    </div>
  )
}

