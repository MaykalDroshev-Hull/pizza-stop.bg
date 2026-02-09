/**
 * Server-side price calculation and validation
 * NEVER trust client-calculated prices
 */

import { createServerClient } from '@/lib/supabase'

export interface ValidatedOrderItem {
  productId: number | null // null for 50/50 pizzas which don't have a single ProductID
  productName: string
  productPrice?: number
  basePrice?: number // For 50/50 pizzas
  size: string
  quantity: number
  addons: Array<{
    AddonID: number
    Name: string
    Price: number
  }>
  addonTotal: number
  itemTotal: number
  comment?: string
}

export interface PriceCalculationResult {
  validatedItems: ValidatedOrderItem[]
  itemsTotal: number
  deliveryCost: number
  totalPrice: number
  warnings: string[]
}

/**
 * Check if a point is inside a polygon
 */
function isPointInPolygon(point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>): boolean {
  const { lat, lng } = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { lat: lati, lng: lngi } = polygon[i]
    const { lat: latj, lng: lngj } = polygon[j]
    
    if (((lngi > lng) !== (lngj > lng)) && 
        (lat < (latj - lati) * (lng - lngi) / (lngj - lngi) + lati)) {
      inside = !inside
    }
  }
  
  return inside
}

/**
 * Get delivery zone based on coordinates
 */
function getDeliveryZone(coordinates: { lat: number; lng: number }): 'yellow' | 'blue' | 'outside' {
  // Define Lovech city area (3 BGN delivery) - Yellow zone
  const lovechArea = [
    { lat: 43.12525, lng: 24.71518 },
    { lat: 43.12970, lng: 24.70579 },
    { lat: 43.13005, lng: 24.69994 },
    { lat: 43.12483, lng: 24.68928 },
    { lat: 43.12299, lng: 24.67855 },
    { lat: 43.13595, lng: 24.67501 },
    { lat: 43.14063, lng: 24.67991 },
    { lat: 43.14337, lng: 24.67877 },
    { lat: 43.14687, lng: 24.67553 },
    { lat: 43.15432, lng: 24.68221 },
    { lat: 43.15486, lng: 24.68312 },
    { lat: 43.15629, lng: 24.69245 },
    { lat: 43.15968, lng: 24.70306 },
    { lat: 43.16907, lng: 24.72538 },
    { lat: 43.15901, lng: 24.74022 },
    { lat: 43.15548, lng: 24.73935 },
    { lat: 43.14960, lng: 24.73785 },
    { lat: 43.13553, lng: 24.73599 },
    { lat: 43.13952, lng: 24.72210 },
    { lat: 43.12939, lng: 24.72549 }
  ]
  
  // Define extended area (7 BGN delivery) - Blue zone
  const extendedArea = [
    { lat: 43.19740, lng: 24.67377 },
    { lat: 43.19530, lng: 24.68420 },
    { lat: 43.18795, lng: 24.69091 },
    { lat: 43.18184, lng: 24.69271 },
    { lat: 43.16906, lng: 24.70673 },
    { lat: 43.18185, lng: 24.73747 },
    { lat: 43.19690, lng: 24.78520 },
    { lat: 43.19429, lng: 24.78849 },
    { lat: 43.19177, lng: 24.79354 },
    { lat: 43.18216, lng: 24.77405 },
    { lat: 43.15513, lng: 24.78379 },
    { lat: 43.14733, lng: 24.78212 },
    { lat: 43.14837, lng: 24.76925 },
    { lat: 43.14629, lng: 24.74900 },
    { lat: 43.13578, lng: 24.74945 },
    { lat: 43.12876, lng: 24.76489 },
    { lat: 43.12203, lng: 24.75945 },
    { lat: 43.11969, lng: 24.76062 },
    { lat: 43.10933, lng: 24.75319 },
    { lat: 43.10442, lng: 24.75046 },
    { lat: 43.09460, lng: 24.75211 },
    { lat: 43.09237, lng: 24.74715 },
    { lat: 43.09868, lng: 24.73602 },
    { lat: 43.10296, lng: 24.72085 },
    { lat: 43.10702, lng: 24.70585 },
    { lat: 43.11009, lng: 24.70742 },
    { lat: 43.11222, lng: 24.71048 },
    { lat: 43.12163, lng: 24.70547 },
    { lat: 43.12097, lng: 24.67849 },
    { lat: 43.14318, lng: 24.67233 },
    { lat: 43.15453, lng: 24.68183 },
    { lat: 43.15655, lng: 24.68643 },
    { lat: 43.16302, lng: 24.69263 },
    { lat: 43.17894, lng: 24.67871 },
    { lat: 43.17927, lng: 24.65107 },
    { lat: 43.18665, lng: 24.64179 },
    { lat: 43.19006, lng: 24.64309 },
    { lat: 43.19788, lng: 24.64881 }
  ]
  
  // Check if coordinates are inside Lovech city area (yellow zone - 3 BGN)
  const isInLovechArea = isPointInPolygon(coordinates, lovechArea)
  
  // Check if coordinates are inside extended area (blue zone - 7 BGN)
  const isInExtendedArea = isPointInPolygon(coordinates, extendedArea)
  
  if (isInLovechArea) {
    return 'yellow' // Lovech city area - 3 € delivery
  } else if (isInExtendedArea) {
    return 'blue' // Extended area - 7 € delivery
  } else {
    return 'outside' // Outside delivery area - no delivery
  }
}

/**
 * Calculate delivery cost based on zone
 */
function calculateDeliveryCost(
  isCollection: boolean,
  coordinates?: { lat: number; lng: number }
): number {
  if (isCollection) {
    return 0
  }
  
  if (!coordinates) {
    console.warn('No coordinates provided for delivery cost calculation, using default 3 €')
    return 3.00 // Default to yellow zone price
  }
  
  const zone = getDeliveryZone(coordinates)
  
  switch (zone) {
    case 'yellow':
      return 3.00 // Lovech city area
    case 'blue':
      return 7.00 // Extended area
    case 'outside':
      return 0 // No delivery available (should be handled by frontend)
    default:
      return 3.00 // Default fallback
  }
}

/**
 * Main server-side price calculation
 * Fetches all prices from database and validates
 */
export async function calculateServerSidePrice(
  orderItems: any[],
  isCollection: boolean,
  coordinates?: { lat: number; lng: number }
): Promise<PriceCalculationResult> {
  const supabase = createServerClient()
  const validatedItems: ValidatedOrderItem[] = []
  const warnings: string[] = []
  let totalItemsPrice = 0


  for (const item of orderItems) {
    try {
 
      
      // Special handling for 50/50 pizzas - they don't exist in Product table
      if (item.category === 'pizza-5050') {
        
        // For 50/50 pizzas, we trust the client's base price (already calculated from two halves)
        // but we still validate and calculate addon prices
        let addonTotal = 0
        const validatedAddons: Array<{ AddonID: number; Name: string; Price: number }> = []
        
        if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
          const addonIds = item.addons.map((addon: any) => 
            typeof addon === 'number' ? addon : (addon.AddonID || addon.id)
          ).filter((id: any) => id)
          
          if (addonIds.length > 0) {
            const { data: addons, error: addonError } = await supabase
              .from('Addon')
              .select('AddonID, Name, Price, ProductTypeID')
              .in('AddonID', addonIds)
            
            if (!addonError && addons) {
              // For pizzas, all addons are paid
              addonTotal = addons.reduce((sum, addon) => sum + (addon.Price || 0), 0)
              
              addons.forEach(addon => {
                validatedAddons.push({
                  AddonID: addon.AddonID,
                  Name: addon.Name,
                  Price: addon.Price || 0
                })
              })
            }
          }
        }
        
        const itemTotal = (item.price + addonTotal) * item.quantity
        totalItemsPrice += itemTotal
        
        validatedItems.push({
          productId: null, // 50/50 pizzas don't have a single ProductID
          productName: item.name,
          size: item.size,
          quantity: item.quantity,
          basePrice: item.price,
          addons: validatedAddons,
          addonTotal,
          itemTotal,
          comment: item.comment
        })
        
       
        
        continue // Skip regular product lookup
      }
      
      // 1. Fetch product from database by ID
      // Use productId if available, otherwise extract from composite ID (e.g., "38_1761128826863" -> 38)
      let productIdToLookup = item.productId
      if (!productIdToLookup) {
        // Extract numeric part from composite IDs like "38_1761128826863"
        const idStr = String(item.id)
        if (idStr.includes('_')) {
          productIdToLookup = parseInt(idStr.split('_')[0])
        } else {
          productIdToLookup = item.id
        }
      }
            
      const { data: product, error: productError } = await supabase
        .from('Product')
        .select('ProductID, Product, SmallPrice, MediumPrice, LargePrice, IsDisabled')
        .eq('ProductID', productIdToLookup)
        .single()

      if (productError || !product) {
     
        warnings.push(`Product ID ${productIdToLookup} not found`)
        continue
      }

      if (product.IsDisabled === 1) {
        warnings.push(`Product ${product.Product} is currently disabled`)
        continue
      }
      
      
      // 2. Get correct price based on size
      let productPrice = 0
      const sizeLower = (item.size || '').toLowerCase()
      
      
      if (sizeLower.includes('малка') || sizeLower.includes('малък')) {
        productPrice = product.SmallPrice || product.MediumPrice || product.LargePrice || 0
      } else if (sizeLower.includes('средна') || sizeLower.includes('среден')) {
        productPrice = product.MediumPrice || product.SmallPrice || product.LargePrice || 0
      } else if (sizeLower.includes('голяма') || sizeLower.includes('голям')) {
        productPrice = product.LargePrice || product.MediumPrice || product.SmallPrice || 0
      } else {
        // No size or unrecognized size - use any available price
        productPrice = product.SmallPrice || product.MediumPrice || product.LargePrice || 0
      }

      if (productPrice === 0) {
        warnings.push(`Product ${product.Product} has no valid price`)
        continue
      }

      // 3. Validate and calculate addon prices from database
      let addonTotal = 0
      const validatedAddons: Array<{ AddonID: number; Name: string; Price: number }> = []

      
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        
        // Extract addon IDs (handle both {AddonID: X} and direct ID formats)
        const addonIds = item.addons.map((addon: any) => 
          typeof addon === 'number' ? addon : (addon.AddonID || addon.id)
        ).filter((id: any) => id)


        if (addonIds.length > 0) {
          const { data: addons, error: addonError } = await supabase
            .from('Addon')
            .select('AddonID, Name, Price, ProductTypeID')
            .in('AddonID', addonIds)

          if (addonError) console.error(`   Addon error:`, addonError)

          if (!addonError && addons) {
            // Store validated addons with database-provided ProductTypeID (NEVER trust client for pricing logic)
            const enrichedAddons = addons.map(dbAddon => {
              return {
                AddonID: dbAddon.AddonID,
                Name: dbAddon.Name,
                Price: dbAddon.Price || 0,
                ProductTypeID: dbAddon.ProductTypeID // Use database value for security
              }
            })
            
            enrichedAddons.forEach(addon => {
              validatedAddons.push({
                AddonID: addon.AddonID,
                Name: addon.Name,
                Price: addon.Price
              })
            })
            
            
            // Calculate addon total using database ProductTypeID
            // For pizzas (including 50/50), all addons are paid
            if (item.category === 'pizza' || item.category === 'pizza-5050') {
              addonTotal = enrichedAddons.reduce((sum, addon) => sum + (addon.Price || 0), 0)
            } else {
              // For other products (burgers, doners, sauces), first 3 of each type are free
              const addonBreakdown = enrichedAddons
                .map((addon: any) => {
                  const addonPrice = addon.Price || 0
                  const productTypeId = addon.ProductTypeID
                  
                  // Count how many addons of this type are selected
                  const typeSelected = enrichedAddons.filter((a: any) => a.ProductTypeID === productTypeId)
                  const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID)
                  
                  // First 3 of each type are free
                  const finalPrice = positionInType < 3 ? 0 : addonPrice
                  return finalPrice
                })
              
              addonTotal = addonBreakdown.reduce((sum: number, price: number) => sum + price, 0)
            }
          }
        }
      } 

      // 4. Calculate item total
      const itemTotal = (productPrice + addonTotal) * item.quantity
      totalItemsPrice += itemTotal

    

      // 5. Store validated item
      validatedItems.push({
        productId: product.ProductID,
        productName: product.Product,
        productPrice,
        size: item.size || 'Стандартен',
        quantity: item.quantity,
        addons: validatedAddons,
        addonTotal,
        itemTotal,
        comment: item.comment
      })

   
    } catch (error) {
      console.error(`❌❌❌ ERROR validating item ${item.id}:`, error)
      warnings.push(`Error processing item ID ${item.id}`)
    }
  }
 
  // 6. Calculate delivery cost
  const deliveryCost = calculateDeliveryCost(isCollection, coordinates)

  // 7. Calculate total
  const totalPrice = totalItemsPrice + deliveryCost

  return {
    validatedItems,
    itemsTotal: totalItemsPrice,
    deliveryCost,
    totalPrice,
    warnings
  }
}

/**
 * Validate that client price matches server price
 * Helps detect manipulation attempts
 */
export function validatePriceMatch(
  clientTotal: number,
  serverTotal: number,
  orderId?: number
): { isValid: boolean; difference: number } {
  const difference = Math.abs(clientTotal - serverTotal)
  const threshold = 0.10 // 10 cents tolerance for rounding

  if (difference > threshold) {
    console.error('🚨 PRICE MISMATCH DETECTED!', {
      orderId,
      clientTotal,
      serverTotal,
      difference,
      timestamp: new Date().toISOString()
    })

    // TODO: Send alert to monitoring system
    // TODO: Flag order for manual review

    return { isValid: false, difference }
  }

  return { isValid: true, difference: 0 }
}

/**
 * Convert EUR price to BGN using fixed conversion rate
 * Rate: 1 EUR = 1.9558 BGN
 */
export function convertToBGN(eurPrice: number): number {
  return eurPrice * 1.9558
}

/**
 * Format BGN price for display
 * Returns formatted string with лв. suffix
 */
export function formatBGNPrice(bgnPrice: number): string {
  return `${bgnPrice.toFixed(2)} лв.`
}

/**
 * Get both EUR and BGN formatted prices for display
 * Returns object with both formatted prices
 */
export function getDualCurrencyDisplay(eurPrice: number): {
  eur: string
  bgn: string
  bgnValue: number
} {
  const bgnValue = convertToBGN(eurPrice)
  return {
    eur: `€ ${eurPrice.toFixed(2)}`,
    bgn: formatBGNPrice(bgnValue),
    bgnValue
  }
}
