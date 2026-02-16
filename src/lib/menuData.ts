import { supabase, Product } from './supabase'

// Database types based on your structure
export interface ProductAddon {
  AddonID: number
  Name: string
  Price: number
  AddonType: string
  ProductTypeID: number
  SizeCategory?: string | null
  AddonTypeBG?: string
}

export interface MenuItem {
  id: number
  name: string
  basePrice: number
  image: string
  secondImage?: string | null // Second image for hover effect
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
  isNoAddOns?: boolean
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

// AddonType to Bulgarian label mapping
const addonTypeBGMap: { [key: string]: string } = {
  'sauce': 'сосове',
  'vegetable': 'салати',
  'meat': 'колбаси',
  'cheese': 'сирена',
  'pizza-addon': 'добавки'
}

/**
 * Fetch addons for a specific product type and size.
 * Uses AddonType and SizeCategory columns from the database — NO hardcoded ID ranges.
 * Also supports per-product addon assignment via LkProductAddon table.
 */
export async function fetchAddons(productTypeID: number, size?: string) {
  try {
    // Special handling for pizza size-based addons
    if (productTypeID === 1 && size) {
      // Determine SizeCategory from size name
      let sizeCategory = 'small'
      if (size.toLowerCase().includes('голяма') || size.toLowerCase().includes('large')) {
        sizeCategory = 'large'
      }
      
      // Fetch pizza addons by AddonType + SizeCategory, excluding disabled ones
      const { data: pizzaAddons, error: pizzaError } = await supabase
        .from('Addon')
        .select('*')
        .in('AddonType', ['meat', 'cheese', 'pizza-addon'])
        .eq('SizeCategory', sizeCategory)
        .eq('IsDisabled', 0)
        .order('SortOrder', { ascending: true })
        .order('Name', { ascending: true })
      
      if (pizzaError) {
        console.error('Error fetching pizza addons:', pizzaError)
        return []
      }
      
      if (!pizzaAddons) return []
      
      return pizzaAddons.map(addon => ({
        AddonID: addon.AddonID,
        Name: addon.Name,
        Price: addon.Price || 0,
        ProductTypeID: addon.ProductTypeID,
        AddonType: addon.AddonType || 'meat',
        AddonTypeBG: addonTypeBGMap[addon.AddonType] || 'колбаси'
      }))
    }
    
    // For non-pizza products (burgers, doners):
    // Use LkProductTypeAddons (existing link table) to find assigned addons
    const { data: linkedAddons, error: linkError } = await supabase
      .from('LkProductTypeAddons')
      .select('AddonID')
      .eq('ProductTypeID', productTypeID)
    
    if (linkError) {
      console.error('Error fetching linked addons:', linkError)
      return []
    }
    
    if (!linkedAddons || linkedAddons.length === 0) {
      // No addons linked to this product type — fetch all enabled sauces and vegetables
      // using AddonType instead of hardcoded ProductTypeID
      const { data: fallbackAddons, error: fallbackError } = await supabase
        .from('Addon')
        .select('*')
        .in('AddonType', ['sauce', 'vegetable'])
        .is('SizeCategory', null)
        .eq('IsDisabled', 0)
        .order('SortOrder', { ascending: true })
        .order('Name', { ascending: true })
      
      if (fallbackError) {
        console.error('Error fetching fallback addons:', fallbackError)
        return []
      }
      
      if (!fallbackAddons) return []
      
      return fallbackAddons.map(addon => ({
        AddonID: addon.AddonID,
        Name: addon.Name,
        Price: addon.Price || 0,
        ProductTypeID: addon.ProductTypeID,
        AddonType: addon.AddonType || 'sauce',
        AddonTypeBG: addonTypeBGMap[addon.AddonType] || 'сосове'
      }))
    }
    
    const addonIDs = linkedAddons.map(item => item.AddonID)
    
    // Fetch addon details, excluding disabled ones
    const { data: addons, error: addonError } = await supabase
      .from('Addon')
      .select('*')
      .in('AddonID', addonIDs)
      .eq('IsDisabled', 0)
      .order('SortOrder', { ascending: true })
      .order('Name', { ascending: true })
    
    if (addonError) {
      console.error('Error fetching addon details:', addonError)
      return []
    }
    
    if (!addons) return []
    
    return addons.map(addon => ({
      AddonID: addon.AddonID,
      Name: addon.Name,
      Price: addon.Price || 0,
      ProductTypeID: addon.ProductTypeID,
      AddonType: addon.AddonType || 'sauce',
      AddonTypeBG: addonTypeBGMap[addon.AddonType] || 'сосове'
    }))
    
  } catch (error) {
    console.error('Error in fetchAddons:', error)
    return []
  }
}

/**
 * Fetch addons assigned to a specific product via LkProductAddon.
 * Falls back to fetchAddons(productTypeID, size) if no per-product assignments exist.
 */
export async function fetchAddonsForProduct(productId: number, productTypeID: number, size?: string) {
  try {
    // First check if there are per-product addon assignments
    const { data: productLinks, error: linkError } = await supabase
      .from('LkProductAddon')
      .select('AddonID')
      .eq('ProductID', productId)
    
    if (linkError) {
      console.error('Error fetching product addon links:', linkError)
      // Fallback to type-based fetching
      return fetchAddons(productTypeID, size)
    }
    
    if (!productLinks || productLinks.length === 0) {
      // No per-product assignments, fallback to type-based
      return fetchAddons(productTypeID, size)
    }
    
    const addonIDs = productLinks.map(link => link.AddonID)
    
    // Fetch the actual addon details, excluding disabled ones
    const { data: addons, error: addonError } = await supabase
      .from('Addon')
      .select('*')
      .in('AddonID', addonIDs)
      .eq('IsDisabled', 0)
      .order('SortOrder', { ascending: true })
      .order('Name', { ascending: true })
    
    if (addonError) {
      console.error('Error fetching addon details for product:', addonError)
      return fetchAddons(productTypeID, size)
    }
    
    if (!addons || addons.length === 0) {
      // Per-product links exist but all addons are disabled, fallback
      return fetchAddons(productTypeID, size)
    }
    
    return addons.map(addon => ({
      AddonID: addon.AddonID,
      Name: addon.Name,
      Price: addon.Price || 0,
      ProductTypeID: addon.ProductTypeID,
      AddonType: addon.AddonType || 'sauce',
      AddonTypeBG: addonTypeBGMap[addon.AddonType] || 'сосове'
    }))
    
  } catch (error) {
    console.error('Error in fetchAddonsForProduct:', error)
    return fetchAddons(productTypeID, size)
  }
}

export async function fetchMenuData() {
  try {
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('Product')
      .select('count')
      .limit(1)
    
    // Fetch all products from the Product table
    const { data: products, error } = await supabase
      .from('Product')
      .select('*')
      .eq('IsDisabled', 0)
      .or('isDeleted.eq.false,isDeleted.is.null')
      .order('ProductTypeID', { ascending: true })
      .order('SortOrder', { ascending: true })
      .order('Product', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
      return getFallbackMenuData()
    }

    if (!products) {
      return getFallbackMenuData()
    }

    if (products.length === 0) {
      return getFallbackMenuData()
    }

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
      
      if (!category) {
        return
      }

      // Use ImageURL from database if available, otherwise fallback to emoji
      let selectedImage = emojiMap[product.ProductTypeID] || '🍽️'
      let secondImage: string | null = null
      
      if (product.ImageURL && product.ImageURL.trim() !== '') {
        // Use the actual image URL from the database
        selectedImage = product.ImageURL
      } else {
        // Fallback to emoji if no image URL in database
      }

      // Get second image if available
      if (product.SecondImageURL && product.SecondImageURL.trim() !== '') {
        secondImage = product.SecondImageURL
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
        secondImage: secondImage,
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
        addons: [], // Initialize addons array
        isNoAddOns: product.IsNoAddOns || false
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
    })

    // Now fetch addons for each product type individually
    
    // Pizza addons will be fetched dynamically based on size selection
    // So we initialize with empty addons for pizzas
    if (menuData.pizza.length > 0) {
      menuData.pizza.forEach(item => {
        item.addons = [] // Empty initially, will be populated when size is selected
      })
    }
    
    // Fetch addons for burgers (ProductTypeID = 2)
    if (menuData.burgers.length > 0) {
      const burgerAddons = await fetchAddons(2)
      menuData.burgers.forEach(item => {
        item.addons = burgerAddons
      })
    }
    
    // Fetch addons for doners (ProductTypeID = 3)
    if (menuData.doners.length > 0) {
      const donerAddons = await fetchAddons(3)
      menuData.doners.forEach(item => {
        item.addons = donerAddons
      })
    }

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
    drinks: [],
    sauces: []
  }
}
