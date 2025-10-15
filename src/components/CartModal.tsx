'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Minus } from 'lucide-react'
import { useCart } from './CartContext'
import { isRestaurantOpen } from '../utils/openingHours'
import { fetchAddons } from '../lib/menuData'

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
  onSizeChange?: (itemId: number, size: any) => void
}



export default function CartModal({ isOpen, onClose, item, selectedSize, onSizeChange }: CartModalProps) {
  const { addItem } = useCart()
  const [size, setSize] = useState(selectedSize?.name || '')
  const [selectedAddons, setSelectedAddons] = useState<any[]>([])
  const [comment, setComment] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [currentAddons, setCurrentAddons] = useState<any[]>([])
  const [isLoadingAddons, setIsLoadingAddons] = useState(false)

  // Update size when selectedSize prop changes
  useEffect(() => {
    if (selectedSize?.name) {
      setSize(selectedSize.name)
    } else {
      setSize('')
    }
  }, [selectedSize])

  // Fetch addons dynamically when size changes (for pizzas) or when modal opens
  useEffect(() => {
    const fetchAddonsForCurrentState = async () => {
      if (!isOpen) return

      // For pizzas, fetch addons based on selected size
      if (item.category === 'pizza' && (size || selectedSize?.name)) {
        const currentSize = selectedSize?.name || size
        setIsLoadingAddons(true)
        try {
          console.log(`🍕 Fetching addons for pizza size: ${currentSize}`)
          const addons = await fetchAddons(1, currentSize) // ProductTypeID = 1 for pizza
          setCurrentAddons(addons)
          // Clear selected addons when size changes to avoid confusion
          setSelectedAddons([])
          console.log(`✅ Loaded ${addons.length} addons for ${currentSize} pizza`)
        } catch (error) {
          console.error('Error fetching pizza addons:', error)
          setCurrentAddons([])
        } finally {
          setIsLoadingAddons(false)
        }
      } else if (item.category === 'pizza' && !size && !selectedSize?.name) {
        // Pizza but no size selected yet - clear addons
        setCurrentAddons([])
      } else {
        // For non-pizza items, use the static addons from item
        setCurrentAddons(item.addons || [])
      }
    }

    fetchAddonsForCurrentState()
  }, [isOpen, item.category, size, selectedSize?.name, item.addons])

  if (!isOpen) return null

  // Ensure we're on the client side for portal
  if (typeof window === 'undefined') return null

  // Fallback for mobile if portal fails
  const isMobile = window.innerWidth <= 768

  // Debug: Log when modal opens
  console.log('CartModal opened, z-index should be 9999')
  console.log('Screen size:', window.innerWidth, 'x', window.innerHeight)
  console.log('Is mobile:', window.innerWidth <= 768)
  console.log('Modal classes:', `z-cart-modal ${isMobile ? 'mobile-modal' : ''}`)
  console.log('Mobile positioning:', isMobile ? 'pt-24 flex-col justify-start' : 'items-center justify-center')
  console.log('Mobile height calc:', isMobile ? 'calc(100vh-10rem)' : '95vh/90vh')

  const isDrink = item.category === 'drinks'

  // Use portal to render modal outside of normal DOM tree

  const getItemBasePrice = () => {
    // For items with sizes, use the selected size price
    if (size || selectedSize?.name) {
      const finalSize = selectedSize?.name || size
      
      // If we have a selectedSize object with price, use that
      if (selectedSize && typeof selectedSize === 'object' && 'price' in selectedSize) {
        return (selectedSize as any).price
      }
      
      // Use dynamic sizes from database
      const sizeObj = item.sizes?.find((s: any) => s.name === finalSize)
      if (sizeObj) {
        return sizeObj.price
      }
    }
    
    // For items without sizes (burgers, drinks), use base price
    // Priority: price -> basePrice -> fallback
    const basePrice = item.price || item.basePrice || 0
    
    // For drinks, use fallback if all prices are 0
    if (item.category === 'drinks' && basePrice === 0) {
      return 2.50
    }
    
    return basePrice
  }

  const handleAddToCart = () => {
    // For items that require size selection, check if size is selected
    const requiresSize = item.sizes && item.sizes.length > 0
    const hasSize = size || selectedSize?.name
    
    if (requiresSize && !hasSize) {
      console.log('❌ Size selection required for', item.name)
      return
    }
    
    // Use default size for items that don't require size selection
    let finalSize = selectedSize?.name || size
    if (!finalSize && !requiresSize) {
      finalSize = 'Стандартен размер'
    }
    
    // Create unique item to prevent quantity incrementing
    // Each "Add to Cart" click should add a separate item
    const cartItem = {
      ...item,
      id: `${item.id}_${Date.now()}`, // Make each item unique
      price: getItemBasePrice(),
      size: finalSize,
      addons: selectedAddons,
      comment,
      quantity
    }

    console.log('🛒 Adding to cart:', cartItem)
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

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div 
        className="bg-card border border-white/12 rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
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
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
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
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-text truncate">{item.name}</h3>
            </div>
          </div>

          {/* Size Selection - Only show if item has sizes */}
          {item.sizes && item.sizes.length > 0 && (
          <div>
            <h4 className="font-medium text-text mb-4">
              {(selectedSize?.name && size) ? `Избран размер: ${(() => {
                // Special case for Paninins (ProductID 900, 902, 903, 904)
                const isPanini = [900, 902, 903, 904].includes(item.id);
                if (isPanini && selectedSize.name === 'Малка') {
                  return 'Стандартен размер';
                }
                // Special case for standard size pizzas - show custom text
                const standardSizePizzas = [
                  'калцоне', 'calzone', 'мортадела бурата', 'прошутто фреш', 
                  'сладка пица', 'сладка праскова', 'смокини деликастес'
                ];
                const isStandardSizePizza = standardSizePizzas.some(pizza => 
                  item.name.toLowerCase().includes(pizza)
                );
                if (isStandardSizePizza && selectedSize.name === 'Малка') {
                  return 'Стандартен размер (30см | 450гр)';
                }
                // Special case for doners with only small size
                if (item.category === 'doners' && selectedSize.name === 'Малка') {
                  return 'Стандартен размер';
                }
                return selectedSize.name;
              })()}` : 'Избери размер:'}
            </h4>
            
            {(selectedSize?.name && size) ? (
              // Show selected size info
              <div className="p-4 bg-orange/10 border border-orange/20 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-orange">{(() => {
                    // Special case for Paninins (ProductID 900, 902, 903, 904)
                    const isPanini = [900, 902, 903, 904].includes(item.id);
                    if (isPanini && selectedSize.name === 'Малка') {
                      return 'Стандартен размер';
                    }
                    // Special case for standard size pizzas - show custom text
                    const standardSizePizzas = [
                      'калцоне', 'calzone', 'мортадела бурата', 'прошутто фреш', 
                      'сладка пица', 'сладка праскова', 'смокини деликастес'
                    ];
                    const isStandardSizePizza = standardSizePizzas.some(pizza => 
                      item.name.toLowerCase().includes(pizza)
                    );
                    if (isStandardSizePizza && selectedSize.name === 'Малка') {
                      return 'Стандартен размер (30см | 450гр)';
                    }
                    // Special case for doners with only small size
                    if (item.category === 'doners' && selectedSize.name === 'Малка') {
                      return 'Стандартен размер';
                    }
                    return selectedSize.name;
                  })()}</span>
                  <span className="text-orange font-bold text-lg">{selectedSize.price?.toFixed(2)} лв.</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('CartModal Промени размер clicked!', item.id)
                    setSize('')
                    if (onSizeChange) {
                      console.log('Calling onSizeChange with null')
                      onSizeChange(item.id, null)
                    } else {
                      console.log('onSizeChange is not defined')
                    }
                  }}
                  className="text-sm text-orange/70 hover:text-orange mt-2 underline cursor-pointer block w-full text-left"
                >
                  Промени размер
                </button>
              </div>
            ) : (
              // Show size selection options
              <div className="space-y-3 max-w-sm mx-auto">
                {isDrink ? (
                  // Use database sizes for drinks instead of hardcoded 0.5L/1.5L
                  item.sizes && Array.isArray(item.sizes) ? (
                    item.sizes.map((sizeOption: any) => (
                      <button
                        key={sizeOption.name}
                        onClick={() => {
                          console.log('Drink size selected in CartModal:', sizeOption.name, sizeOption)
                          setSize(sizeOption.name)
                          if (onSizeChange) {
                            onSizeChange(item.id, sizeOption)
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-white/12 hover:border-orange/50 transition-all text-muted hover:text-orange flex items-center justify-between"
                      >
                        <div className="text-left">
                          <div className="text-sm font-medium">
                            {sizeOption.name}
                          </div>
                          {sizeOption.weight && (
                            <div className="text-xs text-muted mt-1">
                              ({sizeOption.weight}г)
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-orange">
                          {(sizeOption.price || 0).toFixed(2)} лв.
                        </div>
                      </button>
                    ))
                  ) : (
                    // No sizes available - item doesn't need size selection
                    <div className="text-center text-muted text-sm py-4">
                      Този продукт не изисква избор на размер
                    </div>
                  )
                ) : item.sizes && Array.isArray(item.sizes) ? (
                  // New size structure with predefined sizes
                  item.sizes.map((sizeOption: any) => {
                    // Special case for Paninins (ProductID 900, 902, 903, 904)
                    const isPanini = [900, 902, 903, 904].includes(item.id);
                    
                    // Special case for standard size pizzas - show custom text
                    const standardSizePizzas = [
                      'калцоне', 'calzone', 'мортадела бурата', 'прошутто фреш', 
                      'сладка пица', 'сладка праскова', 'смокини деликастес'
                    ];
                    const isStandardSizePizza = standardSizePizzas.some(pizza => 
                      item.name.toLowerCase().includes(pizza)
                    );
                    let displayName = sizeOption.name;
                    if (isPanini && sizeOption.name === 'Малка') {
                      displayName = 'Стандартен размер';
                    } else if (isStandardSizePizza && sizeOption.name === 'Малка') {
                      displayName = 'Стандартен размер (30см | 450гр)';
                    } else if (item.category === 'doners' && sizeOption.name === 'Малка') {
                      displayName = 'Стандартен размер';
                    }
                    
                    return (
                      <button
                        key={sizeOption.name}
                        onClick={() => {
                          console.log('Size selected in CartModal:', sizeOption.name, sizeOption)
                          setSize(sizeOption.name)
                          if (onSizeChange) {
                            onSizeChange(item.id, sizeOption)
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-white/12 hover:border-orange/50 transition-all text-muted hover:text-orange flex items-center justify-between"
                      >
                        <div className="text-left">
                          <div className="text-sm font-medium">
                            {displayName}
                          </div>
                          {sizeOption.weight && (
                            <div className="text-xs text-muted mt-1">
                              ({sizeOption.weight}г)
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-orange">
                          {(sizeOption.price || 0).toFixed(2)} лв.
                        </div>
                      </button>
                    );
                  })
                ) : (
                  // No sizes available - show message
                  <div className="text-center text-muted py-4">
                    Няма налични размери за този продукт
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Addons (only for food) */}
          {!isDrink && currentAddons && currentAddons.length > 0 && (
            <div>
              <h4 className="font-medium text-text mb-4">Добавки:</h4>
              <p className="text-sm text-muted mb-4">
                {(item.category === 'pizza' || item.category === 'pizza-5050')
                  ? '💡 Добавките за пица са платени според цената в менюто.'
                  : '💡 Първите 3 добавки от всеки тип са безплатни. След избора на 3-та добавка от даден тип ще се покажат цените за останалите от същия тип.'
                }
              </p>
              {isLoadingAddons && (
                <div className="text-center text-sm text-muted py-2">
                  Зареждане на добавки...
                </div>
              )}
              <div className="space-y-4">
                {/* Sauces */}
                {currentAddons.filter(addon => addon.AddonType === 'sauce').length > 0 && (
                  <div>
                    <h5 className="text-sm text-muted mb-2">Сосове:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currentAddons
                        .filter(addon => addon.AddonType === 'sauce')
                        .map(addon => (
                          <button
                            key={addon.AddonID}
                            onClick={() => toggleAddon(addon)}
                            className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                              selectedAddons.find(a => a.AddonID === addon.AddonID)
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-white/12 text-muted hover:border-white/20'
                            }`}
                            style={{
                              height: '60px',
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1.2'
                            }}
                            title={addon.Name}
                          >
                            <div className="font-medium truncate w-full text-center text-sm" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{addon.Name}</div>
                            <div className={`text-xs mt-1 ${
                              (() => {
                                // Per-type logic: 3 free sauces, 3 free salads
                                const typeSelected = selectedAddons.filter(a => a.AddonType === addon.AddonType)
                                const isSelected = selectedAddons.find(a => a.AddonID === addon.AddonID)
                                
                                if (typeSelected.length < 3) {
                                  // Before 3 of this type are selected - all green
                                  return isSelected ? 'text-green-300' : 'text-green-400'
                                } else {
                                  // After 3 of this type are selected
                                  if (isSelected) {
                                    const positionInType = typeSelected.findIndex(a => a.AddonID === addon.AddonID)
                                    return positionInType >= 3 ? 'text-red-400' : 'text-green-300'
                                  } else {
                                    return 'text-red-400'
                                  }
                                }
                              })()
                            }`}>
                              {(() => {
                                // Per-type logic: 3 free sauces, 3 free salads
                                const typeSelected = selectedAddons.filter(a => a.AddonType === addon.AddonType)
                                const isSelected = selectedAddons.find(a => a.AddonID === addon.AddonID)
                                
                                if (typeSelected.length < 3) {
                                  // Before 3 of this type are selected - all show as free
                                  return 'Безплатно'
                                } else {
                                  // After 3 of this type are selected
                                  if (isSelected) {
                                    // Check position among selected addons of this type
                                    const positionInType = typeSelected.findIndex(a => a.AddonID === addon.AddonID)
                                    if (positionInType >= 3) {
                                      // 4th and beyond of this type are paid
                                      return `${addon.Price.toFixed(2)} лв.`
                                    } else {
                                      // First 3 of this type remain free
                                      return 'Безплатно'
                                    }
                                  } else {
                                    // Unselected ones show price after 3 of this type are selected
                                    return `${addon.Price.toFixed(2)} лв.`
                                  }
                                }
                              })()}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Vegetables */}
                {currentAddons.filter(addon => addon.AddonType === 'vegetable').length > 0 && (
                  <div>
                    <h5 className="text-sm text-muted mb-2">Салати:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currentAddons
                        .filter(addon => addon.AddonType === 'vegetable')
                        .map(addon => (
                          <button
                            key={addon.AddonID}
                            onClick={() => toggleAddon(addon)}
                            className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                              selectedAddons.find(a => a.AddonID === addon.AddonID)
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-white/12 text-muted hover:border-white/20'
                            }`}
                            style={{
                              height: '60px',
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1.2'
                            }}
                            title={addon.Name}
                          >
                            <div className="font-medium truncate w-full text-center text-sm" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{addon.Name}</div>
                            <div className={`text-xs mt-1 ${
                              (() => {
                                // Per-type logic: 3 free sauces, 3 free salads
                                const typeSelected = selectedAddons.filter(a => a.AddonType === addon.AddonType)
                                const isSelected = selectedAddons.find(a => a.AddonID === addon.AddonID)
                                
                                if (typeSelected.length < 3) {
                                  // Before 3 of this type are selected - all green
                                  return isSelected ? 'text-green-300' : 'text-green-400'
                                } else {
                                  // After 3 of this type are selected
                                  if (isSelected) {
                                    const positionInType = typeSelected.findIndex(a => a.AddonID === addon.AddonID)
                                    return positionInType >= 3 ? 'text-red-400' : 'text-green-300'
                                  } else {
                                    return 'text-red-400'
                                  }
                                }
                              })()
                            }`}>
                              {(() => {
                                // Per-type logic: 3 free sauces, 3 free salads
                                const typeSelected = selectedAddons.filter(a => a.AddonType === addon.AddonType)
                                const isSelected = selectedAddons.find(a => a.AddonID === addon.AddonID)
                                
                                if (typeSelected.length < 3) {
                                  // Before 3 of this type are selected - all show as free
                                  return 'Безплатно'
                                } else {
                                  // After 3 of this type are selected
                                  if (isSelected) {
                                    // Check position among selected addons of this type
                                    const positionInType = typeSelected.findIndex(a => a.AddonID === addon.AddonID)
                                    if (positionInType >= 3) {
                                      // 4th and beyond of this type are paid
                                      return `${addon.Price.toFixed(2)} лв.`
                                    } else {
                                      // First 3 of this type remain free
                                      return 'Безплатно'
                                    }
                                  } else {
                                    // Unselected ones show price after 3 of this type are selected
                                    return `${addon.Price.toFixed(2)} лв.`
                                  }
                                }
                              })()}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Meats (for pizzas) */}
                {currentAddons.filter(addon => addon.AddonType === 'meat').length > 0 && (
                  <div>
                    <h5 className="text-sm text-muted mb-2">Колбаси:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentAddons
                        .filter(addon => addon.AddonType === 'meat')
                        .map(addon => (
                          <button
                            key={addon.AddonID}
                            onClick={() => toggleAddon(addon)}
                            className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                              selectedAddons.find(a => a.AddonID === addon.AddonID)
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-white/12 text-muted hover:border-white/20'
                            }`}
                            style={{
                              height: '60px',
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1.2'
                            }}
                            title={addon.Name}
                          >
                            <div className="font-medium truncate w-full text-center text-sm" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{addon.Name}</div>
                            <div className="text-xs mt-1 text-red-400">
                              {addon.Price.toFixed(2)} лв.
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Cheese (for pizzas) */}
                {currentAddons.filter(addon => addon.AddonType === 'cheese').length > 0 && (
                  <div>
                    <h5 className="text-sm text-muted mb-2">Сирена:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentAddons
                        .filter(addon => addon.AddonType === 'cheese')
                        .map(addon => (
                          <button
                            key={addon.AddonID}
                            onClick={() => toggleAddon(addon)}
                            className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                              selectedAddons.find(a => a.AddonID === addon.AddonID)
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-white/12 text-muted hover:border-white/20'
                            }`}
                            style={{
                              height: '60px',
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1.2'
                            }}
                            title={addon.Name}
                          >
                            <div className="font-medium truncate w-full text-center text-sm" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{addon.Name}</div>
                            <div className="text-xs mt-1 text-red-400">
                              {addon.Price.toFixed(2)} лв.
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Pizza Addons (for pizzas) */}
                {currentAddons.filter(addon => addon.AddonType === 'pizza-addon').length > 0 && (
                  <div>
                    <h5 className="text-sm text-muted mb-2">Добавки:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentAddons
                        .filter(addon => addon.AddonType === 'pizza-addon')
                        .map(addon => (
                          <button
                            key={addon.AddonID}
                            onClick={() => toggleAddon(addon)}
                            className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                              selectedAddons.find(a => a.AddonID === addon.AddonID)
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-white/12 text-muted hover:border-white/20'
                            }`}
                            style={{
                              height: '60px',
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1.2'
                            }}
                            title={addon.Name}
                          >
                            <div className="font-medium truncate w-full text-center text-sm" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{addon.Name}</div>
                            <div className="text-xs mt-1 text-red-400">
                              {addon.Price.toFixed(2)} лв.
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

          {/* Price Breakdown */}
          <div className="p-4 bg-white/6 rounded-xl border border-white/12">
            <div className="text-sm text-muted mb-3">Ценова разбивка:</div>
            
            {(() => {
              const basePricePerItem = getItemBasePrice()
              const basePrice = basePricePerItem * quantity
              
              const addonCost = selectedAddons
                .map((addon) => {
                  // For pizzas (including 50/50 pizzas), all addons are paid
                  if (item.category === 'pizza' || item.category === 'pizza-5050') {
                    return addon.Price
                  }
                  
                  // For other products, first 3 of each type are free
                  const typeSelected = selectedAddons.filter(a => a.AddonType === addon.AddonType)
                  const positionInType = typeSelected.findIndex(a => a.AddonID === addon.AddonID)
                  return positionInType < 3 ? 0 : addon.Price
                })
                .reduce((sum, price) => sum + price, 0) * quantity
              
              const totalPrice = basePrice + addonCost
              
              return (
                <div className="space-y-2">
                  {/* Base Item Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">
                      {item.name} {quantity > 1 && `× ${quantity}`}
                    </span>
                    <span className="text-sm font-medium text-text">
                      {basePrice.toFixed(2)} лв.
                    </span>
                  </div>
                  
                  {/* Addon Costs */}
                  {selectedAddons.length > 0 && (
                    <div className="space-y-1">
                      {selectedAddons.map((addon, index) => {
                        // For pizzas, all addons are paid
                        let addonPrice = addon.Price
                        let isFree = false
                        
                        if (item.category !== 'pizza') {
                          // For non-pizza items, use the free tier logic
                          const typeSelected = selectedAddons.filter(a => a.AddonType === addon.AddonType)
                          const positionInType = typeSelected.findIndex(a => a.AddonID === addon.AddonID)
                          addonPrice = positionInType < 3 ? 0 : addon.Price
                          isFree = positionInType < 3
                        }
                        
                        const addonTotal = addonPrice * quantity
                        
                        return (
                          <div key={index} className="flex justify-between items-center ml-4">
                            <span className="text-xs text-muted">
                              {addon.Name} {quantity > 1 && `× ${quantity}`}
                              {isFree && <span className="text-green-400 ml-1">(безплатно)</span>}
                            </span>
                            <span className="text-xs font-medium text-text">
                              {addonTotal.toFixed(2)} лв.
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="border-t border-white/12 pt-2 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-text">Общо:</span>
                      <span className="text-xl font-bold text-orange">
                        {totalPrice.toFixed(2)} лв.
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/12 space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={item.sizes && item.sizes.length > 0 && !size && !selectedSize?.name}
            className="w-full bg-gradient-to-r from-red to-orange text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRestaurantOpen() ? 'Добави в количката' : 'Добави за по-късно'}
          </button>
          
          {/* Proceed to Checkout Button - Only show if there are items in cart */}
          <button
            onClick={() => {
              onClose()
              // Navigate to checkout
              window.location.href = '/checkout'
            }}
            className="w-full bg-white/10 border border-white/20 text-text py-3 px-6 rounded-xl font-medium transition-all hover:bg-white/20 hover:border-white/30"
          >
            🛒 Отиди към количката
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
