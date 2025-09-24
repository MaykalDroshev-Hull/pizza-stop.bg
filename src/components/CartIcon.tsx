'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ShoppingCart, X, Trash2 } from 'lucide-react'
import { useCart } from './CartContext'
import { isRestaurantOpen } from '../utils/openingHours'

export default function CartIcon() {
  const { items, removeItem, totalItems, totalPrice, getItemTotalPrice } = useCart()
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
            className="absolute top-16 right-0 md:top-20 md:right-4 bg-card border border-white/12 rounded-2xl max-w-md w-full h-[calc(100vh-4rem)] max-md:h-[75vh] m-4 md:m-0 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/12 flex-shrink-0">
              <h2 className="text-xl font-bold text-text">Количка</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-text transition-colors p-2"
                aria-label="Затвори"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-muted mb-4" />
                  <p className="text-muted">Количката е празна</p>
                </div>
              ) : (
                <>
                  {items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-4 bg-white/6 rounded-xl border border-white/12">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNjY2NjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5GVPzwvdGV4dD4KPC9zdmc+';
                            }}
                          />
                        </div>
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
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-orange">{(getItemTotalPrice(item) / item.quantity).toFixed(2)} лв.</p>
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
                </>
              )}
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="p-6 border-t border-white/12 flex-shrink-0">
              {items.length > 0 ? (
                <>
                  {/* Total */}
                  <div className="text-center p-4 bg-white/6 rounded-xl border border-white/12 mb-4">
                    <div className="text-sm text-muted">Обща сума:</div>
                    <div className="text-2xl font-bold text-orange">
                      {totalPrice.toFixed(2)} лв.
                    </div>
                  </div>
                  
                  {/* Checkout Button */}
                  <a
                    href="/checkout"
                    className="w-full bg-gradient-to-r from-red to-orange text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 block text-center"
                  >
                    {isRestaurantOpen() ? 'Поръчай сега' : 'Поръчай за по-късно'}
                  </a>
                </>
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
