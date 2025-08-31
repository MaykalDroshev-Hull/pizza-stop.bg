'use client'

import { useState, useEffect } from 'react'
import { Search, Star, Clock, Plus } from 'lucide-react'
import CartModal from '../../components/CartModal'
import { fetchMenuData, MenuItem } from '../../lib/menuData'
import { useLoading } from '../../components/LoadingContext'

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('pizza')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState<any>(null)
  const [selectedSizes, setSelectedSizes] = useState<{ [key: number]: any }>({})

  const [menuData, setMenuData] = useState<{ [key: string]: MenuItem[] }>({})
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const { startLoading, stopLoading } = useLoading()

  // Fetch menu data from Supabase
  useEffect(() => {
    let isMounted = true // Track if component is still mounted
    
    async function loadMenuData() {
      try {
        console.log('🔄 Order page: Starting to load menu data...')
        console.log('🚀 Order page: About to call startLoading()')
        startLoading() // Show spinning logo
        console.log('✅ Order page: startLoading() called successfully')
        
        const data = await fetchMenuData()
        
        // Only proceed if component is still mounted
        if (!isMounted) {
          console.log('🚫 Order page: Component unmounted, stopping early')
          return
        }
        
        console.log('📦 Order page: Received menu data:', data)
        console.log('🍕 Pizza count:', data.pizza?.length || 0)
        console.log('🍔 Burgers count:', data.burgers?.length || 0)
        console.log('🥙 Doners count:', data.doners?.length || 0)
        console.log('🥤 Drinks count:', data.drinks?.length || 0)
        
        setMenuData(data)
        setIsDataLoaded(true)
        console.log('✅ Order page: Data loaded, about to call stopLoading()')
        
      } catch (error) {
        console.error('❌ Order page: Failed to load menu data:', error)
        console.log('❌ Order page: Error occurred, about to call stopLoading()')
      } finally {
        // Only stop loading if component is still mounted
        if (isMounted) {
          console.log('🏁 Order page: Finally block - calling stopLoading()')
          stopLoading() // Hide spinning logo
          console.log('✅ Order page: stopLoading() called successfully')
        } else {
          console.log('🚫 Order page: Component unmounted, not calling stopLoading()')
        }
      }
    }

    loadMenuData()
    
    // Cleanup function to prevent multiple runs
    return () => {
      console.log('🧹 Order page: useEffect cleanup - setting isMounted to false')
      isMounted = false
    }
  }, []) // Remove startLoading and stopLoading from dependencies

  const categories = [
    { key: 'pizza', label: '🍕 Пици', count: menuData.pizza?.length || 0 },
    { key: 'doners', label: '🥙 Дюнери', count: menuData.doners?.length || 0 },
    { key: 'burgers', label: '🍔 Бургери', count: menuData.burgers?.length || 0 },
    { key: 'drinks', label: '🥤 Напитки', count: menuData.drinks?.length || 0 }
  ]

  const filteredItems = menuData[activeCategory]?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleAddToCart = (item: any) => {
    // For items with size options, ensure a size is selected
    if (item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0 && item.category !== 'drinks') {
      if (!selectedSizes[item.id]) {
        // Auto-select first size if none selected
        const firstSize = typeof item.sizes[0] === 'string' 
          ? { name: item.sizes[0], price: item.basePrice }
          : item.sizes[0]
        setSelectedSizes(prev => ({
          ...prev,
          [item.id]: firstSize
        }))
      }
      setSelectedItem(item)
      setSelectedSize(selectedSizes[item.id]) // Set the selected size for the modal
      setIsModalOpen(true)
    } else {
      // For drinks or items without size options, go directly to cart
      setSelectedItem(item)
      setIsModalOpen(true)
    }
  }

  // Size selection is now handled inline in the product cards

  // Show empty state while loading, but don't show local loading screen
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen">
        {/* Empty page structure while loading */}
        <header className="bg-card border-b border-white/8 sticky top-0 z-40 h-20">
          <div className="container py-4 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 h-full">
              <h1 className="text-3xl font-bold text-text">Поръчай сега!</h1>
              <div className="w-20 h-20"></div>
              <div className="w-64 h-12"></div>
            </div>
          </div>
        </header>
        <div className="container py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍕</div>
            <p className="text-muted text-xl">Зареждане...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-white/8 sticky top-0 z-40 h-20">
        <div className="container py-4 h-full">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 h-full">
            <h1 className="text-3xl font-bold text-text">Поръчай сега!</h1>
            
            {/* Logo Container */}
            <div className="flex items-center justify-center overflow-hidden">
              <img 
                src="https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU2Mzk1NzY5LCJleHAiOjI3MDI0NzU3Njl9.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg"
                alt="PIZZA STOP Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
            
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Търсене в менюто..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-card border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent w-64 text-text placeholder-muted"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Category tabs */}
      <div className="bg-card border-b border-white/8 sticky top-20 z-30">
        <div className="container py-4">
          <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`px-7 py-4 rounded-xl whitespace-nowrap transition-all transform hover:scale-105 ${
                  activeCategory === category.key
                    ? 'bg-gradient-to-r from-red to-orange text-white shadow-lg'
                    : 'text-muted hover:text-orange hover:bg-white/6'
                }`}
              >
                <span className="font-medium">{category.label}</span>
                <span className="ml-2 text-sm opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-muted text-xl mb-4">Няма намерени резултати</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveCategory('pizza'); }}
              className="bg-gradient-to-r from-red to-orange text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
            >
              Изчисти филтрите
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="card group hover:shadow-xl transition-all transform hover:-translate-y-2 overflow-hidden">
                <div className="text-6xl text-center py-8 bg-gradient-to-br from-red/10 to-orange/10 group-hover:scale-110 transition-transform duration-300">
                  {item.image}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-text">{item.name}</h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-orange font-bold text-2xl">{item.basePrice?.toFixed(2)} лв.</span>
                    <div className="flex items-center text-sm text-muted">
                      <Star className="w-4 h-4 text-yellow fill-current mr-1" />
                      {item.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted mb-4">
                    <Clock className="w-4 h-4 mr-1" />
                    {item.time}
                  </div>

                  {item.sizes && item.sizes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted mb-2">Избери размер:</p>
                      <div className={`${
                        // Special case: Any product with 3 sizes gets vertical layout (like doners)
                        item.sizes.length === 3
                          ? 'flex flex-col gap-2' // Vertical stack: Small (top) → Medium (middle) → Large (bottom)
                          : // All other cases use horizontal grid
                          `grid gap-2 ${
                            item.sizes.length === 1 ? 'grid-cols-1' :
                            item.sizes.length === 2 ? 'grid-cols-2' :
                            'grid-cols-3'
                          }`
                      }`}>
                        {Array.isArray(item.sizes) && item.sizes.map((size, index) => {
                          const sizeName = typeof size === 'string' ? size : size.name
                          const sizePrice = typeof size === 'string' ? item.basePrice : size.price
                          const isSelected = selectedSizes[item.id] && selectedSizes[item.id].name === sizeName
                          
                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedSizes(prev => ({
                                ...prev,
                                [item.id]: typeof size === 'string' ? { name: size, price: sizePrice } : size
                              }))}
                              className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                                isSelected
                                  ? 'bg-orange/20 border-orange text-orange shadow-lg shadow-orange/25'
                                  : 'bg-white/8 border-white/12 text-text hover:border-orange/50 hover:bg-orange/10'
                              }`}
                            >
                              <div className="font-medium">{sizeName}</div>
                              <div className="text-xs opacity-75">{sizePrice?.toFixed(2)} лв.</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      if (item.sizes && item.sizes.length > 0 && !selectedSizes[item.id]) {
                        // Auto-select first size if none selected
                        const firstSize = typeof item.sizes[0] === 'string' 
                          ? { name: item.sizes[0], price: item.basePrice }
                          : item.sizes[0]
                        setSelectedSizes(prev => ({
                          ...prev,
                          [item.id]: firstSize
                        }))
                      }
                      handleAddToCart(item)
                    }}
                    disabled={item.sizes && item.sizes.length > 0 && !selectedSizes[item.id]}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center justify-center space-x-2 ${
                      item.sizes && item.sizes.length > 0 && !selectedSizes[item.id]
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red to-orange text-white hover:shadow-lg'
                    }`}
                  >
                    <Plus size={20} />
                    <span>
                      {item.sizes && item.sizes.length > 0 && !selectedSizes[item.id] 
                        ? 'Избери размер първо' 
                        : 'Добави в количката'
                      }
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to home button */}
      <div className="text-center py-8">
        <a
          href="/"
          className="inline-flex items-center space-x-2 bg-white/8 hover:bg-white/12 text-text px-6 py-3 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
        >
          ← Назад към началната страница
        </a>
      </div>

      {/* Size Selection Modal - REMOVED - sizes now shown inline */}

      {/* Cart Modal */}
      {selectedItem && (
        <CartModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedItem(null)
            setSelectedSize(null)
            // Don't reset selectedSizes here - keep them for the product cards
          }}
          item={selectedItem}
          selectedSize={selectedSize}
        />
      )}
    </div>
  )
}
