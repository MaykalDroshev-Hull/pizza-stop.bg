'use client'

import { useState } from 'react'
import { ShoppingCart, X, Trash2 } from 'lucide-react'
import { useCart } from './CartContext'
import { isRestaurantOpen } from '../utils/openingHours'

export default function CartIcon() {
  const { items, removeItem, totalItems, totalPrice } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cart-icon-button"
        aria-label="Количка"
      >
        <ShoppingCart size={24} />
        {totalItems > 0 && (
          <span className="cart-badge">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      {/* Cart Preview Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop - only covers content below navbar */}
          <div className="absolute top-16 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm"></div>
          
          {/* Cart Modal - positioned below navbar */}
          <div className="absolute top-16 right-0 bg-card border border-white/12 rounded-2xl max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto m-4 shadow-2xl">
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
                    <div key={index} className="flex items-start space-x-4 p-4 bg-white/6 rounded-xl border border-white/12">
                      <div className="text-2xl flex-shrink-0">{item.image}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text truncate">{item.name}</h4>
                        <p className="text-sm text-muted">
                          {item.size} • {item.quantity}x
                        </p>
                        {item.sauces && item.sauces.length > 0 && (
                          <p className="text-xs text-muted">
                            Сосове: {item.sauces.join(', ')}
                          </p>
                        )}
                        {item.salads && item.salads.length > 0 && (
                          <p className="text-xs text-muted">
                            Салати: {item.salads.join(', ')}
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
        </div>
      )}
    </>
  )
}
