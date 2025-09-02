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
  sizes: Array<{
    name: string
    price: number
    multiplier: number
  }>
  smallPrice: number
  mediumPrice: number | null
  largePrice: number | null
  addons: any[]
}

// Map ProductTypeID to category keys
const categoryMap: { [key: number]: string } = {
  1: 'pizza',
  2: 'burgers', 
  3: 'doners',
  4: 'drinks',
  5: 'drinks'
}

// Map ProductTypeID to emojis
const emojiMap: { [key: number]: string } = {
  1: '🍕',
  2: '🍔',
  3: '🥙',
  4: '🥤',
  5: '🧃'
}

// Map ProductTypeID to preparation times
const timeMap: { [key: number]: string } = {
  1: '15-20 мин',
  2: '10-15 мин',
  3: '8-12 мин',
  4: '2-5 мин',
  5: '2-5 мин'
}

// Map ProductTypeID to ratings
const ratingMap: { [key: number]: number } = {
  1: 4.8,
  2: 4.6,
  3: 4.7,
  4: 4.5,
  5: 4.5
}

// Function to fetch addons for a specific product type
export async function fetchAddons(productTypeID: number) {
  try {
    console.log(`🔍 Fetching addons for product type: ${productTypeID}`)
    
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
      console.log(`No linked addons found for product type ${productTypeID}`)
      return []
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
      drinks: []
    }

    products.forEach((product: any) => {
      const category = categoryMap[product.ProductTypeID]
      console.log(`🍽️ Processing product: ${product.Product} (TypeID: ${product.ProductTypeID} → Category: ${category})`)
      
      if (!category) {
        console.log(`⚠️ Skipping product ${product.Product} - unknown ProductTypeID: ${product.ProductTypeID}`)
        return
      }

      const menuItem: MenuItem = {
        id: product.ProductID,
        name: product.Product,
        basePrice: product.SmallPrice,
        image: emojiMap[product.ProductTypeID] || '🍽️',
        category,
        rating: ratingMap[product.ProductTypeID] || 4.5,
        time: timeMap[product.ProductTypeID] || '10-15 мин',
        sizes: [],
        smallPrice: product.SmallPrice,
        mediumPrice: product.MediumPrice || null,
        largePrice: product.LargePrice || null,
        addons: [] // Initialize addons array
      }

      // Create sizes dynamically based on available prices in database
      // No hardcoded size names - let the database control everything
      const availableSizes: Array<{ name: string; price: number; multiplier: number }> = []
      
      // Determine size names based on product category (Bulgarian grammar)
      const isPizza = category === 'pizza'
      
      // Always add Small size (required)
      availableSizes.push({
        name: isPizza ? 'Малка' : 'Малък',
        price: product.SmallPrice,
        multiplier: 1.0
      })
      
      // Add Medium size if available in database
      if (product.MediumPrice && product.MediumPrice > 0) {
        availableSizes.push({
          name: isPizza ? 'Средна' : 'Среден',
          price: product.MediumPrice,
          multiplier: product.MediumPrice / product.SmallPrice
        })
      }
      
      // Add Large size if available in database
      if (product.LargePrice && product.LargePrice > 0) {
        availableSizes.push({
          name: isPizza ? 'Голяма' : 'Голям',
          price: product.LargePrice,
          multiplier: product.LargePrice / product.SmallPrice
        })
      }
      
      // Assign the dynamically created sizes
      menuItem.sizes = availableSizes

      menuData[category].push(menuItem)
      console.log(`✅ Added ${product.Product} to ${category} category`)
    })

    // Now fetch addons for each product type individually
    console.log('🎯 Fetching addons for each product type...')
    
    // Fetch addons for pizza (ProductTypeID = 1)
    if (menuData.pizza.length > 0) {
      const pizzaAddons = await fetchAddons(1)
      console.log('🍕 Pizza addons:', pizzaAddons)
      menuData.pizza.forEach(item => {
        item.addons = pizzaAddons
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
