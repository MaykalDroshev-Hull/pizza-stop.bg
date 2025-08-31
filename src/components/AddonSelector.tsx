'use client'

import { useState } from 'react'
import { ProductAddon } from '../lib/menuData'

interface AddonSelectorProps {
  addons: ProductAddon[]
  onAddonChange: (selectedAddons: ProductAddon[]) => void
  selectedAddons: ProductAddon[]
}

export function AddonSelector({ addons, onAddonChange, selectedAddons }: AddonSelectorProps) {
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>(
    selectedAddons.map(addon => addon.AddonID)
  )

  // Group addons by type
  const sauces = addons.filter(addon => addon.AddonType === 'sauce')
  const vegetables = addons.filter(addon => addon.AddonType === 'vegetable')

  const handleAddonToggle = (addonId: number) => {
    const newSelectedIds = selectedAddonIds.includes(addonId)
      ? selectedAddonIds.filter(id => id !== addonId)
      : [...selectedAddonIds, addonId]
    
    setSelectedAddonIds(newSelectedIds)
    
    // Get the full addon objects for the selected IDs
    const newSelectedAddons = addons.filter(addon => newSelectedIds.includes(addon.AddonID))
    onAddonChange(newSelectedAddons)
  }

  const getAddonPrice = (addon: ProductAddon, index: number) => {
    // First 3 addons are free, others cost money
    const isFree = index < 3
    return isFree ? 0 : addon.Price
  }

  const totalAddonCost = selectedAddons
    .map((addon, index) => getAddonPrice(addon, index))
    .reduce((sum, price) => sum + price, 0)

  const renderAddonGroup = (addons: ProductAddon[], title: string) => {
    if (addons.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <div className="grid grid-cols-2 gap-3">
          {addons.map((addon) => {
            const isSelected = selectedAddonIds.includes(addon.AddonID)
            const addonIndex = selectedAddonIds.indexOf(addon.AddonID)
            const price = getAddonPrice(addon, addonIndex)
            
            return (
              <button
                key={addon.AddonID}
                onClick={() => handleAddonToggle(addon.AddonID)}
                className={`w-full p-3 rounded-lg border text-sm transition-all text-center ${
                  isSelected
                    ? 'border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/25'
                    : 'border-white/12 text-muted hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="font-medium">{addon.Name}</div>
                <div className={`text-xs mt-1 ${
                  isSelected ? 'text-green-300' : 'text-muted'
                }`}>
                  {selectedAddonIds.length >= 3 ? (price === 0 ? 'Безплатно' : `${price.toFixed(2)} лв.`) : ''}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">Добавки</h2>
        <p className="text-sm text-muted">
          Първите 3 добавки са безплатни, останалите се заплащат отделно
        </p>
      </div>

      {renderAddonGroup(sauces, 'Сосове')}
      {renderAddonGroup(vegetables, 'Салати')}

      {selectedAddons.length > 0 && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Избрани добавки:</span>
            <span className="text-sm text-muted">
              {selectedAddons.length}/3 безплатни
            </span>
          </div>
          
          <div className="space-y-2 mb-3">
            {selectedAddons.map((addon, index) => {
              const price = getAddonPrice(addon, index)
              return (
                <div key={addon.AddonID} className="flex justify-between items-center text-sm">
                  <span className="text-white">{addon.Name}</span>
                  <span className={price === 0 ? 'text-green-400' : 'text-red-400'}>
                    {selectedAddons.length >= 3 ? (price === 0 ? 'Безплатно' : `+${price.toFixed(2)} лв.`) : ''}
                  </span>
                </div>
              )
            })}
          </div>

          {selectedAddons.length >= 3 && (
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Допълнителна цена:</span>
                <span className="text-lg font-bold text-red-400">
                  +{totalAddonCost.toFixed(2)} лв.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
