'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { useCart } from './CartContext'
import { fetchMenuData } from '../lib/menuData'
import { MenuItem } from '../lib/menuData'
import { convertToBGN, formatBGNPrice } from '@/utils/currency'

interface DrinksSuggestionBoxProps {
  onClose: () => void
}

export default function DrinksSuggestionBox({ onClose }: DrinksSuggestionBoxProps) {
  const { addItem } = useCart()
  const [drinks, setDrinks] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    loadDrinks()
  }, [])

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
      
      // Show 6 drinks on PC, 4 on mobile
      const maxDrinks = window.innerWidth >= 768 ? 6 : 4
      
      // Randomize the drinks array before slicing
      const shuffledDrinks = [...validDrinks].sort(() => Math.random() - 0.5)
      setDrinks(shuffledDrinks.slice(0, maxDrinks))
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

  const hasSelectedItems = getTotalSelectedItems() > 0

  if (loading) {
    return (
      <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6">
        <div className="text-center py-4">
          <div className="text-muted">Зареждане на напитки...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text">Желаете ли напитки?</h3>
          <p className="text-sm text-muted">Завършете поръчката си с освежаващи напитки</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-text transition-colors text-sm"
        >
          Пропусни
        </button>
      </div>

      {/* Drinks Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg: grid grid-cols-1 gap-4 mb-4">
          {drinks.map((drink) => (
            <div key={drink.id} className="bg-white/6 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-text text-sm">{drink.name}</h4>
                  <p className="text-muted text-xs">
                    {drink.smallPrice?.toFixed(2)} €. <span className="text-muted">({formatBGNPrice(convertToBGN(drink.smallPrice || 0))})</span>
                  </p>
                </div>
                {drink.image && (
                  <img 
                    src={drink.image} 
                    alt={drink.name}
                    className="w-12 h-12 object-cover rounded-lg ml-3"
                  />
                )}
              </div>
              
              {/* Quantity Selector */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => handleQuantityChange(drink.id, -1)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  disabled={!quantities[drink.id]}
                >
                  <Minus size={16} className="text-text" />
                </button>
                <span className="text-text font-medium min-w-[2rem] text-center">
                  {quantities[drink.id] || 0}
                </span>
                <button
                  onClick={() => handleQuantityChange(drink.id, 1)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Plus size={16} className="text-text" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          {hasSelectedItems && (
            <span>
              Общо: {getTotalPrice().toFixed(2)} €. <span className="text-muted">({formatBGNPrice(convertToBGN(getTotalPrice()))})</span> ({getTotalSelectedItems()} напитки)
            </span>
          )}
        </div>
        
        <div className="flex space-x-3">
          {hasSelectedItems && (
            <button
              onClick={handleAddToCart}
              className="btn-gradient-orange px-8 py-3 text-white rounded-2xl text-sm font-semibold"
            >
              Добави в количката
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
