'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { useCart } from './CartContext'
import { isRestaurantOpen } from '../utils/openingHours'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: number
    name: string
    price?: number
    basePrice?: number
    image: string
    category: string
    sizes?: any[]
    addons?: any[]
  }
  selectedSize?: any
}



export default function CartModal({ isOpen, onClose, item, selectedSize }: CartModalProps) {
  const { addItem } = useCart()
  const [size, setSize] = useState(selectedSize?.name || '')
  const [selectedAddons, setSelectedAddons] = useState<any[]>([])
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Update size when selectedSize prop changes
  useEffect(() => {
    if (selectedSize?.name) {
      setSize(selectedSize.name)
    }
  }, [selectedSize])

  if (!isOpen) return null

  const isDrink = item.category === 'drinks'
  
  const getSizePrice = (selectedSize: string) => {
    if (isDrink) {
      return selectedSize === '1.5L' ? (item.price || item.basePrice || 0) * 2 : (item.price || item.basePrice || 0)
    } else {
      // If we have a selectedSize object with price, use that
      if (selectedSize && typeof selectedSize === 'object' && 'price' in selectedSize) {
        return (selectedSize as any).price
      }
      
      // Use dynamic sizes from database instead of hardcoded multipliers
      const sizeObj = item.sizes?.find((s: any) => s.name === selectedSize)
      if (sizeObj) {
        return sizeObj.price
      }
      
      // Fallback to base price if no size found
      return item.price || item.basePrice || 0
    }
  }

  const handleAddToCart = () => {
    // Use pre-selected size if available, otherwise use selected size
    const finalSize = selectedSize?.name || size
    if (!finalSize) return

    // Find the selected size object if it exists
    const selectedSizeObj = item.sizes?.find((s: any) => s.name === finalSize)
    
    const cartItem = {
      ...item,
      price: selectedSizeObj ? selectedSizeObj.price : getSizePrice(finalSize),
      size: finalSize,
      addons: selectedAddons,
      comment,
      quantity
    }

    addItem(cartItem)
    onClose()
    
    // Reset form
    setSize('')
    setSelectedAddons([])
    setComment('')
    setQuantity(1)
  }

  const toggleAddon = (addon: any) => {
    setSelectedAddons(prev => 
      prev.find(a => a.AddonID === addon.AddonID)
        ? prev.filter(a => a.AddonID !== addon.AddonID)
        : [...prev, addon]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-white/12 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/12">
          <h2 className="text-xl font-bold text-text">Персонализирай</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-muted hover:text-text transition-colors p-2 rounded-lg hover:bg-white/5"
              aria-label="Отказ"
            >
              Отказ
            </button>
            <button
              onClick={onClose}
              className="text-muted hover:text-text transition-colors p-2 rounded-lg hover:bg-white/5"
              aria-label="Затвори"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Item Info */}
          <div className="flex items-center space-x-4">
            <div className="text-4xl flex-shrink-0">{item.image}</div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-text truncate">{item.name}</h3>
              <p className="text-muted text-sm">{item.category}</p>
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h4 className="font-medium text-text mb-4">
              {selectedSize?.name ? `Избран размер: ${selectedSize.name}` : 'Избери размер:'}
            </h4>
            
            {selectedSize?.name ? (
              // Show selected size info
              <div className="p-4 bg-orange/10 border border-orange/20 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-orange">{selectedSize.name}</span>
                  <span className="text-orange font-bold text-lg">{selectedSize.price?.toFixed(2)} лв.</span>
                </div>
                <button
                  onClick={() => setSize('')}
                  className="text-sm text-orange/70 hover:text-orange mt-2 underline"
                >
                  Промени размер
                </button>
              </div>
            ) : (
              // Show size selection options
              <div className="grid grid-cols-3 gap-3">
                {isDrink ? (
                  <>
                    <button
                      onClick={() => setSize('0.5L')}
                      className="w-full p-4 rounded-xl border border-white/12 hover:border-orange/50 transition-all text-center text-muted hover:text-orange"
                    >
                      <div className="text-sm font-medium mb-1">0.5L</div>
                      <div className="text-xs opacity-75">{(item.price || item.basePrice || 0).toFixed(2)} лв.</div>
                    </button>
                    <button
                      onClick={() => setSize('1.5L')}
                      className="w-full p-4 rounded-xl border border-white/12 hover:border-orange/50 transition-all text-center text-muted hover:text-orange"
                    >
                      <div className="text-sm font-medium mb-1">1.5L</div>
                      <div className="text-xs opacity-75">{((item.price || item.basePrice || 0) * 2).toFixed(2)} лв.</div>
                    </button>
                  </>
                ) : item.sizes && Array.isArray(item.sizes) ? (
                  // New size structure with predefined sizes
                  item.sizes.map((sizeOption: any) => (
                    <button
                      key={sizeOption.name}
                      onClick={() => setSize(sizeOption.name)}
                      className="w-full p-4 rounded-xl border border-white/12 hover:border-orange/50 transition-all text-center text-muted hover:text-orange"
                    >
                      <div className="text-sm font-medium mb-1">{sizeOption.name}</div>
                      <div className="text-xs opacity-75">{sizeOption.price.toFixed(2)} лв.</div>
                    </button>
                  ))
                ) : (
                  // No sizes available - show message
                  <div className="col-span-3 text-center text-muted py-4">
                    Няма налични размери за този продукт
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Addons (only for food) */}
          {!isDrink && item.addons && item.addons.length > 0 && (
            <div>
              <h4 className="font-medium text-text mb-4">Добавки:</h4>
              <div className="space-y-4">
                {/* Sauces */}
                {item.addons.filter(addon => addon.AddonType === 'sauce').length > 0 && (
                  <div>
                    <h5 className="text-sm text-muted mb-2">Сосове:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {item.addons
                        .filter(addon => addon.AddonType === 'sauce')
                        .map(addon => (
                          <button
                            key={addon.AddonID}
                            onClick={() => toggleAddon(addon)}
                            className={`w-full p-3 rounded-lg border text-sm transition-all text-center ${
                              selectedAddons.find(a => a.AddonID === addon.AddonID)
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-white/12 text-muted hover:border-white/20'
                            }`}
                          >
                            <div className="font-medium">{addon.Name}</div>
                            <div className="text-xs mt-1 text-muted">
                              {addon.Price > 0 ? `${addon.Price.toFixed(2)} лв.` : 'Безплатно'}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Vegetables */}
                {item.addons.filter(addon => addon.AddonType === 'vegetable').length > 0 && (
                  <div>
                    <h5 className="text-sm text-muted mb-2">Салати:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {item.addons
                        .filter(addon => addon.AddonType === 'vegetable')
                        .map(addon => (
                          <button
                            key={addon.AddonID}
                            onClick={() => toggleAddon(addon)}
                            className={`w-full p-3 rounded-lg border text-sm transition-all text-center ${
                              selectedAddons.find(a => a.AddonID === addon.AddonID)
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-white/12 text-muted hover:border-white/20'
                            }`}
                          >
                            <div className="font-medium">{addon.Name}</div>
                            <div className="text-xs mt-1 text-muted">
                              {addon.Price > 0 ? `${addon.Price.toFixed(2)} лв.` : 'Безплатно'}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <h4 className="font-medium text-text mb-4">Коментар:</h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Специални изисквания..."
              className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted resize-none"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div>
            <h4 className="font-medium text-text mb-4">Количество:</h4>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg border border-white/12 text-muted hover:text-text transition-colors"
                aria-label="Намали количеството"
              >
                <Minus size={20} />
              </button>
              <span className="text-xl font-bold text-text min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 rounded-lg border border-white/12 text-muted hover:text-text transition-colors"
                aria-label="Увеличи количеството"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Total Price */}
          {(size || selectedSize?.name) && (
            <div className="text-center p-4 bg-white/6 rounded-xl border border-white/12">
              <div className="text-sm text-muted">Обща цена:</div>
              <div className="text-2xl font-bold text-orange">
                {(() => {
                  const finalSize = selectedSize?.name || size
                  const basePrice = getSizePrice(finalSize) * quantity
                  const addonCost = selectedAddons
                    .map((addon, index) => index < 3 ? 0 : addon.Price)
                    .reduce((sum, price) => sum + price, 0) * quantity
                  return (basePrice + addonCost).toFixed(2)
                })()} лв.
              </div>
              {selectedAddons.length > 0 && (
                <div className="text-xs text-muted mt-2">
                  Включва {selectedAddons.length} добавки
                  {selectedAddons.length > 3 && (
                    <span className="text-red-400 ml-1">
                      (+{(selectedAddons
                        .map((addon, index) => index < 3 ? 0 : addon.Price)
                        .reduce((sum, price) => sum + price, 0) * quantity).toFixed(2)} лв.)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/12">
          <button
            onClick={handleAddToCart}
            disabled={!size && !selectedSize?.name}
            className="w-full bg-gradient-to-r from-red to-orange text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRestaurantOpen() ? 'Добави в количката' : 'Добави за по-късно'}
          </button>
        </div>
      </div>
    </div>
  )
}
