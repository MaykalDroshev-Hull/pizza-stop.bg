import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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
        LocationText: customerInfo.address,
        LocationCoordinates: customerInfo.coordinates ? JSON.stringify(customerInfo.coordinates) : null,
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
      const updateData = {
        Name: customerInfo.name,
        phone: customerInfo.phone,
        LocationText: customerInfo.address,
        LocationCoordinates: customerInfo.coordinates ? JSON.stringify(customerInfo.coordinates) : null,
        PreferedPaymentMethodID: paymentMethodId,
        addressInstructions: customerInfo.deliveryInstructions || null
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

    // Prepare order data
    const orderData = {
      LoginID: finalLoginId,
      OrderDT: orderTime.type === 'immediate' 
        ? new Date().toISOString() 
        : new Date(orderTime.scheduledTime).toISOString(),
      OrderLocation: customerInfo.address,
      OrderLocationCoordinates: customerInfo.coordinates ? JSON.stringify(customerInfo.coordinates) : null,
      OrderStatusID: 1, // Assuming 1 = "New Order" status
      RfPaymentMethodID: paymentMethodId,
      IsPaid: false // Orders start as unpaid
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
      
      const orderItemsData = orderItems.map((item: any) => ({
        OrderID: order.OrderID,
        ProductID: item.id,
        ProductName: item.name,
        ProductSize: item.size || 'Medium',
        Quantity: item.quantity,
        UnitPrice: item.price,
        TotalPrice: item.price * item.quantity,
        Addons: item.addons ? JSON.stringify(item.addons) : null,
        Comment: item.comment || null
      }))

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
