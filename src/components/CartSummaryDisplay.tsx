'use client'

import { useCart } from './CartContext'
import React from 'react'

export default function CartSummaryDisplay() {
  const { totalPrice } = useCart()

  return (
    <span className="text-white">{totalPrice.toFixed(2)} лв. </span>
  )
}
