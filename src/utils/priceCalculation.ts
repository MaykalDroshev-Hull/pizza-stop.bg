/**
 * Server-side price calculation and validation
 * NEVER trust client-calculated prices
 */

import { createServerClient } from '@/lib/supabase'

export interface ValidatedOrderItem {
  productId: number
  productName: string
  productPrice: number
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
    return 'yellow' // Lovech city area - 3 лв delivery
  } else if (isInExtendedArea) {
    return 'blue' // Extended area - 7 лв delivery
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
    console.warn('No coordinates provided for delivery cost calculation, using default 3 лв')
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

  console.log('🔍🔍🔍 SERVER PRICE VALIDATION - FULL DEBUG 🔍🔍🔍')
  console.log(`Total items to process: ${orderItems.length}`)
  console.log('All items:', JSON.stringify(orderItems, null, 2))

  for (const item of orderItems) {
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`🔍 Processing item: ${item.name}`)
      console.log(`   - ID: ${item.id}`)
      console.log(`   - Category: ${item.category}`)
      console.log(`   - Size: ${item.size}`)
      console.log(`   - Quantity: ${item.quantity}`)
      console.log(`   - Base Price (client): ${item.price}`)
      console.log(`   - Addons count: ${item.addons?.length || 0}`)
      
      // 1. Fetch product from database by ID
      const { data: product, error: productError } = await supabase
        .from('Product')
        .select('ProductID, Product, SmallPrice, MediumPrice, LargePrice, IsDisabled')
        .eq('ProductID', item.id)
        .single()

      if (productError || !product) {
        console.log(`❌ SKIPPED: Product ID ${item.id} not found in database`)
        console.log(`   Error:`, productError)
        warnings.push(`Product ID ${item.id} not found`)
        continue
      }

      if (product.IsDisabled === 1) {
        console.log(`❌ SKIPPED: Product ${product.Product} is disabled`)
        warnings.push(`Product ${product.Product} is currently disabled`)
        continue
      }
      
      console.log(`✅ Found product: ${product.Product}`)
      console.log(`   - SmallPrice: ${product.SmallPrice}`)
      console.log(`   - MediumPrice: ${product.MediumPrice}`)
      console.log(`   - LargePrice: ${product.LargePrice}`)

      // 2. Get correct price based on size
      let productPrice = 0
      const sizeLower = (item.size || '').toLowerCase()
      
      console.log(`🔍 Determining price for size: "${item.size}" (lowercase: "${sizeLower}")`)
      
      if (sizeLower.includes('малка') || sizeLower.includes('малък')) {
        productPrice = product.SmallPrice || 0
        console.log(`   → Using SmallPrice: ${productPrice}`)
      } else if (sizeLower.includes('средна') || sizeLower.includes('среден')) {
        productPrice = product.MediumPrice || product.SmallPrice || 0
        console.log(`   → Using MediumPrice: ${productPrice}`)
      } else if (sizeLower.includes('голяма') || sizeLower.includes('голям')) {
        productPrice = product.LargePrice || product.SmallPrice || 0
        console.log(`   → Using LargePrice: ${productPrice}`)
      } else {
        // No size or unrecognized size - use small price
        productPrice = product.SmallPrice || 0
        console.log(`   → No/unrecognized size, using SmallPrice: ${productPrice}`)
      }

      if (productPrice === 0) {
        console.log(`❌ SKIPPED: Product ${product.Product} has no valid price`)
        warnings.push(`Product ${product.Product} has no valid price`)
        continue
      }

      // 3. Validate and calculate addon prices from database
      let addonTotal = 0
      const validatedAddons: Array<{ AddonID: number; Name: string; Price: number }> = []

      console.log(`🔍 Processing addons...`)
      
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        console.log(`   Client sent ${item.addons.length} addons:`, item.addons.map((a: any) => ({ id: a.AddonID || a.id, name: a.Name || a.name })))
        
        // Extract addon IDs (handle both {AddonID: X} and direct ID formats)
        const addonIds = item.addons.map((addon: any) => 
          typeof addon === 'number' ? addon : (addon.AddonID || addon.id)
        ).filter((id: any) => id)

        console.log(`   Extracted addon IDs:`, addonIds)

        if (addonIds.length > 0) {
          const { data: addons, error: addonError } = await supabase
            .from('Addon')
            .select('AddonID, Name, Price, AddonType')
            .in('AddonID', addonIds)

          console.log(`   Database returned ${addons?.length || 0} addons`)
          if (addonError) console.log(`   Addon error:`, addonError)

          if (!addonError && addons) {
            // Store validated addons with their types
            addons.forEach(addon => {
              validatedAddons.push({
                AddonID: addon.AddonID,
                Name: addon.Name,
                Price: addon.Price || 0
              })
              console.log(`      → ${addon.Name} (${addon.AddonType}): ${addon.Price} лв`)
            })
            
            console.log(`🔍 Calculating addon costs for category: ${item.category}`)
            
            // Calculate addon total using same logic as CartContext
            // For pizzas (including 50/50), all addons are paid
            if (item.category === 'pizza' || item.category === 'pizza-5050') {
              addonTotal = addons.reduce((sum, addon) => sum + (addon.Price || 0), 0)
              console.log(`   → Pizza: ALL addons paid = ${addonTotal} лв`)
            } else {
              // For other products (burgers, doners, sauces), first 3 of each type are free
              const addonBreakdown = addons
                .map((addon: any) => {
                  const addonPrice = addon.Price || 0
                  const addonType = addon.AddonType
                  
                  // Count how many addons of this type are selected
                  const typeSelected = addons.filter((a: any) => a.AddonType === addonType)
                  const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID)
                  
                  // First 3 of each type are free
                  const finalPrice = positionInType < 3 ? 0 : addonPrice
                  console.log(`      → ${addon.Name} (${addonType}): position ${positionInType + 1} = ${finalPrice === 0 ? 'FREE' : finalPrice + ' лв'}`)
                  return finalPrice
                })
              
              addonTotal = addonBreakdown.reduce((sum: number, price: number) => sum + price, 0)
              console.log(`   → Non-pizza: First 3/type free, total = ${addonTotal} лв`)
            }
          }
        }
      } else {
        console.log(`   No addons for this item`)
      }

      // 4. Calculate item total
      const itemTotal = (productPrice + addonTotal) * item.quantity
      totalItemsPrice += itemTotal

      console.log(`💵 Item calculation:`)
      console.log(`   Base price: ${productPrice} лв`)
      console.log(`   Addon total: ${addonTotal} лв`)
      console.log(`   Quantity: ${item.quantity}`)
      console.log(`   Item total: (${productPrice} + ${addonTotal}) × ${item.quantity} = ${itemTotal} лв`)

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

      console.log(`✅ SUCCESSFULLY VALIDATED: ${product.Product} = ${itemTotal} лв`)
      console.log(`   Running total: ${totalItemsPrice} лв`)

    } catch (error) {
      console.error(`❌❌❌ ERROR validating item ${item.id}:`, error)
      warnings.push(`Error processing item ID ${item.id}`)
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 VALIDATION SUMMARY`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Total items received: ${orderItems.length}`)
  console.log(`Successfully validated: ${validatedItems.length}`)
  console.log(`Skipped/Failed: ${orderItems.length - validatedItems.length}`)
  if (warnings.length > 0) {
    console.log(`⚠️ Warnings:`)
    warnings.forEach(w => console.log(`   - ${w}`))
  }

  // 6. Calculate delivery cost
  const deliveryCost = calculateDeliveryCost(isCollection, coordinates)

  // 7. Calculate total
  const totalPrice = totalItemsPrice + deliveryCost

  console.log(`\n💰💰💰 FINAL SERVER-SIDE PRICE CALCULATION:`)
  console.log(`   Items total: ${totalItemsPrice.toFixed(2)} лв`)
  console.log(`   Delivery: ${deliveryCost.toFixed(2)} лв`)
  console.log(`   GRAND TOTAL: ${totalPrice.toFixed(2)} лв`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

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

