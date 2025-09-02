'use client'

import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { useCart } from './CartContext'
import { isRestaurantOpen } from '../utils/openingHours'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: number
    name: string
    price: number
    image: string
    category: string
  }
}

const sauces = [
  'Кетчуп', 'Майонеза', 'Чеснов сос', 'Тартар', 'Барбекю', 'Хот сос'
]

const salads = [
  'Зелена салата', 'Домати', 'Краставици', 'Лук', 'Маслини', 'Пресни зеленчуци'
]

export default function CartModal({ isOpen, onClose, item }: CartModalProps) {
  const { addItem } = useCart()
  const [size, setSize] = useState('')
  const [selectedSauces, setSelectedSauces] = useState<string[]>([])
  const [selectedSalads, setSelectedSalads] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState(1)

  if (!isOpen) return null

  const isDrink = item.category === 'drinks'
  
  const getSizePrice = (selectedSize: string) => {
    if (isDrink) {
      return selectedSize === '1.5L' ? item.price * 2 : item.price
    } else {
      switch (selectedSize) {
        case 'Малка': return item.price
        case 'Средна': return item.price * 1.5
        case 'Голяма': return item.price * 2
        default: return item.price
      }
    }
  }

  const handleAddToCart = () => {
    if (!size) return

    const cartItem = {
      ...item,
      price: getSizePrice(size),
      size,
      sauces: selectedSauces,
      salads: selectedSalads,
      comment,
      quantity
    }

    addItem(cartItem)
    onClose()
    
    // Reset form
    setSize('')
    setSelectedSauces([])
    setSelectedSalads([])
    setComment('')
    setQuantity(1)
  }

  const toggleSauce = (sauce: string) => {
    setSelectedSauces(prev => 
      prev.includes(sauce) 
        ? prev.filter(s => s !== sauce)
        : [...prev, sauce]
    )
  }

  const toggleSalad = (salad: string) => {
    setSelectedSalads(prev => 
      prev.includes(salad) 
        ? prev.filter(s => s !== salad)
        : [...prev, salad]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-white/12 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/12">
          <h2 className="text-xl font-bold text-text">Персонализирай</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-2"
            aria-label="Затвори"
          >
            <X size={20} />
          </button>
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
            <h4 className="font-medium text-text mb-4">Избери размер:</h4>
            <div className="grid grid-cols-3 gap-3">
              {isDrink ? (
                <>
                  <button
                    onClick={() => setSize('0.5L')}
                    className={`w-full p-4 rounded-xl border transition-all text-center ${
                      size === '0.5L'
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/12 text-muted hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">0.5L</div>
                    <div className="text-xs opacity-75">{item.price.toFixed(2)} лв.</div>
                  </button>
                  <button
                    onClick={() => setSize('1.5L')}
                    className={`w-full p-4 rounded-xl border transition-all text-center ${
                      size === '1.5L'
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/12 text-muted hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">1.5L</div>
                    <div className="text-xs opacity-75">{(item.price * 2).toFixed(2)} лв.</div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSize('Малка')}
                    className={`w-full p-4 rounded-xl border transition-all text-center ${
                      size === 'Малка'
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/12 text-muted hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">Малка</div>
                    <div className="text-xs opacity-75">{item.price.toFixed(2)} лв.</div>
                  </button>
                  <button
                    onClick={() => setSize('Средна')}
                    className={`w-full p-4 rounded-xl border transition-all text-center ${
                      size === 'Средна'
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/12 text-muted hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">Средна</div>
                    <div className="text-xs opacity-75">{(item.price * 1.5).toFixed(2)} лв.</div>
                  </button>
                  <button
                    onClick={() => setSize('Голяма')}
                    className={`w-full p-4 rounded-xl border transition-all text-center ${
                      size === 'Голяма'
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/12 text-muted hover:border-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">Голяма</div>
                    <div className="text-xs opacity-75">{(item.price * 2).toFixed(2)} лв.</div>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sauces (only for food) */}
          {!isDrink && (
            <div>
              <h4 className="font-medium text-text mb-4">Сосове:</h4>
              <div className="grid grid-cols-2 gap-3">
                {sauces.map(sauce => (
                  <button
                    key={sauce}
                    onClick={() => toggleSauce(sauce)}
                    className={`w-full p-3 rounded-lg border text-sm transition-all text-center ${
                      selectedSauces.includes(sauce)
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/12 text-muted hover:border-white/20'
                    }`}
                  >
                    {sauce}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Salads (only for food) */}
          {!isDrink && (
            <div>
              <h4 className="font-medium text-text mb-4">Салати:</h4>
              <div className="grid grid-cols-2 gap-3">
                {salads.map(salad => (
                  <button
                    key={salad}
                    onClick={() => toggleSalad(salad)}
                    className={`w-full p-3 rounded-lg border text-sm transition-all text-center ${
                      selectedSalads.includes(salad)
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/12 text-muted hover:border-white/20'
                    }`}
                  >
                    {salad}
                  </button>
                ))}
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
          {size && (
            <div className="text-center p-4 bg-white/6 rounded-xl border border-white/12">
              <div className="text-sm text-muted">Обща цена:</div>
              <div className="text-2xl font-bold text-orange">
                {(getSizePrice(size) * quantity).toFixed(2)} лв.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/12">
          <button
            onClick={handleAddToCart}
            disabled={!size}
            className="w-full bg-gradient-to-r from-red to-orange text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRestaurantOpen() ? 'Добави в количката' : 'Добави за по-късно'}
          </button>
        </div>
      </div>
    </div>
  )
}
