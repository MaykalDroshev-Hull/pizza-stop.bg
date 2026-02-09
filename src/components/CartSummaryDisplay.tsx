'use client'

import { useCart } from './CartContext'
import React, { useState, useEffect } from 'react'
import { convertToBGN, formatBGNPrice } from '@/utils/currency'

export default function CartSummaryDisplay() {
  const { totalPrice } = useCart()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering actual value after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial render, show loading or placeholder
  if (!mounted) {
    return <span className="text-white">0.00 €. </span>
  }

  const bgnPrice = convertToBGN(totalPrice)

  return (
    <span className="text-white">
      {totalPrice.toFixed(2)} €. <span className="text-muted text-sm">({formatBGNPrice(bgnPrice)})</span>
    </span>
  )
}
