import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { emailService } from '@/utils/emailService'
import { calculateServerSidePrice, validatePriceMatch } from '@/utils/priceCalculation'
import { orderConfirmationSchema } from '@/utils/zodSchemas'
import { withRateLimit, createRateLimitResponse } from '@/utils/rateLimit'

// Helper function to get payment method name
function getPaymentMethodName(paymentMethodId: number): string {
  const paymentMethods: { [key: number]: string } = {
    1: 'С карта в ресторант',
    2: 'В брой в ресторант',
    3: 'С карта на адрес',
    4: 'В брой на адрес',
    5: 'Онлайн'
  }
  return paymentMethods[paymentMethodId] || 'Неизвестен метод'
}

export async function POST(request: NextRequest) {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🆕 NEW ORDER REQUEST [${requestId}] - ${new Date().toISOString()}`)
  console.log('='.repeat(80))
  
  try {
    // Rate limiting - prevent order spam
    const rateLimit = await withRateLimit(request, 'order')
    if (!rateLimit.allowed) {
      console.log(`⛔ [${requestId}] Rate limit exceeded`)
      return createRateLimitResponse(rateLimit.headers)
    }

    // Parse and validate request body
    console.log(`📥 [${requestId}] Parsing request body...`)
    const body = await request.json()
    
    // Validate with Zod
    console.log(`✓ [${requestId}] Validating with Zod schema...`)
    const validationResult = orderConfirmationSchema.safeParse(body)
    if (!validationResult.success) {
      console.error(`❌ [${requestId}] Order validation failed:`, validationResult.error.flatten())
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        },
        { 
          status: 400,
          headers: rateLimit.headers
        }
      )
    }

    const { 
      customerInfo, 
      orderItems, 
      orderTime, 
      orderType, 
      deliveryCost, 
      totalPrice,
      isCollection = false,
      paymentMethodId,
      loginId = null // For logged-in users
    } = validationResult.data

    console.log(`✅ [${requestId}] Validation passed`)
    console.log(`📦 [${requestId}] Order details:`)
    console.log(`   - Customer: ${customerInfo.name} (${customerInfo.email})`)
    console.log(`   - Items: ${orderItems?.length || 0} items`)
    console.log(`   - Total: ${totalPrice} лв + ${deliveryCost} лв delivery = ${totalPrice + deliveryCost} лв`)
    console.log(`   - Type: ${isCollection ? 'Collection' : 'Delivery'}`)
    console.log(`   - Payment: Method ${paymentMethodId}`)
    console.log(`   - Login ID: ${loginId || 'Guest'}`)
    
    // Log each item for debugging
    if (orderItems && orderItems.length > 0) {
      console.log(`📋 [${requestId}] Order items breakdown:`)
      orderItems.forEach((item: any, index: number) => {
        console.log(`   ${index + 1}. ${item.name} x${item.quantity} - ${item.price} лв (${item.category || 'unknown'})`)
        if (item.addons && item.addons.length > 0) {
          console.log(`      Addons: ${item.addons.map((a: any) => a.Name || a.name).join(', ')}`)
        }
      })
    }

    // Create server-side Supabase client (bypasses RLS)
    const supabase = createServerClient()

    // ===== CRITICAL SECURITY: Server-Side Price Validation =====
    console.log('💰 Calculating and validating prices on server...')
    const priceCalculation = await calculateServerSidePrice(
      orderItems,
      isCollection,
      customerInfo.LocationCoordinates ? 
        (typeof customerInfo.LocationCoordinates === 'string' ? 
          JSON.parse(customerInfo.LocationCoordinates) : customerInfo.LocationCoordinates) 
        : undefined
    )

    // Log warnings if any products were invalid
    if (priceCalculation.warnings.length > 0) {
      console.warn('⚠️ Price calculation warnings:', priceCalculation.warnings)
    }

    // Validate client price vs server price
    const clientTotal = totalPrice + (isCollection ? 0 : deliveryCost)
    const serverTotal = priceCalculation.totalPrice
    const priceValidation = validatePriceMatch(clientTotal, serverTotal)

    if (!priceValidation.isValid) {
      console.error('🚨 SECURITY ALERT: Price mismatch detected!')
      console.error(`   Client sent: ${clientTotal} лв`)
      console.error(`   Server calculated: ${serverTotal} лв`)
      console.error(`   Difference: ${priceValidation.difference} лв`)
      
      // Log for security audit
      console.error('🚨 POTENTIAL PRICE MANIPULATION ATTEMPT:', {
        timestamp: new Date().toISOString(),
        customerEmail: customerInfo.email,
        clientTotal,
        serverTotal,
        difference: priceValidation.difference
      })
      
      // For now, continue with server price but flag for review
      // TODO: In production, you may want to reject the order
    }

    // Use SERVER-CALCULATED prices (not client prices!)
    const validatedTotalPrice = serverTotal
    const validatedDeliveryCost = priceCalculation.deliveryCost
    const validatedItemsTotal = priceCalculation.itemsTotal

    console.log('✅ Server-side price validation complete:')
    console.log(`   Items total: ${validatedItemsTotal.toFixed(2)} лв`)
    console.log(`   Delivery: ${validatedDeliveryCost.toFixed(2)} лв`)
    console.log(`   Final total: ${validatedTotalPrice.toFixed(2)} лв`)

    // Helper function to safely convert coordinates (used multiple times below)
    const safeConvertCoordinates = (coords: any): string | null => {
      if (!coords) return null
      if (typeof coords === 'string') {
        try {
          const parsed = JSON.parse(coords)
          return JSON.stringify(parsed)
        } catch (error) {
          return coords
        }
      }
      return JSON.stringify(coords)
    }

    let finalLoginId = loginId

    // Handle guest orders - create guest user in Login table only if no loginId provided
    if (!loginId) {
      console.log('👤 Creating guest user...')

      const guestUserData = {
        email: customerInfo.email || `guest_${Date.now()}@pizza-stop.bg`,
        Password: 'guest_password', // Placeholder for guests
        Name: customerInfo.name,
        phone: customerInfo.phone,
        LocationText: customerInfo.LocationText || customerInfo.address,
        LocationCoordinates: safeConvertCoordinates(customerInfo.LocationCoordinates || customerInfo.coordinates),
        NumberOfOrders: 0,
        PreferedPaymentMethodID: paymentMethodId,
        isGuest: true,
        addressInstructions: customerInfo.deliveryInstructions || null
      }

      const { data: guestUser, error: guestError } = await supabase
        .from('Login')
        .insert(guestUserData)
        .select('LoginID')
        .single()

      if (guestError) {
        console.error('❌ Error creating guest user:', guestError)
        return NextResponse.json({ error: 'Failed to create guest user' }, { status: 500 })
      }

      finalLoginId = guestUser.LoginID
      console.log('✅ Guest user created with ID:', finalLoginId)
    } else {
      console.log('👤 Using existing user profile with LoginID:', loginId)
      
      // Update user profile with latest information from checkout form
      // For collection orders, don't update user's address with restaurant address
      const updateData: any = {
        Name: customerInfo.name,
        phone: customerInfo.phone,
        PreferedPaymentMethodID: paymentMethodId
      }
      
      // Only update address-related fields for delivery orders
      if (!isCollection) {
        updateData.LocationText = customerInfo.LocationText || customerInfo.address
        updateData.LocationCoordinates = safeConvertCoordinates(customerInfo.LocationCoordinates || customerInfo.coordinates)
        updateData.addressInstructions = customerInfo.deliveryInstructions || null
      }

      const { error: updateError } = await supabase
        .from('Login')
        .update(updateData)
        .eq('LoginID', loginId)

      if (updateError) {
        console.error('❌ Error updating user profile:', updateError)
        // Don't fail the order if profile update fails, just log the error
      } else {
        console.log('✅ User profile updated successfully')
      }
    }

    // Calculate expected delivery time based on order type
    let expectedDT: Date
    const now = new Date()
    const minDeliveryTime = new Date(now.getTime() + 45 * 60 * 1000) // 45 minutes from now
    
    if (orderTime.type === 'immediate') {
      // ASAP orders: always now + 45 minutes
      expectedDT = minDeliveryTime
    } else if (orderTime.scheduledTime) {
      // Scheduled orders: use customer time but ensure it's at least 45 minutes away
      const scheduledTime = new Date(orderTime.scheduledTime)
      expectedDT = scheduledTime < minDeliveryTime ? minDeliveryTime : scheduledTime
    } else {
      // Fallback to minimum delivery time if scheduled time is missing
      expectedDT = minDeliveryTime
    }

    // Restaurant location for collection orders
    const restaurantLocation = {
      address: 'Lovech Center, ul. "Angel Kanchev" 10, 5502 Lovech, Bulgaria',
      coordinates: { lat: 43.142984, lng: 24.717785 }
    }

    // Prepare order data
    const orderData = {
      LoginID: finalLoginId,
      OrderDT: orderTime.type === 'immediate' 
        ? new Date().toISOString() 
        : (orderTime.scheduledTime ? new Date(orderTime.scheduledTime).toISOString() : new Date().toISOString()),
      OrderLocation: isCollection ? restaurantLocation.address : (customerInfo.LocationText || customerInfo.address),
      OrderLocationCoordinates: isCollection 
        ? JSON.stringify(restaurantLocation.coordinates)
        : safeConvertCoordinates(customerInfo.LocationCoordinates || customerInfo.coordinates),
      OrderStatusID: 1, // Assuming 1 = "New Order" status
      RfPaymentMethodID: paymentMethodId,
      IsPaid: false, // Orders start as unpaid
      ExpectedDT: expectedDT.toISOString(),
      OrderType: isCollection ? 1 : 2, // 1 = Restaurant collection, 2 = Delivery
      DeliveryPrice: validatedDeliveryCost, // Use server-validated delivery cost
      TotalAmount: validatedTotalPrice // Use server-validated total (SECURITY: Never trust client)
    }

    console.log('📋 Creating order with data:', orderData)

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .insert(orderData)
      .select('OrderID')
      .single()

    if (orderError) {
      console.error('❌ Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    console.log('✅ Order created with ID:', order.OrderID)

    // CRITICAL: Save order items to LkOrderProduct table
    // This is a critical step - if it fails, the order is invalid and must be deleted
    if (!orderItems || orderItems.length === 0) {
      console.error('🚨 CRITICAL ERROR: No order items provided for order', order.OrderID)
      // Delete the order we just created
      await supabase.from('Order').delete().eq('OrderID', order.OrderID)
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400, headers: rateLimit.headers }
      )
    }
    
    console.log('📦 Saving order items:', orderItems.length, 'items for order', order.OrderID)
    
    const orderItemsData: any[] = []
    
    try {
      for (const item of orderItems) {
        // Calculate addon prices with same logic as CartContext
        let addonTotal = 0
        if (item.addons && Array.isArray(item.addons)) {
          // For pizzas (including 50/50), all addons are paid
          if (item.category === 'pizza' || item.category === 'pizza-5050') {
            addonTotal = item.addons.reduce((sum: number, addon: any) => {
              return sum + (addon.Price || addon.price || 0)
            }, 0)
          } else {
            // For other products (burgers, doners, sauces), first 3 of each type are free
            const itemAddons = item.addons || []
            addonTotal = itemAddons
              .map((addon: any) => {
                const addonPrice = addon.Price || addon.price || 0
                const addonType = addon.AddonType || addon.addonType
                
                // Count how many addons of this type are selected
                const typeSelected = itemAddons.filter((a: any) => 
                  (a.AddonType || a.addonType) === addonType
                )
                const addonId = addon.AddonID || addon.addonId || addon.id
                const positionInType = typeSelected.findIndex((a: any) => 
                  (a.AddonID || a.addonId || a.id) === addonId
                )
                
                // First 3 of each type are free
                return positionInType < 3 ? 0 : addonPrice
              })
              .reduce((sum: number, price: number) => sum + price, 0)
          }
        }
        
        // Check if this is a 50/50 pizza (category: 'pizza-5050')
        if (item.category === 'pizza-5050') {
          console.log('🍕 Processing 50/50 pizza:', item.name)
          
          // Extract pizza halves from the comment
          const commentMatch = item.comment?.match(/50\/50 пица: (.+?) \/ (.+?):/)
          if (commentMatch) {
            const leftPizzaName = commentMatch[1].trim()
            const rightPizzaName = commentMatch[2].trim()
            
            // Find the actual pizza products in the database
            const { data: leftPizza } = await supabase
              .from('Product')
              .select('ProductID, Product')
              .eq('Product', leftPizzaName)
              .single()
            
            const { data: rightPizza } = await supabase
              .from('Product')
              .select('ProductID, Product')
              .eq('Product', rightPizzaName)
              .single()
            
            if (leftPizza && rightPizza) {
              // Create CompositeProduct record
              const parts = [
                {
                  ProductID: leftPizza.ProductID,
                  Name: leftPizza.Product,
                  Portion: "left",
                  UnitPrice: item.price / 2 // Approximate price per half
                },
                {
                  ProductID: rightPizza.ProductID,
                  Name: rightPizza.Product,
                  Portion: "right",
                  UnitPrice: item.price / 2 // Approximate price per half
                }
              ]
              
              const compositeProductData = {
                Size: item.size || 'Голяма',
                PricingMethod: 'max-half',
                BaseUnitPrice: item.price,
                Parts: parts,
                Addons: item.addons ? item.addons : null,
                comment: item.comment
              }
              
              const { data: compositeProduct, error: compositeError } = await supabase
                .from('CompositeProduct')
                .insert(compositeProductData)
                .select('CompositeProductID')
                .single()
              
              if (compositeError) {
                console.error('❌ Error creating CompositeProduct:', compositeError)
                // Fallback to regular product entry with addon calculation
                const itemTotal = (item.price + addonTotal) * item.quantity
                orderItemsData.push({
                  OrderID: order.OrderID,
                  ProductID: null, // No single product ID for 50/50
                  ProductName: item.name,
                  ProductSize: item.size || 'Medium',
                  Quantity: item.quantity,
                  UnitPrice: item.price,
                  TotalPrice: itemTotal,
                  Addons: item.addons ? JSON.stringify(item.addons) : null,
                  Comment: item.comment || null,
                  CompositeProductID: null
                })
              } else {
                console.log('✅ CompositeProduct created with ID:', compositeProduct.CompositeProductID)
                // Add to order items with CompositeProductID and addon calculation
                const itemTotal = (item.price + addonTotal) * item.quantity
                orderItemsData.push({
                  OrderID: order.OrderID,
                  ProductID: null, // No single product ID for composite products
                  ProductName: item.name,
                  ProductSize: item.size || 'Medium',
                  Quantity: item.quantity,
                  UnitPrice: item.price,
                  TotalPrice: itemTotal,
                  Addons: item.addons ? JSON.stringify(item.addons) : null,
                  Comment: item.comment || null,
                  CompositeProductID: compositeProduct.CompositeProductID
                })
              }
            } else {
              console.error('❌ Could not find pizza products for 50/50:', { leftPizzaName, rightPizzaName })
              // Fallback to regular product entry with addon calculation
              const itemTotal = (item.price + addonTotal) * item.quantity
              orderItemsData.push({
                OrderID: order.OrderID,
                ProductID: null,
                ProductName: item.name,
                ProductSize: item.size || 'Medium',
                Quantity: item.quantity,
                UnitPrice: item.price,
                TotalPrice: itemTotal,
                Addons: item.addons ? JSON.stringify(item.addons) : null,
                Comment: item.comment || null,
                CompositeProductID: null
              })
            }
          } else {
            console.error('❌ Could not parse 50/50 pizza comment:', item.comment)
            // Fallback to regular product entry with addon calculation
            const itemTotal = (item.price + addonTotal) * item.quantity
            orderItemsData.push({
              OrderID: order.OrderID,
              ProductID: null,
              ProductName: item.name,
              ProductSize: item.size || 'Medium',
              Quantity: item.quantity,
              UnitPrice: item.price,
              TotalPrice: itemTotal,
              Addons: item.addons ? JSON.stringify(item.addons) : null,
              Comment: item.comment || null,
              CompositeProductID: null
            })
          }
        } else {
          // Regular product with addon calculation
          const itemTotal = (item.price + addonTotal) * item.quantity
          
          // Extract ProductID: handle both simple IDs and composite IDs (productId_timestamp)
          let productId = null
          if (item.productId) {
            // Use explicit productId if available
            productId = item.productId
          } else if (typeof item.id === 'number') {
            // If id is a number, use it directly
            productId = item.id
          } else if (typeof item.id === 'string' && item.id.includes('_')) {
            // If id is a string like "123_timestamp", extract the first part
            const idParts = item.id.split('_')
            productId = parseInt(idParts[0], 10)
            if (isNaN(productId)) {
              console.warn(`⚠️ Could not extract ProductID from item.id: ${item.id}`)
              productId = null
            }
          } else {
            // Try to parse string id as number
            productId = parseInt(item.id as string, 10)
            if (isNaN(productId)) {
              console.warn(`⚠️ Could not parse ProductID from item.id: ${item.id}`)
              productId = null
            }
          }
          
          console.log(`   Item "${item.name}": id=${item.id}, productId=${item.productId}, extracted=${productId}`)
          
          orderItemsData.push({
            OrderID: order.OrderID,
            ProductID: productId,
            ProductName: item.name,
            ProductSize: item.size || 'Medium',
            Quantity: item.quantity,
            UnitPrice: item.price,
            TotalPrice: itemTotal,
            Addons: item.addons ? JSON.stringify(item.addons) : null,
            Comment: item.comment || null,
            CompositeProductID: null
          })
        }
      }
      
      // Validate that we have items to insert
      if (orderItemsData.length === 0) {
        throw new Error('No valid order items to save')
      }
      
      console.log(`💾 Inserting ${orderItemsData.length} items into LkOrderProduct for order ${order.OrderID}`)
      
      const { data: insertedItems, error: itemsError } = await supabase
        .from('LkOrderProduct')
        .insert(orderItemsData)
        .select()

      if (itemsError) {
        console.error('🚨 CRITICAL ERROR saving order items:', itemsError)
        console.error('   Order ID:', order.OrderID)
        console.error('   Error details:', JSON.stringify(itemsError, null, 2))
        throw new Error(`Failed to save order items: ${itemsError.message}`)
      }
      
      console.log('✅ Order items saved successfully:', insertedItems?.length || orderItemsData.length, 'items')
      
    } catch (itemsProcessingError: any) {
      console.error('🚨 FATAL ERROR processing order items for order', order.OrderID)
      console.error('   Error:', itemsProcessingError.message)
      console.error('   Stack:', itemsProcessingError.stack)
      
      // CRITICAL: Delete the order since items couldn't be saved
      console.log('🗑️ Rolling back - deleting order', order.OrderID)
      const { error: deleteError } = await supabase
        .from('Order')
        .delete()
        .eq('OrderID', order.OrderID)
      
      if (deleteError) {
        console.error('❌ FAILED to delete order during rollback:', deleteError)
        // Log this for manual cleanup
        console.error(`⚠️ MANUAL CLEANUP REQUIRED: Order ${order.OrderID} exists without items!`)
      } else {
        console.log('✅ Order', order.OrderID, 'successfully deleted (rollback)')
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to save order items',
          details: itemsProcessingError.message 
        },
        { status: 500, headers: rateLimit.headers }
      )
    }

    // Send order confirmation email
    try {
      console.log('📧 Sending order confirmation email...')
      
      // Prepare email data
      const emailData = {
        to: customerInfo.email,
        name: customerInfo.name,
        orderId: order.OrderID.toString(),
        orderDetails: (() => {
          // Calculate email items with correct pricing
          const emailItems = orderItems.map((item: any) => {
            // Calculate addon cost for this specific item (same logic as CartContext)
            let itemAddonCost = 0
            if (item.addons && Array.isArray(item.addons)) {
              if (item.category === 'pizza' || item.category === 'pizza-5050') {
                // For pizzas, all addons are paid
                itemAddonCost = item.addons.reduce((sum: number, addon: any) => {
                  return sum + (addon.Price || addon.price || 0)
                }, 0)
              } else {
                // For other products, first 3 of each type are free
                const itemAddons = item.addons || []
                itemAddonCost = itemAddons
                  .map((addon: any) => {
                    const addonPrice = addon.Price || addon.price || 0
                    const addonType = addon.AddonType || addon.addonType
                    const typeSelected = itemAddons.filter((a: any) => 
                      (a.AddonType || a.addonType) === addonType
                    )
                    const addonId = addon.AddonID || addon.addonId || addon.id
                    const positionInType = typeSelected.findIndex((a: any) => 
                      (a.AddonID || a.addonId || a.id) === addonId
                    )
                    return positionInType < 3 ? 0 : addonPrice
                  })
                  .reduce((sum: number, price: number) => sum + price, 0)
              }
            }
            
            return {
              name: item.name,
              size: item.size,
              quantity: item.quantity,
              price: item.price + itemAddonCost,  // Include addons in displayed price
              addons: item.addons?.map((addon: any) => ({
                name: addon.Name || addon.name,
                price: addon.Price || addon.price
              })),
              comment: item.comment
            }
          })
          
          // Calculate total from email items (more reliable than server validation)
          const emailItemsTotal = emailItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          const emailTotal = emailItemsTotal + validatedDeliveryCost
          
          console.log('📧 Email price calculation:')
          console.log(`   Items total: ${emailItemsTotal.toFixed(2)} лв`)
          console.log(`   Delivery: ${validatedDeliveryCost.toFixed(2)} лв`)
          console.log(`   Email total: ${emailTotal.toFixed(2)} лв`)
          
          return {
            items: emailItems,
            totalAmount: emailTotal,  // Use email-calculated total instead of server validation
            orderTime: new Date().toLocaleString('bg-BG'),
            orderType: isCollection ? 'Вземане от ресторанта' : 'Доставка',
            paymentMethod: getPaymentMethodName(paymentMethodId),
            location: isCollection ? 'Lovech Center, ul. "Angel Kanchev" 10, 5502 Lovech, Bulgaria' : (customerInfo.LocationText || customerInfo.address || 'Адрес не е указан'),
            estimatedTime: expectedDT.toLocaleString('bg-BG', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        })()
      }

      await emailService.sendOrderConfirmationEmail(emailData)
      console.log('✅ Order confirmation email sent successfully')
      
      // For pickup orders, also send ready time email
      if (isCollection) {
        try {
          console.log('📧 Sending pickup ready time email...')
          
          // Calculate ready time (e.g., 30 minutes for pickup)
          const readyTimeMinutes = 30
          
          await emailService.sendOrderReadyTimeEmail({
            to: customerInfo.email,
            name: customerInfo.name,
            orderId: order.OrderID.toString(),
            readyTimeMinutes,
            orderDetails: emailData.orderDetails
          })
          
          console.log('✅ Pickup ready time email sent successfully')
        } catch (readyTimeEmailError) {
          console.error('❌ Error sending pickup ready time email:', readyTimeEmailError)
          // Don't fail the order if email can't be sent, just log the error
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending order confirmation email:', emailError)
      // Don't fail the order if email can't be sent, just log the error
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`✅ [${requestId}] ORDER SUCCESSFULLY CREATED`)
    console.log(`   - Order ID: ${order.OrderID}`)
    console.log(`   - Customer: ${customerInfo.name}`)
    console.log(`   - Items saved: ${orderItemsData.length}`)
    console.log(`   - Total amount: ${validatedTotalPrice.toFixed(2)} лв`)
    console.log(`   - Timestamp: ${new Date().toISOString()}`)
    console.log('='.repeat(80) + '\n')

    return NextResponse.json({ 
      success: true, 
      orderId: order.OrderID,
      message: 'Order confirmed successfully' 
    })

  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`)
    console.error(`❌ [${requestId}] FATAL ERROR - Order confirmation failed`)
    console.error(`   Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}`)
    console.error('='.repeat(80) + '\n')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
