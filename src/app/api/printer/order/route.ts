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

    console.log('🖨️ Printer order creation request:', {
      customerInfo,
      orderItems: orderItems?.length,
      totalPrice,
      orderType,
      deliveryPrice
    })

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

    console.log('👤 Creating guest user for printer order:', guestUserData)

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
    console.log('✅ Guest user created with ID:', loginId)

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

    console.log('📋 Creating printer order with data:', orderData)

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

    console.log('✅ Printer order created with ID:', order.OrderID)

    // Save order items to LkOrderProduct table
    if (orderItems && orderItems.length > 0) {
      console.log('📦 Saving printer order items:', orderItems.length)
      
      const orderItemsData: any[] = []
      
      for (const item of orderItems) {
        // Calculate addon prices if any
        let addonTotal = 0
        if (item.addons && Array.isArray(item.addons)) {
          addonTotal = item.addons.reduce((sum: number, addon: any) => {
            return sum + (addon.price || 0)
          }, 0)
        }
        
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

      const { error: itemsError } = await supabase
        .from('LkOrderProduct')
        .insert(orderItemsData)

      if (itemsError) {
        console.error('❌ Error saving printer order items:', itemsError)
        return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 })
      } else {
        console.log('✅ Printer order items saved successfully')
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
