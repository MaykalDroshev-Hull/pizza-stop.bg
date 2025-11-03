'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { ProductAddon } from '../lib/menuData'

interface CartItem {
  id: number | string  // Allow string for unique cart item IDs (product_timestamp)
  productId?: number   // Original database ProductID (for regular products)
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
  removeItem: (id: number | string) => void
  updateQuantity: (id: number | string, quantity: number) => void
  clearCart: () => void
  refreshFromStorage: () => void
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
          const parsedCart = JSON.parse(savedCart)

          // Validate cart data integrity - prevent price manipulation
          if (Array.isArray(parsedCart)) {
            const suspiciousItems = parsedCart.filter((item: any) =>
              item.price < 0.50 || // Suspiciously low price
              item.price === 0 && !item.name?.toLowerCase().includes('free') || // Zero price on non-free items
              typeof item.price !== 'number' || // Invalid price type
              item.price > 1000 // Unreasonably high price
            )
          }

          return parsedCart
      }
    }
    return []
  })

  // Calculate addon cost for an item
  const calculateAddonCost = (addons: ProductAddon[], category?: string) => {
    return addons
      .map((addon) => {
        // For pizzas (including 50/50 pizzas), all addons are paid
        if (category === 'pizza' || category === 'pizza-5050') {
          return addon.Price
        }
        
        // For other products, first 3 of each type are free
        const typeSelected = addons.filter(a => a.AddonType === addon.AddonType)
        const positionInType = typeSelected.findIndex(a => a.AddonID === addon.AddonID)
        return positionInType < 3 ? 0 : addon.Price
      })
      .reduce((sum, price) => sum + price, 0)
  }

  // Get total price for an item including addons
  const getItemTotalPrice = useCallback((item: CartItem) => {
    const addonCost = calculateAddonCost(item.addons, item.category)
    return (item.price + addonCost) * item.quantity
  }, [])

  const addItem = useCallback((newItem: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => 
        item.id === newItem.id && 
        item.size === newItem.size &&
        JSON.stringify(item.addons.map(a => a.AddonID).sort()) === JSON.stringify(newItem.addons.map(a => a.AddonID).sort()) &&
        item.comment === newItem.comment
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        const newItems = [...prevItems, newItem];
        return newItems;
      }
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pizza-stop-cart');
    }
  }, []);

  const refreshFromStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('pizza-stop-cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        } catch {
          localStorage.removeItem('pizza-stop-cart');
          setItems([]);
        }
      } else {
        setItems([]);
      }
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + getItemTotalPrice(item), 0);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Additional validation before saving - prevent manipulation
      const suspiciousItems = items.filter(item =>
        item.price < 0.50 || // Suspiciously low price
        item.price === 0 && !item.name?.toLowerCase().includes('free') || // Zero price on non-free items
        typeof item.price !== 'number' || // Invalid price type
        item.price > 1000 // Unreasonably high price
      )

      if (suspiciousItems.length > 0) {
        // Don't save manipulated data
        return
      }

      localStorage.setItem('pizza-stop-cart', JSON.stringify(items));
    }
  }, [items]);

  // Monitor for localStorage manipulation attempts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let lastCartData = localStorage.getItem('pizza-stop-cart')

      // Check for rapid localStorage changes (potential manipulation script)
      const checkInterval = setInterval(() => {
        const currentCartData = localStorage.getItem('pizza-stop-cart')
        if (currentCartData !== lastCartData) {

          // If the change looks suspicious, validate and potentially clear
          try {
            const parsedData = JSON.parse(currentCartData || '[]')
            if (Array.isArray(parsedData)) {
              const suspiciousItems = parsedData.filter((item: any) =>
                item.price < 0.50 ||
                (item.price === 0 && !item.name?.toLowerCase().includes('free'))
              )

              if (suspiciousItems.length > 0) {
                localStorage.removeItem('pizza-stop-cart')
                window.location.reload() // Force reload to reset cart
              }
            }
          } catch {
            localStorage.removeItem('pizza-stop-cart')
          }

          lastCartData = currentCartData
        }
      }, 1000) // Check every second

      return () => clearInterval(checkInterval)
    }
  }, [])

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshFromStorage,
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
