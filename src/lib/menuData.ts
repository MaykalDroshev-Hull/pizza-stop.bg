import { supabase, Product } from './supabase'

// Database types based on your structure
export interface ProductAddon {
  AddonID: number
  Name: string
  Price: number
  AddonType: string
  ProductTypeID: number
}

export interface MenuItem {
  id: number
  name: string
  basePrice: number
  image: string
  category: string
  rating: number
  time: string
  description?: string
  sizes: Array<{
    name: string
    price: number
    multiplier: number
    weight?: number | null
  }>
  smallPrice: number
  mediumPrice: number | null
  largePrice: number | null
  smallWeight: number | null
  mediumWeight: number | null
  largeWeight: number | null
  addons: any[]
}

// Map ProductTypeID to category keys
const categoryMap: { [key: number]: string } = {
  1: 'pizza',
  2: 'burgers', 
  3: 'doners',
  4: 'drinks',
  5: 'sauces',
  6: 'sauces',
  9: 'pizza'
}

// Note: Images are now loaded from the database ImageURL field instead of hardcoded arrays

// Map ProductTypeID to emojis (fallback)
const emojiMap: { [key: number]: string } = {
  1: '🍕',
  2: '🍔',
  3: '🥙',
  4: '🥤',
  5: '🍶',
  6: '🍶',
  9: '🍕'
}

// Map ProductTypeID to preparation times
const timeMap: { [key: number]: string } = {
  1: '15-20 мин',
  2: '10-15 мин',
  3: '8-12 мин',
  4: '2-5 мин',
  5: '1-2 мин',
  6: '1-2 мин',
  9: '15-20 мин'
}

// Map ProductTypeID to ratings
const ratingMap: { [key: number]: number } = {
  1: 4.8,
  2: 4.6,
  3: 4.7,
  4: 4.5,
  5: 4.3,
  6: 4.3,
  9: 4.8
}

// Function to fetch addons for a specific product type and size
export async function fetchAddons(productTypeID: number, size?: string) {
  try {
    console.log(`🔍 Fetching addons for product type: ${productTypeID}, size: ${size}`)
    
    // Special handling for pizza size-based addons
    if (productTypeID === 1 && size) {
      let meatRange: { min: number; max: number }
      let cheeseRange: { min: number; max: number }
      let addonRange: { min: number; max: number }
      
      if (size.toLowerCase().includes('малка') || size.toLowerCase().includes('small')) {
        meatRange = { min: 800, max: 899 }
        cheeseRange = { min: 700, max: 799 }
        addonRange = { min: 600, max: 699 }
      } else if (size.toLowerCase().includes('голяма') || size.toLowerCase().includes('large')) {
        meatRange = { min: 8000, max: 8999 }
        cheeseRange = { min: 7000, max: 7999 }
        addonRange = { min: 6000, max: 6999 }
      } else {
        // Default to small pizza addons if size is not recognized
        meatRange = { min: 800, max: 899 }
        cheeseRange = { min: 700, max: 799 }
        addonRange = { min: 600, max: 699 }
      }
      
      console.log(`🍕 Fetching pizza addons for ${size} pizza (Meat: ${meatRange.min}-${meatRange.max}, Cheese: ${cheeseRange.min}-${cheeseRange.max}, Addons: ${addonRange.min}-${addonRange.max})`)
      
      // Fetch meat, cheese, and addon addons
      const { data: pizzaAddons, error: pizzaError } = await supabase
        .from('Addon')
        .select('*')
        .or(`and(AddonID.gte.${meatRange.min},AddonID.lte.${meatRange.max}),and(AddonID.gte.${cheeseRange.min},AddonID.lte.${cheeseRange.max}),and(AddonID.gte.${addonRange.min},AddonID.lte.${addonRange.max})`)
      
      if (pizzaError) {
        console.error('Error fetching pizza addons:', pizzaError)
        return []
      }
      
      if (!pizzaAddons) return []
      
      console.log(`🔍 Raw pizza addons from DB for ${size}:`, pizzaAddons.map(a => ({ id: a.AddonID, name: a.Name, price: a.Price })))
      
      // Transform to our interface format
      const transformedPizzaAddons: any[] = pizzaAddons.map(addon => {
        let addonType = 'meat'
        let addonTypeBG = 'колбаси'
        
        // Determine addon type based on ID range
        if (size.toLowerCase().includes('малка') || size.toLowerCase().includes('small')) {
          if (addon.AddonID >= 700 && addon.AddonID <= 799) {
            addonType = 'cheese'
            addonTypeBG = 'сирена'
          } else if (addon.AddonID >= 600 && addon.AddonID <= 699) {
            addonType = 'pizza-addon'
            addonTypeBG = 'добавки'
          }
        } else if (size.toLowerCase().includes('голяма') || size.toLowerCase().includes('large')) {
          if (addon.AddonID >= 7000 && addon.AddonID <= 7999) {
            addonType = 'cheese'
            addonTypeBG = 'сирена'
          } else if (addon.AddonID >= 6000 && addon.AddonID <= 6999) {
            addonType = 'pizza-addon'
            addonTypeBG = 'добавки'
          }
        }
        
        return {
          AddonID: addon.AddonID,
          Name: addon.Name,
          Price: addon.Price || 0,
          ProductTypeID: addon.ProductTypeID,
          AddonType: addonType,
          AddonTypeBG: addonTypeBG
        }
      })
      
      console.log(`✅ Transformed pizza addons for ${size}:`, transformedPizzaAddons)
      console.log(`📊 Addon breakdown:`, {
        total: transformedPizzaAddons.length,
        meat: transformedPizzaAddons.filter(a => a.AddonType === 'meat').length,
        cheese: transformedPizzaAddons.filter(a => a.AddonType === 'cheese').length,
        'pizza-addon': transformedPizzaAddons.filter(a => a.AddonType === 'pizza-addon').length,
        meatAddons: transformedPizzaAddons.filter(a => a.AddonType === 'meat').map(a => ({ id: a.AddonID, name: a.Name })),
        cheeseAddons: transformedPizzaAddons.filter(a => a.AddonType === 'cheese').map(a => ({ id: a.AddonID, name: a.Name })),
        pizzaAddonAddons: transformedPizzaAddons.filter(a => a.AddonType === 'pizza-addon').map(a => ({ id: a.AddonID, name: a.Name }))
      })
      return transformedPizzaAddons
    }
    
    // Original logic for non-pizza products (burgers, doners)
    // First, get the AddonIDs that are linked to this specific product type
    const { data: linkedAddons, error: linkError } = await supabase
      .from('LkProductTypeAddons')
      .select('AddonID')
      .eq('ProductTypeID', productTypeID)
    
    if (linkError) {
      console.error('Error fetching linked addons:', linkError)
      return []
    }
    
    if (!linkedAddons || linkedAddons.length === 0) {
      console.log(`No linked addons found for product type ${productTypeID}, using fallback addons`)
      // Fallback: get all available addons (sauces and vegetables) for all product types
      const { data: fallbackAddons, error: fallbackError } = await supabase
        .from('Addon')
        .select('*')
        .in('ProductTypeID', [5, 6]) // Only sauces (5) and vegetables (6)
      
      if (fallbackError) {
        console.error('Error fetching fallback addons:', fallbackError)
        return []
      }
      
      if (!fallbackAddons) return []
      
      // Transform to our interface format
      const transformedFallbackAddons: any[] = fallbackAddons.map(addon => ({
        AddonID: addon.AddonID,
        Name: addon.Name,
        Price: addon.Price || 0,
        ProductTypeID: addon.ProductTypeID,
        AddonType: addon.ProductTypeID === 5 ? 'sauce' : 'vegetable',
        AddonTypeBG: addon.ProductTypeID === 5 ? 'сосове' : 'салати'
      }))
      
      console.log(`✅ Using fallback addons for product type ${productTypeID}:`, transformedFallbackAddons)
      return transformedFallbackAddons
    }
    
    const addonIDs = linkedAddons.map(item => item.AddonID)
    console.log(`Found linked AddonIDs for product type ${productTypeID}:`, addonIDs)
    
    // Now fetch the actual addon details from Addons
    const { data: addons, error: addonError } = await supabase
      .from('Addon')
      .select('*')
      .in('AddonID', addonIDs)
      .in('ProductTypeID', [5, 6]) // Only sauces (5) and vegetables (6)
    
    if (addonError) {
      console.error('Error fetching addon details:', addonError)
      return []
    }
    
    if (!addons) return []
    
    // Transform to our interface format
    const transformedAddons: any[] = addons.map(addon => ({
      AddonID: addon.AddonID,
      Name: addon.Name,
      Price: addon.Price || 0,
      ProductTypeID: addon.ProductTypeID,
      AddonType: addon.ProductTypeID === 5 ? 'sauce' : 'vegetable',
      AddonTypeBG: addon.ProductTypeID === 5 ? 'сосове' : 'салати'
    }))
    
    console.log(`✅ Transformed addons for product type ${productTypeID}:`, transformedAddons)
    return transformedAddons
    
  } catch (error) {
    console.error('Error in fetchAddons:', error)
    return []
  }
}

export async function fetchMenuData() {
  try {
    console.log('🔍 Fetching menu data from Supabase...')
    console.log('🔑 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔑 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // Test connection first
    console.log('🧪 Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('Product')
      .select('count')
      .limit(1)
    
    console.log('🧪 Test query result:', testData)
    console.log('🧪 Test query error:', testError)
    
    // Fetch all products from the Product table
    const { data: products, error } = await supabase
      .from('Product')
      .select('*')
      .eq('IsDisabled', 0)
      .or('isDeleted.eq.false,isDeleted.is.null')
      .order('ProductTypeID', { ascending: true })
      .order('Product', { ascending: true })

    console.log('📊 Raw products from database:', products)
    console.log('❌ Any errors:', error)
    console.log('🔢 Products array length:', products?.length || 0)

    if (error) {
      console.error('Error fetching products:', error)
      console.log('🔄 Using fallback data due to error')
      return getFallbackMenuData()
    }

    if (!products) {
      console.log('⚠️ No products returned from database')
      console.log('🔄 Using fallback data due to no products')
      return getFallbackMenuData()
    }

    if (products.length === 0) {
      console.log('⚠️ Products array is empty')
      console.log('🔄 Using fallback data due to empty products')
      return getFallbackMenuData()
    }

    console.log(`✅ Found ${products.length} products in database`)

    // Transform database data to menu format
    const menuData: { [key: string]: MenuItem[] } = {
      pizza: [],
      burgers: [],
      doners: [],
      drinks: [],
      sauces: []
    }

    products.forEach((product: any, index: number) => {
      const category = categoryMap[product.ProductTypeID]
      console.log(`🍽️ Processing product: ${product.Product} (TypeID: ${product.ProductTypeID} → Category: ${category})`)
      
      if (!category) {
        console.log(`⚠️ Skipping product ${product.Product} - unknown ProductTypeID: ${product.ProductTypeID}`)
        return
      }

      // Use ImageURL from database if available, otherwise fallback to emoji
      let selectedImage = emojiMap[product.ProductTypeID] || '🍽️'
      
      if (product.ImageURL && product.ImageURL.trim() !== '') {
        // Use the actual image URL from the database
        selectedImage = product.ImageURL
        console.log(`🖼️ Product ${product.Product}: Using database image URL: ${product.ImageURL}`)
      } else {
        // Fallback to emoji if no image URL in database
        console.log(`🖼️ Product ${product.Product}: No image URL in database, using emoji: ${selectedImage}`)
      }

      // Determine base price - for burgers and drinks, use the first available price
      let basePrice = product.SmallPrice
      if (category === 'burgers' || category === 'drinks') {
        // For burgers and drinks, use the first available price
        if (product.SmallPrice && product.SmallPrice > 0) {
          basePrice = product.SmallPrice
        } else if (product.MediumPrice && product.MediumPrice > 0) {
          basePrice = product.MediumPrice
        } else if (product.LargePrice && product.LargePrice > 0) {
          basePrice = product.LargePrice
        } else {
          basePrice = 0 // Fallback
        }
      }

      const menuItem: MenuItem = {
        id: product.ProductID,
        name: product.Product,
        basePrice: basePrice,
        image: selectedImage,
        category,
        rating: ratingMap[product.ProductTypeID] || 4.5,
        time: timeMap[product.ProductTypeID] || '10-15 мин',
        description: product.Description || null,
        sizes: [],
        smallPrice: product.SmallPrice,
        mediumPrice: product.MediumPrice || null,
        largePrice: product.LargePrice || null,
        smallWeight: product.SmallWeight || null,
        mediumWeight: product.MediumWeight || null,
        largeWeight: product.LargeWeight || null,
        addons: [] // Initialize addons array
      }

      // Debug drinks specifically
      if (category === 'drinks') {
        console.log('🥤 Drink product data:', {
          name: product.Product,
          ProductTypeID: product.ProductTypeID,
          SmallPrice: product.SmallPrice,
          MediumPrice: product.MediumPrice,
          LargePrice: product.LargePrice,
          menuItem: {
            basePrice: menuItem.basePrice,
            smallPrice: menuItem.smallPrice,
            mediumPrice: menuItem.mediumPrice,
            largePrice: menuItem.largePrice
          }
        })
      }

      // Create sizes dynamically based on available prices in database
      // No hardcoded size names - let the database control everything
      const availableSizes: Array<{ name: string; price: number; multiplier: number; weight?: number | null }> = []
      
      // Only create sizes for items that need size selection (pizzas and doners)
      if (category === 'pizza' || category === 'doners') {
        // Determine size names based on product category (Bulgarian grammar)
        const isPizza = category === 'pizza'
        
        // Add Small size if available in database
        if (product.SmallPrice && product.SmallPrice > 0) {
          availableSizes.push({
            name: isPizza ? 'Малка' : 'Малък',
            price: product.SmallPrice,
            multiplier: 1.0,
            weight: product.SmallWeight || null
          })
        }
        
        // Add Medium size if available in database
        if (product.MediumPrice && product.MediumPrice > 0) {
          availableSizes.push({
            name: isPizza ? 'Средна' : 'Среден',
            price: product.MediumPrice,
            multiplier: product.MediumPrice / (product.SmallPrice || 1),
            weight: product.MediumWeight || null
          })
        }
        
        // Add Large size if available in database
        if (product.LargePrice && product.LargePrice > 0) {
          availableSizes.push({
            name: isPizza ? 'Голяма' : 'Голям',
            price: product.LargePrice,
            multiplier: product.LargePrice / (product.SmallPrice || 1),
            weight: product.LargeWeight || null
          })
        }
      }
      
      // Assign the dynamically created sizes (empty array for burgers and drinks)
      menuItem.sizes = availableSizes

      menuData[category].push(menuItem)
      console.log(`✅ Added ${product.Product} to ${category} category`)
    })

    // Now fetch addons for each product type individually
    console.log('🎯 Fetching addons for each product type...')
    
    // Pizza addons will be fetched dynamically based on size selection
    // So we initialize with empty addons for pizzas
    if (menuData.pizza.length > 0) {
      console.log('🍕 Pizza addons will be fetched dynamically based on size')
      menuData.pizza.forEach(item => {
        item.addons = [] // Empty initially, will be populated when size is selected
      })
    }
    
    // Fetch addons for burgers (ProductTypeID = 2)
    if (menuData.burgers.length > 0) {
      const burgerAddons = await fetchAddons(2)
      console.log('🍔 Burger addons:', burgerAddons)
      menuData.burgers.forEach(item => {
        item.addons = burgerAddons
      })
    }
    
    // Fetch addons for doners (ProductTypeID = 3)
    if (menuData.doners.length > 0) {
      const donerAddons = await fetchAddons(3)
      console.log('🥙 Doner addons:', donerAddons)
      menuData.doners.forEach(item => {
        item.addons = donerAddons
      })
    }

    console.log('🎯 Final menu data structure:', menuData)
    console.log(`📊 Category counts: Pizza: ${menuData.pizza.length}, Burgers: ${menuData.burgers.length}, Doners: ${menuData.doners.length}, Drinks: ${menuData.drinks.length}`)

    return menuData
  } catch (error) {
    console.error('Error in fetchMenuData:', error)
    return getFallbackMenuData()
  }
}

// Fallback data in case of database errors
function getFallbackMenuData() {
  // Return empty data instead of hardcoded duplicates
  return {
    pizza: [],
    burgers: [],
    doners: [],
    drinks: []
  }
}
