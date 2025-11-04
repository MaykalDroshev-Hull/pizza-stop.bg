'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart } from './CartContext'
import { fetchMenuData } from '../lib/menuData'
import { MenuItem } from '../lib/menuData'

interface DrinksSuggestionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DrinksSuggestionModal({ isOpen, onClose }: DrinksSuggestionModalProps) {
  const { addItem } = useCart()
  const [drinks, setDrinks] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    if (isOpen) {
      loadDrinks()
    }
  }, [isOpen])

  const loadDrinks = async () => {
    try {
      setLoading(true)
      const menuData = await fetchMenuData()
      // Filter out drinks that don't have valid price data
      const validDrinks = (menuData.drinks || []).filter((drink: MenuItem) => 
        drink && 
        drink.id && 
        drink.name && 
        typeof drink.smallPrice === 'number' && 
        drink.smallPrice > 0
      )
      setDrinks(validDrinks)
    } catch {
      setDrinks([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (drinkId: number, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [drinkId]: Math.max(0, (prev[drinkId] || 0) + change)
    }))
  }

  const handleAddToCart = () => {
    drinks.forEach(drink => {
      const quantity = quantities[drink.id] || 0
      if (quantity > 0) {
        // Add each drink with the selected quantity
        for (let i = 0; i < quantity; i++) {
          addItem({
            id: drink.id,
            name: drink.name,
            price: drink.smallPrice || 0,
            image: drink.image,
            category: 'drinks',
            size: 'Малка',
            addons: [],
            quantity: 1
          })
        }
      }
    })
    onClose()
  }

  const getTotalSelectedItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }

  const getTotalPrice = () => {
    return drinks.reduce((total, drink) => {
      const quantity = quantities[drink.id] || 0
      const price = drink.smallPrice || 0
      return total + (price * quantity)
    }, 0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Добавете напитки</h2>
            <p className="text-gray-400 mt-1">Завършете поръчката си с освежаващи напитки</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : drinks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Няма налични напитки в момента.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drinks.map((drink) => (
                <div key={drink.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <img
                      src={drink.image}
                      alt={drink.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="text-white font-semibold">{drink.name}</h3>
                      <p className="text-gray-400 text-sm">{(drink.smallPrice || 0).toFixed(2)} лв.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(drink.id, -1)}
                      className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-white font-semibold w-8 text-center">
                      {quantities[drink.id] || 0}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(drink.id, 1)}
                      className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white">
              <span className="text-gray-400">Общо:</span>
              <span className="ml-2 text-xl font-bold">{getTotalPrice().toFixed(2)} лв.</span>
            </div>
            <div className="text-gray-400">
              {getTotalSelectedItems()} напитки
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
            >
              Пропусни
            </button>
            <button
              onClick={handleAddToCart}
              disabled={getTotalSelectedItems() === 0}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCart size={20} />
              <span>Добави в количката</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
