'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ProductAddon } from '../lib/menuData'

interface CartItem {
  id: number
  name: string
  price: number
  image: string
  category: string
  size?: string
  addons: ProductAddon[]
  comment?: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  getItemTotalPrice: (item: CartItem) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize cart from localStorage if available
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('pizza-stop-cart')
      if (savedCart) {
        try {
          return JSON.parse(savedCart)
        } catch (error) {
          console.error('Error parsing saved cart:', error)
          localStorage.removeItem('pizza-stop-cart')
        }
      }
    }
    return []
  })

  // Calculate addon cost for an item (first 3 free, others cost money)
  const calculateAddonCost = (addons: ProductAddon[]) => {
    return addons
      .map((addon, index) => index < 3 ? 0 : addon.Price)
      .reduce((sum, price) => sum + price, 0)
  }

  // Get total price for an item including addons
  const getItemTotalPrice = (item: CartItem) => {
    const addonCost = calculateAddonCost(item.addons)
    return (item.price + addonCost) * item.quantity
  }

  const addItem = (newItem: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => 
        item.id === newItem.id && 
        item.size === newItem.size &&
        JSON.stringify(item.addons.map(a => a.AddonID).sort()) === JSON.stringify(newItem.addons.map(a => a.AddonID).sort()) &&
        item.comment === newItem.comment
      )

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += newItem.quantity
        return updatedItems
      } else {
        return [...prevItems, newItem]
      }
    })
  }

  const removeItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pizza-stop-cart')
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + getItemTotalPrice(item), 0)

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pizza-stop-cart', JSON.stringify(items))
    }
  }, [items])

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      getItemTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
