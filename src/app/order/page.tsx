'use client'

import { useState, useEffect } from 'react'
import { Search, Star, Clock, Plus, HelpCircle, X } from 'lucide-react'
import CartModal from '../../components/CartModal'
import { fetchMenuData, MenuItem, fetchAddons } from '../../lib/menuData'
import { useLoading } from '../../components/LoadingContext'
import { useCart } from '../../components/CartContext'

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('pizza')
  
  // Fallback emojis for image errors
  const fallbackEmojis: { [key: string]: string } = {
    pizza: '🍕',
    burgers: '🍔', 
    doners: '🥙',
    drinks: '🥤',
    sauces: '🍶'
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState<any>(null)
  const [selectedSizes, setSelectedSizes] = useState<{ [key: number]: any }>({})
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // 50/50 Pizza state
  const [fiftyFiftySelection, setFiftyFiftySelection] = useState<{
    size: string | null;
    leftHalf: any | null;
    rightHalf: any | null;
    finalPrice: number;
    selectedAddons: any[];
    step: number;
  }>({
    size: null,
    leftHalf: null,
    rightHalf: null,
    finalPrice: 0,
    selectedAddons: [],
    step: 1 // 1: size, 2: left half, 3: right half, 4: review, 5: addons
  })

  // 50/50 Pizza addons state
  const [fiftyFiftyAddons, setFiftyFiftyAddons] = useState<any[]>([])
  const [isLoadingFiftyFiftyAddons, setIsLoadingFiftyFiftyAddons] = useState(false)

  const [menuData, setMenuData] = useState<{ [key: string]: MenuItem[] }>({})
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const { startLoading, stopLoading } = useLoading()
  const { addItem } = useCart()

  // Function to get pizza descriptions
  const getPizzaDescription = (pizzaName: string) => {
    const descriptions: { [key: string]: string } = {
      'BBQ Спешъл': 'Сочна пица с BBQ сос, пилешко месо, лук и моцарела',
      'BBQ Тексас': 'Американски стил с BBQ сос, говежди месо, бекон и сирене',
      'Акапулко': 'Мексиканска пица с пикантен сос, пилешко месо, чушки и сирене',
      'Вегетариан Делукс': 'Свежи зеленчуци, домати, гъби, маслини и моцарела',
      'Маргарита': 'Класическа пица с доматен сос, моцарела и босилек',
      'Пеперони': 'Остра пица с пеперони, доматен сос и моцарела',
      'Капричоза': 'Италианска пица с шунка, гъби, артишоки и моцарела',
      'Кватро Стаджони': 'Четири сезона с различни вкусове на всеки квадрант',
      'Морнара': 'Морска пица с риба, скариди и морски дарове',
      'Романа': 'Римска пица с прошуто, рокола и пармезан'
    }
    return descriptions[pizzaName] || 'Вкусна пица с пресни съставки и традиционен вкус'
  }

  // Function to show full description
  const showFullDescription = (description: string) => {
    setSelectedDescription(description)
    setShowDescriptionModal(true)
  }

  // 50/50 Pizza helper functions
  const getPriceForSize = (pizza: any, sizeName: string | null) => {
    if (!pizza || !sizeName) return 0
    
    switch (sizeName) {
      case 'Малка':
        return pizza.smallPrice || 0
      case 'Средна':
        return pizza.mediumPrice || 0
      case 'Голяма':
        return pizza.largePrice || 0
      default:
        return pizza.smallPrice || 0
    }
  }

  const calculateFiftyFiftyPrice = (leftPizza: any, rightPizza: any, sizeName: string | null) => {
    if (!leftPizza || !rightPizza || !sizeName) return 0

    const leftPrice = getPriceForSize(leftPizza, sizeName)
    const rightPrice = getPriceForSize(rightPizza, sizeName)

    // Validate prices are reasonable
    if (leftPrice < 0.50 || leftPrice > 1000 || rightPrice < 0.50 || rightPrice > 1000) {
      return 0
    }

    return Math.max(leftPrice, rightPrice)
  }

  const resetFiftyFiftySelection = () => {
    setFiftyFiftySelection({
      size: null,
      leftHalf: null,
      rightHalf: null,
      finalPrice: 0,
      selectedAddons: [],
      step: 1
    })
  }

  const addFiftyFiftyToCart = () => {
    if (!fiftyFiftySelection.leftHalf || !fiftyFiftySelection.rightHalf || !fiftyFiftySelection.size) {
      return
    }

    // Validate final price before adding to cart
    if (fiftyFiftySelection.finalPrice < 0.50 || fiftyFiftySelection.finalPrice > 1000) {
      alert('Невалидна цена за 50/50 пицата. Моля, опреснете страницата и опитайте отново.')
      return
    }

    // Create unique cart item for 50/50 pizza
    // IMPORTANT: Store base price WITHOUT addons (addons will be calculated by CartContext)
    const leftHalfName = fiftyFiftySelection.leftHalf?.name || 'Unknown'
    const rightHalfName = fiftyFiftySelection.rightHalf?.name || 'Unknown'

    const cartItem = {
      id: Date.now(), // Unique ID based on timestamp
      name: `${leftHalfName} / ${rightHalfName}`,
      price: fiftyFiftySelection.finalPrice, // Base price ONLY (without addons)
      image: '🍕',
      category: 'pizza-5050',
      size: fiftyFiftySelection.size,
      addons: fiftyFiftySelection.selectedAddons, // Addons stored separately
      comment: `${fiftyFiftySelection.leftHalf?.name} / ${fiftyFiftySelection.rightHalf?.name}: ${fiftyFiftySelection.size} (~2000г | 60см)${(fiftyFiftySelection.selectedAddons || []).length > 0 ? ` | ${(fiftyFiftySelection.selectedAddons || []).length} добавки` : ''}`,
      quantity: 1
    }

    addItem(cartItem)

    // Reset selection and go back to step 1
    resetFiftyFiftySelection()

  }

  // Handle screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch large pizza addons when 50/50 pizza reaches step 5
  useEffect(() => {
    const fetchFiftyFiftyAddons = async () => {
      if (fiftyFiftySelection.step === 5 && fiftyFiftyAddons.length === 0) {
        setIsLoadingFiftyFiftyAddons(true)
        try {
          const addons = await fetchAddons(1, 'голяма') // ProductTypeID = 1 for pizza, 'голяма' for large
          setFiftyFiftyAddons(addons)
        } catch {
          setFiftyFiftyAddons([])
        } finally {
          setIsLoadingFiftyFiftyAddons(false)
        }
      }
    }

    fetchFiftyFiftyAddons()
  }, [fiftyFiftySelection.step, fiftyFiftyAddons.length])


  // Fetch menu data from Supabase
  useEffect(() => {
    let isMounted = true // Track if component is still mounted
    
    async function loadMenuData() {
      try {
        startLoading() // Show spinning logo
        
        const data = await fetchMenuData()
        
        // Only proceed if component is still mounted
        if (!isMounted) {
          return
        }
        
        // Validate menu data prices for security
        const allItems = Object.values(data).flat()
        const suspiciousItems = allItems.filter((item: any) => {
          const prices = [item.smallPrice, item.mediumPrice, item.largePrice, item.basePrice].filter(p => p != null)
          return prices.some(price => price < 0.20 || price > 1000)
        })

        if (suspiciousItems.length > 0) {
          alert('Открити са невалидни цени в менюто. Моля, опреснете страницата.')
          return
        }

        setMenuData(data)
        setIsDataLoaded(true)
        
      } catch {
      } finally {
        // Only stop loading if component is still mounted
        if (isMounted) {
          stopLoading() // Hide spinning logo
        } else {
        }
      }
    }

    loadMenuData()
    
    // Cleanup function to prevent multiple runs
    return () => {
      isMounted = false
    }
  }, []) // Remove startLoading and stopLoading from dependencies

  const categories = [
    { key: 'pizza', label: '🍕 Пици', count: menuData.pizza?.length || 0 },
    { key: 'pizza-5050', label: '🍕 Пица 50/50', count: 'Специална' },
    { key: 'doners', label: '🥙 Дюнери', count: menuData.doners?.length || 0 },
    { key: 'burgers', label: '🍔 Бургери', count: menuData.burgers?.length || 0 },
    { key: 'drinks', label: '🥤 Напитки', count: menuData.drinks?.length || 0 },
    { key: 'sauces', label: '🍶 Добавки и Сосове\n(допълнително)', count: menuData.sauces?.length || 0 }
  ]

  // Reset 50/50 selection when changing categories
  const handleCategoryChange = (categoryKey: string) => {
    setActiveCategory(categoryKey)
    if (categoryKey !== 'pizza-5050') {
      resetFiftyFiftySelection()
    }
    
    // Scroll to top when changing categories
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredItems = activeCategory === 'pizza-5050' 
    ? [] 
    : searchTerm 
      ? // If searching, search across all categories
        Object.values(menuData).flat().filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : // If not searching, show items from active category
        menuData[activeCategory] || []

  const handleAddToCart = (item: any) => {
    
    // Define items that should be added directly to cart without personalization
    const directAddItems = [
      'Порция картофи',
      'Порция картофи с моцарела', 
      'Порция картофи със сирене',
      'Порция салата'
    ]
    
    // For sauces with single size, add directly to cart (same logic as CartModal)
    if (item.category === 'sauces' && (!item.sizes || item.sizes.length <= 1)) {
      // Use default size for sauces that don't require size selection
      let finalSize = 'Стандартен размер'
      if (item.sizes && item.sizes.length > 0) {
        finalSize = item.sizes[0].name
      }

      // Get base price (same logic as CartModal)
      const basePrice = item.price || item.basePrice || 0
      
      // For sauces, create a unique item each time by adding timestamp
      // This prevents quantity incrementing and allows separate sauce orders
      const cartItem = {
        ...item,
        id: `${item.id}_${Date.now()}`, // Make each sauce item unique
        productId: item.id, // Preserve original product ID for database
        price: basePrice,
        size: finalSize,
        addons: [],
        comment: '',
        quantity: 1
      }

      addItem(cartItem)
      // Scroll to top after adding to cart
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // For specific items that should not have personalization modal
    if (directAddItems.includes(item.name)) {
      // Use default size for items that don't require size selection
      let finalSize = 'Стандартен размер'
      if (item.sizes && item.sizes.length > 0) {
        finalSize = item.sizes[0].name
      }
      
      // Get base price
      const basePrice = item.price || item.basePrice || 0
      
      // Create unique item to prevent quantity incrementing
      const cartItem = {
        ...item,
        id: `${item.id}_${Date.now()}`, // Make each item unique
        productId: item.id, // Preserve original product ID for database
        price: basePrice,
        size: finalSize,
        addons: [],
        comment: '',
        quantity: 1
      }

      addItem(cartItem)
      // Scroll to top after adding to cart
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // For items with size options, ensure a size is selected
    if (item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0 && item.category !== 'drinks' && item.category !== 'burgers') {
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
      // For drinks and burgers, open modal for customization
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
              
           
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
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
      <div className="bg-card border-b border-white/8 sticky top-16 sm:top-20 z-30">
        <div className="container py-2 sm:py-4 px-4">
          <div 
            className="grid gap-2 sm:flex sm:justify-center sm:gap-4 sm:flex-wrap sm:overflow-visible sm:scrollbar-hide"
            style={{ 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            }}
          >
            {categories.map(category => (
              <button
                key={category.key}
                onClick={() => handleCategoryChange(category.key)}
                className={`px-3 sm:px-7 py-2 sm:py-4 rounded-xl transition-all transform hover:scale-105 text-xs sm:text-sm md:text-base min-w-0 flex-shrink-0 touch-manipulation active:scale-95 ${
                  activeCategory === category.key
                    ? 'bg-gradient-to-r from-red to-orange text-white shadow-lg shadow-orange/30'
                    : 'text-muted hover:text-orange hover:bg-white/6 bg-white/4'
                }`}
              >
                <span className="font-medium whitespace-pre-line text-center leading-tight block">{category.label}</span>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm opacity-75 block mt-0.5">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 px-4">
        {activeCategory === 'pizza-5050' ? (
          /* 50/50 Pizza Special UI */
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-text mb-2">Пица 50/50</h2>
            </div>

            {/* Step Indicator with Labels */}
            <div className="mb-8 px-2 sm:px-8">
              {/* Progress Bar Container */}
              <div className="flex justify-between items-center relative mb-4">
                {/* Background line - full width */}
                <div className="absolute left-0 right-0 h-0.5 bg-white/20" style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                
                {/* Progress line - continuous and passes over circles */}
                <div 
                  className="absolute left-0 h-0.5 bg-orange transition-all duration-300"
                  style={{ 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    width: `${((fiftyFiftySelection.step - 1) / 3) * 100}%` // Same calculation for mobile and desktop (4 steps)
                  }} 
                />
                
                {/* Step Dots - numbers sit above the line */}
                <div className="relative flex justify-between items-center w-full" style={{ zIndex: 3 }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="relative flex-1 flex justify-center">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold relative ${
                        fiftyFiftySelection.step >= step 
                          ? 'bg-gradient-to-r from-red to-orange text-white' 
                          : 'bg-card text-muted'
                      }`}>
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Labels */}
              <div className="flex justify-between items-center">
                <div className="text-xs sm:text-sm text-muted text-center flex-1 px-1">Размер</div>
                <div className="text-xs sm:text-sm text-muted text-center flex-1 px-1">Лява половина</div>
                <div className="text-xs sm:text-sm text-muted text-center flex-1 px-1">Дясна половина</div>
                <div className="text-xs sm:text-sm text-muted text-center flex-1 px-1">Добавки</div>
              </div>
            </div>

            {/* 50/50 Content */}
            <div className="bg-card border border-white/12 rounded-xl p-6">
              
              {/* Step 1: Size Selection */}
              {fiftyFiftySelection.step === 1 && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-text mb-6">Избери размер на пицата</h3>
                  
                  <div className="flex justify-center mb-8">
                    {['Голяма'].map((sizeName) => (
                      <button
                        key={sizeName}
                        onClick={() => {
                          setFiftyFiftySelection(prev => ({
                            ...prev,
                            size: sizeName,
                            step: 2
                          }))
                        }}
                        className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 hover:shadow-lg text-center w-64 mx-auto ${
                          fiftyFiftySelection.size === sizeName
                            ? 'border-orange bg-orange/10 shadow-lg'
                            : 'border-white/20 hover:border-orange/50'
                        }`}
                      >
                        <div className="text-4xl mb-3">🍕</div>
                        <div className="text-xl font-bold text-text mb-2">{sizeName}</div>
                        <div className="text-sm text-muted">
                          ~2000г | 60см
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleCategoryChange('pizza')}
                    className="bg-white/8 hover:bg-white/12 text-text px-6 py-3 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
                  >
                    ← Назад към пиците
                  </button>
                </div>
              )}

              {/* Step 2: Left Half Selection */}
              {fiftyFiftySelection.step === 2 && (
                <div>
                  <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <button
                      onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 1 }))}
                      className="flex items-center space-x-2 text-muted hover:text-orange transition-colors order-1 md:order-1"
                    >
                      <span>←</span>
                      <span>Назад</span>
                    </button>
                    <h3 className="text-2xl font-bold text-text text-center order-2 md:order-2">Избери лявата половина</h3>
                    <div className="w-20 order-3 md:order-3 hidden md:block"></div>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg">
                      Размер: {fiftyFiftySelection.size} (~2000г | 60см)
                    </div>
                  </div>

                  <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
                    {menuData.pizza?.map((pizza) => (
                      <div
                        key={pizza.id}
                        onClick={() => {
                          setFiftyFiftySelection(prev => ({
                            ...prev,
                            leftHalf: pizza,
                            step: 3
                          }))
                        }}
                        className={`card hover:shadow-xl transition-all p-4 text-left hover:border-orange/50 relative cursor-pointer ${
                          fiftyFiftySelection.leftHalf?.id === pizza.id 
                            ? 'border-green border-2 bg-green/10 animate-pulse' 
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Selected badge */}
                        {fiftyFiftySelection.leftHalf?.id === pizza.id && (
                          <div className="absolute top-2 right-2 bg-green text-white text-xs px-2 py-1 rounded-full font-bold">
                            ✓ ЛЯВА
                          </div>
                        )}
                        
                        <div className="text-center mb-3">
                          {pizza.image.startsWith('http') ? (
                            <img 
                              src={pizza.image} 
                              alt={pizza.name}
                              className="w-16 h-16 object-cover rounded-lg shadow-lg mx-auto"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                (target.nextElementSibling as HTMLElement)!.style.display = 'block';
                              }}
                            />
                          ) : (
                            <div className="text-3xl">{pizza.image}</div>
                          )}
                          {pizza.image.startsWith('http') && (
                            <div className="text-3xl hidden">{fallbackEmojis.pizza}</div>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-text mb-2 line-clamp-2">{pizza.name}</h4>
                        
                        {/* Description with help icon */}
                        <div className="flex items-start gap-2 mb-2">
                          <p className="text-xs text-muted line-clamp-2 flex-1">
                            {pizza.description || getPizzaDescription(pizza.name)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              showFullDescription(pizza.description || getPizzaDescription(pizza.name))
                            }}
                            className="flex-shrink-0 text-muted hover:text-orange transition-colors p-1"
                            title="Виж пълното описание"
                          >
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="text-orange font-bold text-lg">
                          {getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} лв.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Right Half Selection */}
              {fiftyFiftySelection.step === 3 && (
                <div>
                  <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <button
                      onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 2, rightHalf: null }))}
                      className="flex items-center space-x-2 text-muted hover:text-orange transition-colors order-1 md:order-1"
                    >
                      <span>←</span>
                      <span>Назад</span>
                    </button>
                    <h3 className="text-2xl font-bold text-text text-center order-2 md:order-2">Избери дясната половина</h3>
                    <div className="w-20 order-3 md:order-3 hidden md:block"></div>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mb-4">
                    <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg">
                      Размер: {fiftyFiftySelection.size}
                    </div>
                    <div className="inline-block px-4 py-2 bg-green/20 border border-green text-green rounded-lg">
                      Лява: {fiftyFiftySelection.leftHalf?.name}
                    </div>
                  </div>
                  
                  {/* Floating hint */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-2 bg-orange/10 border border-orange/30 text-orange px-4 py-2 rounded-full animate-bounce">
                      <span>👉</span>
                      <span className="text-sm font-medium">Сега избери дясна половина</span>
                    </div>
                  </div>

                  <div className="grid gap-4" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
                    {/* Placeholder card for right half */}
                    <div className="card border-2 border-dashed border-orange/50 bg-orange/5 p-4 text-center animate-pulse">
                      <div className="text-3xl mb-3">❓</div>
                      <h4 className="font-bold text-sm text-orange mb-2">Избери дясна половина</h4>
                      <p className="text-xs text-muted">Кликни на пица</p>
                      <div className="text-orange font-bold text-lg mt-2">
                        {fiftyFiftySelection.leftHalf ? getPriceForSize(fiftyFiftySelection.leftHalf, fiftyFiftySelection.size).toFixed(2) : '0.00'} лв.
                      </div>
                      <div className="text-xs text-muted">минимум</div>
                    </div>
                    
                    {menuData.pizza?.map((pizza) => (
                      <div
                        key={pizza.id}
                        onClick={() => {
                          // If clicking on left half pizza, change it and reset right half
                          if (pizza.id === fiftyFiftySelection.leftHalf?.id) {
                            setFiftyFiftySelection(prev => ({
                              ...prev,
                              leftHalf: null,
                              rightHalf: null,
                              finalPrice: 0,
                              step: 2
                            }))
                            return
                          }
                          
                          // If clicking on right half pizza, change it
                          if (pizza.id === fiftyFiftySelection.rightHalf?.id) {
                            setFiftyFiftySelection(prev => ({
                              ...prev,
                              rightHalf: null,
                              finalPrice: 0
                            }))
                            return
                          }
                          
                          // Normal selection of right half
                          const finalPrice = calculateFiftyFiftyPrice(fiftyFiftySelection.leftHalf, pizza, fiftyFiftySelection.size)
                          setFiftyFiftySelection(prev => ({
                            ...prev,
                            rightHalf: pizza,
                            finalPrice: finalPrice,
                            step: 4
                          }))
                        }}
                        className={`card hover:shadow-xl transition-all p-4 text-left hover:border-orange/50 relative cursor-pointer ${
                          pizza.id === fiftyFiftySelection.leftHalf?.id 
                            ? 'border-green border-2 bg-green/10' 
                            : fiftyFiftySelection.rightHalf?.id === pizza.id
                              ? 'border-orange border-2 bg-orange/10 animate-pulse'
                              : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Selected badges */}
                        {fiftyFiftySelection.rightHalf?.id === pizza.id && (
                          <div className="absolute top-2 right-2 bg-orange text-white text-xs px-2 py-1 rounded-full font-bold">
                            ✓ ДЯСНА
                          </div>
                        )}
                        {pizza.id === fiftyFiftySelection.leftHalf?.id && (
                          <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            ЛЯВА
                          </div>
                        )}
                        
                        <div className="text-center mb-3">
                          {pizza.image.startsWith('http') ? (
                            <img 
                              src={pizza.image} 
                              alt={pizza.name}
                              className="w-16 h-16 object-cover rounded-lg shadow-lg mx-auto"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                (target.nextElementSibling as HTMLElement)!.style.display = 'block';
                              }}
                            />
                          ) : (
                            <div className="text-3xl">{pizza.image}</div>
                          )}
                          {pizza.image.startsWith('http') && (
                            <div className="text-3xl hidden">{fallbackEmojis.pizza}</div>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-text mb-2 line-clamp-2">{pizza.name}</h4>
                        
                        {/* Description with help icon */}
                        <div className="flex items-start gap-2 mb-2">
                          <p className="text-xs text-muted line-clamp-2 flex-1">
                            {pizza.description || getPizzaDescription(pizza.name)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              showFullDescription(pizza.description || getPizzaDescription(pizza.name))
                            }}
                            className="flex-shrink-0 text-muted hover:text-orange transition-colors p-1"
                            title="Виж пълното описание"
                          >
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="text-orange font-bold text-lg">
                          {getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} лв.
                        </div>
                        {pizza.id === fiftyFiftySelection.leftHalf?.id && (
                          <div className="text-xs text-green mt-1">Кликни за промяна</div>
                        )}
                        {pizza.id === fiftyFiftySelection.rightHalf?.id && (
                          <div className="text-xs text-orange mt-1">Кликни за промяна</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {fiftyFiftySelection.step === 4 && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-text mb-6">Преглед на поръчката</h3>
                  
                  <div className="max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Left Half */}
                      <div className="bg-white/5 rounded-xl p-6">
                        <h4 className="font-bold text-lg text-text mb-4">Лява половина</h4>
                        <div className="text-center mb-3">
                          {fiftyFiftySelection.leftHalf?.image?.startsWith('http') ? (
                            <img 
                              src={fiftyFiftySelection.leftHalf.image} 
                              alt={fiftyFiftySelection.leftHalf.name}
                              className="w-20 h-20 object-cover rounded-lg shadow-lg mx-auto"
                            />
                          ) : (
                            <div className="text-4xl">{fiftyFiftySelection.leftHalf?.image}</div>
                          )}
                        </div>
                        <h5 className="font-medium text-text mb-2">{fiftyFiftySelection.leftHalf?.name}</h5>
                        <div className="text-orange font-bold">
                          {getPriceForSize(fiftyFiftySelection.leftHalf, fiftyFiftySelection.size).toFixed(2)} лв.
                        </div>
                      </div>
                      
                      {/* Right Half */}
                      <div className="bg-white/5 rounded-xl p-6">
                        <h4 className="font-bold text-lg text-text mb-4">Дясна половина</h4>
                        <div className="text-center mb-3">
                          {fiftyFiftySelection.rightHalf?.image?.startsWith('http') ? (
                            <img 
                              src={fiftyFiftySelection.rightHalf.image} 
                              alt={fiftyFiftySelection.rightHalf.name}
                              className="w-20 h-20 object-cover rounded-lg shadow-lg mx-auto"
                            />
                          ) : (
                            <div className="text-4xl">{fiftyFiftySelection.rightHalf?.image}</div>
                          )}
                        </div>
                        <h5 className="font-medium text-text mb-2">{fiftyFiftySelection.rightHalf?.name}</h5>
                        <div className="text-orange font-bold">
                          {getPriceForSize(fiftyFiftySelection.rightHalf, fiftyFiftySelection.size).toFixed(2)} лв.
                        </div>
                      </div>
                    </div>
                    
                    {/* Final Price */}
                    <div className="bg-gradient-to-r from-red/10 to-orange/10 border border-orange rounded-xl p-6 mb-6">
                      <h4 className="text-xl font-bold text-text mb-2">
                        {fiftyFiftySelection.leftHalf?.name} / {fiftyFiftySelection.rightHalf?.name}
                      </h4>
                      <div className="text-sm text-muted mb-2">
                        Размер: {fiftyFiftySelection.size} (~2000г | 60см)
                      </div>
                      <div className="text-3xl font-bold text-orange">
                        {fiftyFiftySelection.finalPrice.toFixed(2)} лв.
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 3 }))}
                        className="bg-white/8 hover:bg-white/12 text-text px-6 py-3 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
                      >
                        ← Промени
                      </button>
                      <button
                        onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 5 }))}
                        className="bg-gradient-to-r from-red to-orange text-white px-8 py-3 rounded-xl font-medium transition-all transform hover:scale-105 hover:shadow-lg"
                      >
                        Избери добавки →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Addons Selection */}
              {fiftyFiftySelection.step === 5 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 4 }))}
                      className="flex items-center space-x-2 text-muted hover:text-orange transition-colors"
                    >
                      <span>←</span>
                      <span>Назад</span>
                    </button>
                    <h3 className="text-2xl font-bold text-text">Избери добавки</h3>
                    <div className="w-20"></div>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mb-6">
                    <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg">
                      {fiftyFiftySelection.leftHalf?.name} / {fiftyFiftySelection.rightHalf?.name}
                    </div>
                    <div className="inline-block px-4 py-2 bg-green/20 border border-green text-green rounded-lg">
                      {fiftyFiftySelection.size} (~2000г | 60см)
                    </div>
                  </div>

                  {/* Addons Selection */}
                  <div className="mb-8 -mx-4 px-4">
                    {isLoadingFiftyFiftyAddons ? (
                      <div className="text-center text-muted py-4">
                        Зареждане на добавки...
                      </div>
                    ) : fiftyFiftyAddons && fiftyFiftyAddons.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-text mb-4">Добавки:</h4>
                        <p className="text-sm text-muted mb-4">
                          💡 Добавките за пица са платени според цената в менюто.
                        </p>
                        {/* Sauces */}
                        {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'sauce').length > 0 && (
                          <div>
                            <h5 className="text-sm text-muted mb-2">Сосове:</h5>
                            <div className="grid gap-3 place-items-center grid-cols-1 sm:grid-cols-2">
                              {fiftyFiftyAddons
                                .filter((addon: any) => addon.AddonType === 'sauce')
                                .map((addon: any) => (
                                  <button
                                    key={addon.AddonID}
                                    onClick={() => {
                                      const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                                      (fiftyFiftySelection.selectedAddons || []).find((a: any) => a.AddonID === addon.AddonID)
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

                        {/* Vegetables */}
                        {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'vegetable').length > 0 && (
                          <div>
                            <h5 className="text-sm text-muted mb-2">Салати:</h5>
                            <div className="grid gap-3 place-items-center grid-cols-1 sm:grid-cols-2">
                              {fiftyFiftyAddons
                                .filter((addon: any) => addon.AddonType === 'vegetable')
                                .map((addon: any) => (
                                  <button
                                    key={addon.AddonID}
                                    onClick={() => {
                                      const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                                      (fiftyFiftySelection.selectedAddons || []).find((a: any) => a.AddonID === addon.AddonID)
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

                        {/* Meats (for 50/50 pizza) */}
                        {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'meat').length > 0 && (
                          <div>
                            <h5 className="text-sm text-muted mb-2">Колбаси:</h5>
                            <div className="grid gap-3 place-items-center grid-cols-1 sm:grid-cols-2">
                              {fiftyFiftyAddons
                                .filter((addon: any) => addon.AddonType === 'meat')
                                .map((addon: any) => (
                                  <button
                                    key={addon.AddonID}
                                    onClick={() => {
                                      const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                                      (fiftyFiftySelection.selectedAddons || []).find((a: any) => a.AddonID === addon.AddonID)
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

                        {/* Cheese (for 50/50 pizza) */}
                        {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'cheese').length > 0 && (
                          <div>
                            <h5 className="text-sm text-muted mb-2">Сирена:</h5>
                            <div className="grid gap-3 place-items-center grid-cols-1 sm:grid-cols-2">
                              {fiftyFiftyAddons
                                .filter((addon: any) => addon.AddonType === 'cheese')
                                .map((addon: any) => (
                                  <button
                                    key={addon.AddonID}
                                    onClick={() => {
                                      const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                                      (fiftyFiftySelection.selectedAddons || []).find((a: any) => a.AddonID === addon.AddonID)
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

                        {/* Pizza Addons (for 50/50 pizza) */}
                        {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'pizza-addon').length > 0 && (
                          <div>
                            <h5 className="text-sm text-muted mb-2">Добавки:</h5>
                            <div className="grid gap-3 place-items-center grid-cols-1 sm:grid-cols-2">
                              {fiftyFiftyAddons
                                .filter((addon: any) => addon.AddonType === 'pizza-addon')
                                .map((addon: any) => (
                                  <button
                                    key={addon.AddonID}
                                    onClick={() => {
                                      const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`w-full rounded-lg border text-sm transition-all text-center sauce-button ${
                                      (fiftyFiftySelection.selectedAddons || []).find((a: any) => a.AddonID === addon.AddonID)
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
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🍶</div>
                        <p className="text-muted">Няма налични добавки</p>
                      </div>
                    )}
                  </div>

                  {/* Final Action Buttons */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 4 }))}
                      className="bg-white/8 hover:bg-white/12 text-text px-6 py-3 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
                    >
                      ← Назад
                    </button>
                    <button
                      onClick={addFiftyFiftyToCart}
                      className="bg-gradient-to-r from-red to-orange text-white px-8 py-3 rounded-xl font-medium transition-all transform hover:scale-105 hover:shadow-lg"
                    >
                      Добави в кошницата
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-4xl sm:text-6xl mb-4">🔍</div>
            <p className="text-muted text-lg sm:text-xl mb-4">Няма намерени резултати</p>
            <button
              onClick={() => { setSearchTerm(''); handleCategoryChange('pizza'); }}
              className="bg-gradient-to-r from-red to-orange text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all transform hover:scale-105 text-sm sm:text-base"
            >
              Изчисти филтрите
            </button>
          </div>
        ) : (

          <div 
            className="grid gap-3" 
            style={{ 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
              gap: isMobile ? '0.75rem' : '1.5rem' 
            }}
          >
            {filteredItems.map(item => (
              <div key={item.id} className="bg-card border border-white/12 rounded-xl p-4 md:p-6 overflow-hidden flex flex-col h-full min-h-[400px]">                <div className="text-center py-3 md:py-4 bg-gradient-to-br from-red/10 to-orange/10 min-h-[120px] md:min-h-[160px] flex items-center justify-center relative overflow-hidden">
                  {(() => {
                    return item.image.startsWith('http') ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        (target.nextElementSibling as HTMLElement)!.style.display = 'flex';
                      }}
                    />
                    ) : (
                      <div className="text-4xl md:text-6xl">{item.image}</div>
                    )
                  })()}
                  {item.image.startsWith('http') && (
                    <div className="absolute inset-0 hidden items-center justify-center text-4xl md:text-6xl">{fallbackEmojis[item.category] || '🍽️'}</div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  {/* Content Area - Flexible */}
                  <div className="flex-1 flex flex-col justify-between min-h-0">
                    {/* Top Content */}
                    <div>
                      <h3 className="font-bold text-base md:text-lg mb-2 text-text line-clamp-2">
                        {item.name}
                      </h3>
                  
                  {/* Pizza Description */}
                  <div className="mb-3">
                    <div className="flex items-start gap-2">
                      <p 
                            className="text-xs md:text-sm text-muted line-clamp-2 md:line-clamp-3 flex-1"
                        title={item.description || getPizzaDescription(item.name)}
                      >
                        {item.description || getPizzaDescription(item.name)}
                      </p>
                      <button
                        onClick={() => showFullDescription(item.description || getPizzaDescription(item.name))}
                        className="flex-shrink-0 text-muted hover:text-orange transition-colors p-1"
                        title="Виж пълното описание"
                      >
                            <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                        <span className="text-orange font-bold text-xl md:text-2xl">
                        {(() => {
                          // If a size is selected, show that price
                          if (selectedSizes[item.id]?.price) {
                            return (selectedSizes[item.id].price || 0).toFixed(2);
                          }
                          
                          // For burgers and drinks, use basePrice first
                          if (item.category === 'burgers' || item.category === 'drinks') {
                            if (item.basePrice && item.basePrice > 0) {
                              return item.basePrice.toFixed(2);
                            }
                          }
                          
                          // Otherwise, show the first available price from database
                          // Priority: Small -> Medium -> Large
                          if (item.smallPrice && item.smallPrice > 0) {
                            return item.smallPrice.toFixed(2);
                          } else if (item.mediumPrice && item.mediumPrice > 0) {
                            return item.mediumPrice.toFixed(2);
                          } else if (item.largePrice && item.largePrice > 0) {
                            return item.largePrice.toFixed(2);
                          }
                          
                          // Fallback to basePrice
                          return item.basePrice?.toFixed(2) || '0.00';
                        })()} лв.
                    </span>
                    <div className="flex items-center text-xs md:text-sm text-muted">
                      <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow fill-current mr-1" />
                      {item.rating}
                    </div>
                  </div>
                  
                      <div className="flex items-center text-xs md:text-sm text-muted mb-4">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    {item.time}
                      </div>
                  </div>

                    {/* Bottom Content - Size Selection and Button */}
                    <div>
                    {(() => {
                      // Check if pizza has only Small size (no Medium or Large prices)
                      const hasOnlySmallSize = item.category === 'pizza' && 
                        item.smallPrice && 
                        !item.mediumPrice && 
                        !item.largePrice;
                      
                      // Check if doner has only Small size (no Medium or Large prices)
                      const hasOnlySmallSizeDoner = item.category === 'doners' && 
                        item.smallPrice && 
                        !item.mediumPrice && 
                        !item.largePrice;
                      
                      // Check if drink has only Small size (no Medium or Large prices)
                      const hasOnlySmallSizeDrink = item.category === 'drinks' && 
                        item.smallPrice && 
                        !item.mediumPrice && 
                        !item.largePrice;
                      
                      // Check if burger has only Small size (no Medium or Large prices)
                      const hasOnlySmallSizeBurger = item.category === 'burgers' && 
                        item.smallPrice && 
                        !item.mediumPrice && 
                        !item.largePrice;
                      
                      if (hasOnlySmallSize) {
                        /* Show standard size for pizzas with only Small size in DB */
                        // Special case for standard size pizzas - show specific weight
                        const standardSizePizzas = [
                          'калцоне', 'calzone', 'мортадела бурата', 'прошутто фреш', 
                          'сладка пица', 'сладка праскова', 'смокини деликастес'
                        ];
                        const isStandardSizePizza = standardSizePizzas.some(pizza => 
                          item.name.toLowerCase().includes(pizza)
                        );
                        const weightDisplay = isStandardSizePizza ? ' | 450гр' : (item.smallWeight ? ` | ${item.smallWeight}гр` : '');
                        
                        return (
                          <div className="mb-4">
                            <div className="text-center">
                              <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg text-sm font-medium">
                                Стандартен размер (30см{weightDisplay})
                              </div>
                            </div>
                          </div>
                        );
                      } else if (item.category === 'doners') {
                        /* Check if doner has multiple sizes */
                        const hasMultipleSizes = item.sizes && item.sizes.length > 1;
                        
                        if (hasMultipleSizes) {
                          /* Show size selection for doners with multiple sizes */
                          return (
                            <div className="mb-4">
                              {selectedSizes[item.id] ? (
                                /* Show selected size with change option */
                                <div className="mb-4">
                                  <div className="px-3 py-2 rounded-lg text-xs border transition-all bg-orange/20 border-orange text-orange shadow-lg shadow-orange/25">
                                    <div className="font-medium">
                                        {selectedSizes[item.id].name} {selectedSizes[item.id].weight ? `(${selectedSizes[item.id].weight}г)` : ''}
                                    </div>
                                    <div className="text-xs opacity-75">{selectedSizes[item.id].price?.toFixed(2)} лв.</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedSizes(prev => ({
                                        ...prev,
                                        [item.id]: null
                                      }))
                                    }}
                                    className="text-sm text-orange/70 hover:text-orange mt-3 underline cursor-pointer block w-full text-left"
                                  >
                                    Промени размер
                                  </button>
                                </div>
                              ) : (
                                /* Show size selection buttons */
                                <>
                                <p className="text-sm text-muted mb-4 text-center">Избери размер:</p>
                                <div className="space-y-2 md:space-y-3 max-w-xs mx-auto">
                                  {item.sizes.map((size, index) => (
                                    <button 
                                      key={index}
                                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-all bg-white/8 border-white/12 text-text hover:border-orange/50 hover:bg-orange/10 flex items-center justify-between"
                                      onClick={() => setSelectedSizes(prev => ({
                                        ...prev,
                                        [item.id]: size
                                      }))}
                                    >
                                      <div className="text-left">
                                        <div className="font-medium text-xs md:text-sm">
                                          {size.name}
                                        </div>
                                        {size.weight && (
                                          <div className="text-xs text-muted mt-1">
                                            ({size.weight}г)
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-xs md:text-sm font-bold text-orange">
                                        {size.price?.toFixed(2)} лв.
                                      </div>
                                    </button>
                                  ))}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        } else {
                          /* Show standard size for doners with single size - consistent positioning */
                        const weightDisplay = item.smallWeight ? ` | ${item.smallWeight}гр` : '';
                        
                        return (
                          <div className="mb-4">
                            <div className="text-center">
                              <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg text-sm font-medium">
                                Стандартен размер{weightDisplay}
                              </div>
                            </div>
                          </div>
                        );
                        }
                      } else if (item.category === 'drinks') {
                        /* For drinks, extract volume from name and don't show size selection */
                        // More robust regex to catch different volume formats
                        const volumeMatch = item.name.match(/\((\d+\s*мл)\)/i) || 
                                          item.name.match(/(\d+\s*мл)/i) ||
                                          item.name.match(/\((\d+\s*ml)\)/i) ||
                                          item.name.match(/(\d+\s*ml)/i);
                        const volume = volumeMatch ? volumeMatch[1] : '';
                        
                        return (
                          <div className="mb-4">
                            <div className="text-center">
                              <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg text-sm font-medium">
                                {volume || '500 мл'}
                              </div>
                            </div>
                          </div>
                        );
                      } else if (item.category === 'burgers') {
                        /* For burgers, show standard size and don't show size selection */
                        return (
                          <div className="mb-4">
                            <div className="text-center">
                              <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg text-sm font-medium">
                                Стандартен размер
                              </div>
                            </div>
                          </div>
                        );
                      } else if (item.category === 'sauces') {
                        /* Check if sauce has multiple sizes */
                        const hasMultipleSizes = item.sizes && item.sizes.length > 1;
                        
                        if (hasMultipleSizes) {
                          /* Show size selection for sauces with multiple sizes */
                          return (
                            <div className="mb-4">
                              {selectedSizes[item.id] ? (
                                /* Show selected size with change option */
                                <div className="mb-4">
                                  <div className="px-3 py-2 rounded-lg text-xs border transition-all bg-orange/20 border-orange text-orange shadow-lg shadow-orange/25">
                                    <div className="font-medium">
                                        {selectedSizes[item.id].name} {selectedSizes[item.id].weight ? `(${selectedSizes[item.id].weight}г)` : ''}
                                    </div>
                                    <div className="text-xs opacity-75">{selectedSizes[item.id].price?.toFixed(2)} лв.</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedSizes(prev => ({
                                        ...prev,
                                        [item.id]: null
                                      }))
                                    }}
                                    className="text-sm text-orange/70 hover:text-orange mt-3 underline cursor-pointer block w-full text-left"
                                  >
                                    Промени размер
                                  </button>
                                </div>
                              ) : (
                                /* Show size selection buttons */
                                <>
                                <p className="text-sm text-muted mb-4 text-center">Избери размер:</p>
                                <div className="space-y-2 md:space-y-3 max-w-xs mx-auto">
                                  {item.sizes.map((size, index) => (
                                    <button 
                                      key={index}
                                      className="w-full px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-all bg-white/8 border-white/12 text-text hover:border-orange/50 hover:bg-orange/10 flex items-center justify-between"
                                      onClick={() => setSelectedSizes(prev => ({
                                        ...prev,
                                        [item.id]: size
                                      }))}
                                    >
                                      <div className="text-left">
                                        <div className="font-medium text-xs md:text-sm">
                                          {size.name}
                                        </div>
                                        {size.weight && (
                                          <div className="text-xs text-muted mt-1">
                                            ({size.weight}г)
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-xs md:text-sm font-bold text-orange">
                                        {size.price?.toFixed(2)} лв.
                                      </div>
                                    </button>
                                  ))}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        } else {
                          /* Show standard size for sauces with single size - consistent positioning */
                          const weightDisplay = item.smallWeight ? ` | ${item.smallWeight}г` : '';
                        
                        return (
                          <div className="mb-4">
                            <div className="text-center">
                              <div className="inline-block px-4 py-2 bg-orange/20 border border-orange text-orange rounded-lg text-sm font-medium">
                                Стандартен размер{weightDisplay}
                              </div>
                            </div>
                          </div>
                        );
                        }
                      } else if (!item.sizes || item.sizes.length === 0) {
                        /* Show message when no sizes are available */
                        return (
                          <div className="mb-4">
                            <div className="text-center">
                              <div className="inline-block px-4 py-2 bg-gray-500/20 border border-gray-500 text-gray-400 rounded-lg text-sm font-medium">
                                Няма налични размери
                              </div>
                            </div>
                          </div>
                        );
                      } else if (item.sizes && item.sizes.length > 1) {
                        /* Show size selection for pizzas with multiple sizes */
                        return (
                    <div className="mb-4">
                          {selectedSizes[item.id] ? (
                            /* Show selected size with change option */
                            <div className="mb-4">
                              <div className="px-3 py-2 rounded-lg text-xs border transition-all bg-orange/20 border-orange text-orange shadow-lg shadow-orange/25">
                                <div className="font-medium">
                                    {selectedSizes[item.id].name} {selectedSizes[item.id].weight ? `(${selectedSizes[item.id].weight}г)` : ''}
                                </div>
                                <div className="text-xs opacity-75">{selectedSizes[item.id].price?.toFixed(2)} лв.</div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSizes(prev => ({
                                    ...prev,
                                    [item.id]: null
                                  }))
                                }}
                                className="text-sm text-orange/70 hover:text-orange mt-3 underline cursor-pointer block w-full text-left"
                              >
                                Промени размер
                              </button>
                            </div>
                          ) : (
                            /* Show size selection buttons */
                            <>
                            <p className="text-sm text-muted mb-4 text-center">Избери размер:</p>
                            <div className="space-y-2 md:space-y-3 max-w-xs mx-auto">
                              {item.sizes.map((size, index) => (
                                <button 
                                  key={index}
                                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-xl border transition-all bg-white/8 border-white/12 text-text hover:border-orange/50 hover:bg-orange/10 flex items-center justify-between"
                                  onClick={() => setSelectedSizes(prev => ({
                                    ...prev,
                                    [item.id]: size
                                  }))}
                                >
                                  <div className="text-left">
                                    <div className="font-medium text-xs md:text-sm">
                                      {size.name}
                                    </div>
                                    {size.weight && (
                                      <div className="text-xs text-muted mt-1">
                                        ({size.weight}г)
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs md:text-sm font-bold text-orange">
                                    {size.price?.toFixed(2)} лв.
                                  </div>
                                </button>
                              ))}
                              </div>
                            </>
                          )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    </div>
                  
                  {/* Footer - Sticky to bottom */}
                  <div className="mt-auto">
                  <button
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      handleAddToCart(item)
                    }}
                    disabled={(() => {
                      // Sauces, drinks, and burgers should never be disabled
                      if (item.category === 'sauces' || item.category === 'drinks' || item.category === 'burgers') {
                        return false
                      }
                      
                      // For other categories, check if size selection is required
                      return (!item.sizes || item.sizes.length === 0) || (item.sizes && item.sizes.length > 0 && !(item.category === 'pizza' && item.smallPrice && !item.mediumPrice && !item.largePrice) && !(item.category === 'doners' && (!item.sizes || item.sizes.length <= 1)) && !selectedSizes[item.id])
                    })()}
                    className={`w-full py-2 md:py-3 px-3 md:px-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-1 md:space-x-2 text-sm md:text-base relative z-10 ${
                      (() => {
                        // Drinks, burgers, and sauces are always enabled (no size selection required)
                        if (item.category === 'drinks' || item.category === 'burgers' || item.category === 'sauces') {
                          return 'bg-gradient-to-r from-red to-orange text-white hover:shadow-lg cursor-pointer';
                        }
                        
                        // For other categories, check if size selection is required
                        if (!item.sizes || item.sizes.length === 0) {
                          // No sizes available - disabled button
                          return 'bg-gray-500 text-gray-300 cursor-not-allowed';
                        }
                        
                        // Special cases for items with only one size (no selection needed)
                        if (item.category === 'pizza' && item.smallPrice && !item.mediumPrice && !item.largePrice) {
                          return 'bg-gradient-to-r from-red to-orange text-white hover:shadow-lg cursor-pointer'; // Standard size pizza
                        }
                        
                        if (item.category === 'doners' && item.sizes.length <= 1) {
                          return 'bg-gradient-to-r from-red to-orange text-white hover:shadow-lg cursor-pointer'; // Single size doner
                        }
                        
                        if (item.category === 'sauces' && item.sizes.length <= 1) {
                          return 'bg-gradient-to-r from-red to-orange text-white hover:shadow-lg cursor-pointer'; // Single size sauce
                        }
                        
                        // For items with multiple sizes, require size selection
                        return !selectedSizes[item.id] 
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red to-orange text-white hover:shadow-lg cursor-pointer';
                      })()
                    }`}
                  >
                    <Plus size={16} className="md:w-5 md:h-5" />
                    <span className="truncate">
                      {(() => {
                        // Drinks and burgers always show "Добави"
                        if (item.category === 'drinks' || item.category === 'burgers') {
                          return 'Добави'
                        }
                        
                        // Sauces with single size show "Добави"
                        if (item.category === 'sauces' && (!item.sizes || item.sizes.length <= 1)) {
                          return 'Добави'
                        }
                        
                        // Pizzas with only small size show "Добави"
                        if (item.category === 'pizza' && item.smallPrice && !item.mediumPrice && !item.largePrice) {
                          return 'Добави'
                        }
                        
                        // Doners with single size show "Добави"
                        if (item.category === 'doners' && (!item.sizes || item.sizes.length <= 1)) {
                          return 'Добави'
                        }
                        
                        // Items with no sizes show "Няма размери"
                        if (!item.sizes || item.sizes.length === 0) {
                          return 'Няма размери'
                        }
                        
                        // Items with multiple sizes require size selection
                        if (!selectedSizes[item.id]) {
                          return 'Избери размер'
                        }
                        
                        // Default case
                        return 'Добави'
                      })()}
                    </span>
                  </button>
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to home button */}
      <div className="text-center py-4 sm:py-8 px-4">
        <a
          href="/"
          className="inline-flex items-center space-x-2 bg-white/8 hover:bg-white/12 text-text px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20 text-sm sm:text-base"
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
          selectedSize={selectedItem ? selectedSizes[selectedItem.id] : null}
          onSizeChange={(itemId, size) => {
            setSelectedSizes(prev => ({
              ...prev,
              [itemId]: size
            }))
          }}
        />
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
          onClick={() => setShowDescriptionModal(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Описание</h3>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {selectedDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
