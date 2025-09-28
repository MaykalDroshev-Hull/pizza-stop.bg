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

  const getAddonPrice = (addon: ProductAddon, index: number, addonType: string) => {
    // First 3 addons of each type (sauce/vegetable) are free
    const typeAddons = selectedAddons.filter(a => a.AddonType === addonType)
    const typeIndex = typeAddons.indexOf(addon)
    const isFree = typeIndex < 3
    return isFree ? 0 : addon.Price
  }

  const totalAddonCost = selectedAddons
    .map((addon, index) => getAddonPrice(addon, index, addon.AddonType))
    .reduce((sum, price) => sum + price, 0)

  const renderAddonGroup = (addons: ProductAddon[], title: string) => {
    if (addons.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <div className="grid gap-3 grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
          {addons.map((addon) => {
            const isSelected = selectedAddonIds.includes(addon.AddonID)
            
            // HARDCODE: Always show "Безплатно" for now
            let displayText = 'Безплатно'
            let textColor = isSelected ? 'text-green-300' : 'text-green-400'
            
            return (
              <button
                key={addon.AddonID}
                onClick={() => handleAddonToggle(addon.AddonID)}
                className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                  isSelected
                    ? 'border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/25'
                    : 'border-white/12 text-muted hover:border-white/20 hover:bg-white/5'
                }`}
                style={{
                  minHeight: '48px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1.3',
                  hyphens: 'auto',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word'
                }}
              >
                <div className="font-medium" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textAlign: 'center',
                  fontSize: '14px'
                }}>{addon.Name}</div>
                <div className={`text-xs mt-1 ${textColor}`}>
                  {displayText}
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
          Първите 3 съса и първите 3 салата са безплатни. След избора на 3-ти със/салат ще се покажат цените за останалите.
        </p>
      </div>

      {renderAddonGroup(sauces, 'Сосове')}
      {renderAddonGroup(vegetables, 'Салати')}

      {selectedAddons.length > 0 && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Избрани добавки:</span>
            <span className="text-sm text-muted">
              {selectedAddons.filter(a => a.AddonType === 'sauce').length}/3 съса, {selectedAddons.filter(a => a.AddonType === 'vegetable').length}/3 салата
            </span>
          </div>
          
          <div className="space-y-2 mb-3">
            {selectedAddons.map((addon, index) => {
              const price = getAddonPrice(addon, index, addon.AddonType)
              return (
                <div key={addon.AddonID} className="flex justify-between items-center text-sm">
                  <span className="text-white">{addon.Name}</span>
                  <span className={price === 0 ? 'text-green-400' : 'text-red-400'}>
                    {price === 0 ? 'Безплатно' : `+${price.toFixed(2)} лв.`}
                  </span>
                </div>
              )
            })}
          </div>

          {totalAddonCost > 0 && (
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
