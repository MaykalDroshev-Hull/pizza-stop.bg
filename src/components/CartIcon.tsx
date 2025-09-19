'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ShoppingCart, X, Trash2 } from 'lucide-react'
import { useCart } from './CartContext'
import { isRestaurantOpen } from '../utils/openingHours'

export default function CartIcon() {
  const { items, removeItem, totalItems, totalPrice } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Prevent hydration mismatch by only showing cart badge after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cart-icon-button"
        aria-label="Количка"
      >
        <ShoppingCart size={24} />
        {isHydrated && totalItems > 0 && (
          <span className="cart-badge">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      {/* Cart Preview Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0" style={{ zIndex: 9999 }}>
          {/* Backdrop - covers entire screen with blur */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Cart Modal - positioned below navbar on mobile, under cart icon on PC */}
          <div 
            className="absolute top-16 right-0 md:top-20 md:right-4 bg-card border border-white/12 rounded-2xl max-w-md w-full max-h-[calc(100vh-4rem)] max-md:max-h-[75vh] overflow-y-auto m-4 md:m-0 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/12">
              <h2 className="text-xl font-bold text-text">Количка</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-text transition-colors p-2"
                aria-label="Затвори"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-6 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-muted mb-4" />
                  <p className="text-muted">Количката е празна</p>
                </div>
              ) : (
                <>
                  {items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-4 bg-white/6 rounded-xl border border-white/12">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text truncate">{item.name}</h4>
                        <p className="text-sm text-muted">
                          {item.size} • {item.quantity}x
                        </p>
                        {item.addons && item.addons.length > 0 && (
                          <p className="text-xs text-muted">
                            Добавки: {item.addons.map(addon => addon.Name).join(', ')}
                          </p>
                        )}
                        {item.comment && (
                          <p className="text-xs text-muted">
                            Коментар: {item.comment}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-orange">{item.price.toFixed(2)} лв.</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted hover:text-red transition-colors p-1 mt-1"
                          aria-label="Премахни от количката"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="text-center p-4 bg-white/6 rounded-xl border border-white/12">
                    <div className="text-sm text-muted">Обща сума:</div>
                    <div className="text-2xl font-bold text-orange">
                      {totalPrice.toFixed(2)} лв.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/12">
              {items.length > 0 ? (
                <a
                  href="/checkout"
                  className="w-full bg-gradient-to-r from-red to-orange text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 block text-center"
                >
                  {isRestaurantOpen() ? 'Поръчай сега' : 'Поръчай за по-късно'}
                </a>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-white/8 text-text py-4 px-6 rounded-xl font-medium transition-all hover:bg-white/12"
                >
                  Затвори
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
