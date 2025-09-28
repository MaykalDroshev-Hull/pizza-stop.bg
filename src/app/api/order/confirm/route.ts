import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { emailService } from '@/utils/emailService'

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
  try {
    const body = await request.json()
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
    } = body

    console.log('📦 Order confirmation request:', {
      customerInfo,
      orderItems: orderItems?.length,
      orderTime,
      orderType,
      deliveryCost,
      totalPrice,
      isCollection,
      paymentMethodId,
      loginId
    })

    // Create server-side Supabase client (bypasses RLS)
    const supabase = createServerClient()

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
        LocationCoordinates: (customerInfo.LocationCoordinates || customerInfo.coordinates) ? 
          (typeof (customerInfo.LocationCoordinates || customerInfo.coordinates) === 'string' ? 
            (() => {
              try {
                const parsed = JSON.parse(customerInfo.LocationCoordinates || customerInfo.coordinates)
                return JSON.stringify(parsed)
              } catch (error) {
                return customerInfo.LocationCoordinates || customerInfo.coordinates
              }
            })() : JSON.stringify(customerInfo.LocationCoordinates || customerInfo.coordinates)) : null,
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
        updateData.LocationCoordinates = (customerInfo.LocationCoordinates || customerInfo.coordinates) ? 
          (typeof (customerInfo.LocationCoordinates || customerInfo.coordinates) === 'string' ? 
            (() => {
              try {
                const parsed = JSON.parse(customerInfo.LocationCoordinates || customerInfo.coordinates)
                return JSON.stringify(parsed)
              } catch (error) {
                return customerInfo.LocationCoordinates || customerInfo.coordinates
              }
            })() : JSON.stringify(customerInfo.LocationCoordinates || customerInfo.coordinates)) : null
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
    } else {
      // Scheduled orders: use customer time but ensure it's at least 45 minutes away
      const scheduledTime = new Date(orderTime.scheduledTime)
      expectedDT = scheduledTime < minDeliveryTime ? minDeliveryTime : scheduledTime
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
        : new Date(orderTime.scheduledTime).toISOString(),
      OrderLocation: isCollection ? restaurantLocation.address : (customerInfo.LocationText || customerInfo.address),
      OrderLocationCoordinates: isCollection 
        ? JSON.stringify(restaurantLocation.coordinates)
        : ((customerInfo.LocationCoordinates || customerInfo.coordinates) ? 
            (typeof (customerInfo.LocationCoordinates || customerInfo.coordinates) === 'string' ? 
              (() => {
                try {
                  const parsed = JSON.parse(customerInfo.LocationCoordinates || customerInfo.coordinates)
                  return JSON.stringify(parsed)
                } catch (error) {
                  return customerInfo.LocationCoordinates || customerInfo.coordinates
                }
              })() : JSON.stringify(customerInfo.LocationCoordinates || customerInfo.coordinates)) : null),
      OrderStatusID: 1, // Assuming 1 = "New Order" status
      RfPaymentMethodID: paymentMethodId,
      IsPaid: false, // Orders start as unpaid
      ExpectedDT: expectedDT.toISOString(),
      OrderType: isCollection ? 1 : 2 // 1 = Restaurant collection, 2 = Delivery
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

    // Save order items to LkOrderProduct table
    if (orderItems && orderItems.length > 0) {
      console.log('📦 Saving order items:', orderItems.length)
      
      const orderItemsData = []
      
      for (const item of orderItems) {
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
                // Fallback to regular product entry
                orderItemsData.push({
                  OrderID: order.OrderID,
                  ProductID: null, // No single product ID for 50/50
                  ProductName: item.name,
                  ProductSize: item.size || 'Medium',
                  Quantity: item.quantity,
                  UnitPrice: item.price,
                  TotalPrice: item.price * item.quantity,
                  Addons: item.addons ? JSON.stringify(item.addons) : null,
                  Comment: item.comment || null,
                  CompositeProductID: null
                })
              } else {
                console.log('✅ CompositeProduct created with ID:', compositeProduct.CompositeProductID)
                // Add to order items with CompositeProductID
                orderItemsData.push({
                  OrderID: order.OrderID,
                  ProductID: null, // No single product ID for composite products
                  ProductName: item.name,
                  ProductSize: item.size || 'Medium',
                  Quantity: item.quantity,
                  UnitPrice: item.price,
                  TotalPrice: item.price * item.quantity,
                  Addons: item.addons ? JSON.stringify(item.addons) : null,
                  Comment: item.comment || null,
                  CompositeProductID: compositeProduct.CompositeProductID
                })
              }
            } else {
              console.error('❌ Could not find pizza products for 50/50:', { leftPizzaName, rightPizzaName })
              // Fallback to regular product entry
              orderItemsData.push({
                OrderID: order.OrderID,
                ProductID: null,
                ProductName: item.name,
                ProductSize: item.size || 'Medium',
                Quantity: item.quantity,
                UnitPrice: item.price,
                TotalPrice: item.price * item.quantity,
                Addons: item.addons ? JSON.stringify(item.addons) : null,
                Comment: item.comment || null,
                CompositeProductID: null
              })
            }
          } else {
            console.error('❌ Could not parse 50/50 pizza comment:', item.comment)
            // Fallback to regular product entry
            orderItemsData.push({
              OrderID: order.OrderID,
              ProductID: null,
              ProductName: item.name,
              ProductSize: item.size || 'Medium',
              Quantity: item.quantity,
              UnitPrice: item.price,
              TotalPrice: item.price * item.quantity,
              Addons: item.addons ? JSON.stringify(item.addons) : null,
              Comment: item.comment || null,
              CompositeProductID: null
            })
          }
        } else {
          // Regular product
          orderItemsData.push({
            OrderID: order.OrderID,
            ProductID: item.id,
            ProductName: item.name,
            ProductSize: item.size || 'Medium',
            Quantity: item.quantity,
            UnitPrice: item.price,
            TotalPrice: item.price * item.quantity,
            Addons: item.addons ? JSON.stringify(item.addons) : null,
            Comment: item.comment || null,
            CompositeProductID: null
          })
        }
      }

      const { error: itemsError } = await supabase
        .from('LkOrderProduct')
        .insert(orderItemsData)

      if (itemsError) {
        console.error('❌ Error saving order items:', itemsError)
        // Don't fail the order if items can't be saved, just log the error
      } else {
        console.log('✅ Order items saved successfully')
      }
    }

    // Send order confirmation email
    try {
      console.log('📧 Sending order confirmation email...')
      
      // Prepare email data
      const emailData = {
        to: customerInfo.email,
        name: customerInfo.name,
        orderId: order.OrderID.toString(),
        orderDetails: {
          items: orderItems.map((item: any) => ({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            addons: item.addons?.map((addon: any) => ({
              name: addon.Name || addon.name,
              price: addon.Price || addon.price
            })),
            comment: item.comment
          })),
          totalAmount: totalPrice + (isCollection ? 0 : deliveryCost),
          orderTime: new Date().toLocaleString('bg-BG'),
          orderType: isCollection ? 'Вземане от ресторанта' : 'Доставка',
          paymentMethod: getPaymentMethodName(paymentMethodId),
          location: isCollection ? 'Lovech Center, ul. "Angel Kanchev" 10, 5502 Lovech, Bulgaria' : (customerInfo.LocationText || customerInfo.address),
          estimatedTime: expectedDT.toLocaleString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }

      await emailService.sendOrderConfirmationEmail(emailData)
      console.log('✅ Order confirmation email sent successfully')
    } catch (emailError) {
      console.error('❌ Error sending order confirmation email:', emailError)
      // Don't fail the order if email can't be sent, just log the error
    }

    return NextResponse.json({ 
      success: true, 
      orderId: order.OrderID,
      message: 'Order confirmed successfully' 
    })

  } catch (error) {
    console.error('❌ Order confirmation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
