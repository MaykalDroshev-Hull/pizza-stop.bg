import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerInfo, 
      orderItems, 
      totalPrice,
      orderType,
      deliveryPrice
    } = body

    // Create server-side Supabase client (bypasses RLS)
    const supabase = createServerClient()

    // Create a guest login account for this printer order
    const guestUserData = {
      email: `printer_guest_${Date.now()}@pizza-stop.bg`,
      Password: 'guest_password', // Placeholder for guests
      Name: customerInfo.name,
      phone: customerInfo.phone,
      LocationText: customerInfo.address,
      LocationCoordinates: null, // No coordinates for printer orders
      NumberOfOrders: 0,
      PreferedPaymentMethodID: 2, // Cash payment for printer orders
      isGuest: true,
      addressInstructions: null
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

    const loginId = guestUser.LoginID

    // Calculate expected ready time (30 minutes from now)
    const now = new Date()
    const expectedDT = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now

    // Prepare order data
    const orderData = {
      LoginID: loginId,
      OrderDT: now.toISOString(),
      OrderLocation: customerInfo.address,
      OrderLocationCoordinates: JSON.stringify({ lat: 0, lng: 0 }), // Placeholder, as address is text
      OrderStatusID: 1, // New Order status
      RfPaymentMethodID: 2, // Cash payment for printer orders
      IsPaid: false, // Orders start as unpaid
      ExpectedDT: expectedDT.toISOString(),
      OrderType: orderType || 1, // Use orderType from request, default to Collection
      DeliveryPrice: deliveryPrice || 3, // Use deliveryPrice from request, default to 3
      TotalAmount: totalPrice
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .insert(orderData)
      .select('OrderID')
      .single()

    if (orderError) {
      console.error('❌ Error creating printer order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Save order items to LkOrderProduct table
    if (orderItems && orderItems.length > 0) {

      const orderItemsData: any[] = []

      for (const item of orderItems) {
        // Calculate addon prices if any
        let addonTotal = 0
        if (item.addons && Array.isArray(item.addons)) {
          addonTotal = item.addons.reduce((sum: number, addon: any) => {
            return sum + (addon.price || 0)
          }, 0)
        }

        // Check if this is a 50/50 pizza (category: 'pizza-5050')
        if (item.category === 'pizza-5050') {

          // Extract pizza halves from the comment
          const commentMatch = item.comment?.match(/(.+?) \/ (.+?): (.+?)\s+\(~2000г \| 60см\)/)
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
              // Create CompositeProduct record (same structure as regular order API)
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
                const itemTotal = (item.price + addonTotal) * item.quantity
                orderItemsData.push({
                  OrderID: order.OrderID,
                  ProductID: null, // No single product ID for 50/50
                  ProductName: item.name,
                  ProductSize: item.size || 'Standard',
                  Quantity: item.quantity || 1,
                  UnitPrice: item.price,
                  TotalPrice: itemTotal,
                  Addons: item.addons ? JSON.stringify(item.addons) : null,
                  Comment: item.comment || null,
                  CompositeProductID: null
                })
                continue
              }

              // Add to order items with the composite product
              orderItemsData.push({
                OrderID: order.OrderID,
                ProductID: null, // No single product ID for 50/50
                ProductName: item.name,
                ProductSize: item.size || 'Standard',
                Quantity: item.quantity || 1,
                UnitPrice: item.price,
                TotalPrice: (item.price + addonTotal) * item.quantity,
                Addons: item.addons ? JSON.stringify(item.addons) : null,
                Comment: item.comment || null,
                CompositeProductID: compositeProduct.CompositeProductID
              })
            } else {
              console.error('❌ Could not find pizza products in database:', leftPizzaName, rightPizzaName)
              // Fallback: create regular order item (though this should not happen)
              orderItemsData.push({
                OrderID: order.OrderID,
                ProductID: item.id, // This will fail but at least we tried
                ProductName: item.name,
                ProductSize: item.size || 'Standard',
                Quantity: item.quantity || 1,
                UnitPrice: item.price,
                TotalPrice: (item.price + addonTotal) * item.quantity,
                Addons: item.addons ? JSON.stringify(item.addons) : null,
                Comment: item.comment || null,
                CompositeProductID: null
              })
            }
          } else {
            console.error('❌ Could not parse 50/50 pizza comment:', item.comment)
            // Fallback: create regular order item
            orderItemsData.push({
              OrderID: order.OrderID,
              ProductID: item.id, // This will fail but at least we tried
              ProductName: item.name,
              ProductSize: item.size || 'Standard',
              Quantity: item.quantity || 1,
              UnitPrice: item.price,
              TotalPrice: (item.price + addonTotal) * item.quantity,
              Addons: item.addons ? JSON.stringify(item.addons) : null,
              Comment: item.comment || null,
              CompositeProductID: null
            })
          }
        } else {
          // Regular product - use the item.id as ProductID
          // Calculate total price for this item
          const itemTotal = (item.price + addonTotal) * item.quantity

          orderItemsData.push({
            OrderID: order.OrderID,
            ProductID: item.id,
            ProductName: item.name,
            ProductSize: item.size || 'Standard',
            Quantity: item.quantity || 1,
            UnitPrice: item.price,
            TotalPrice: itemTotal,
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
        console.error('❌ Error saving printer order items:', itemsError)
        return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 })
      } 
    }

    return NextResponse.json({ 
      success: true, 
      orderId: order.OrderID,
      message: 'Printer order created successfully' 
    })

  } catch (error) {
    console.error('❌ Printer order creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
