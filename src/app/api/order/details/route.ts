import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = createServerClient()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        *,
        Login:LoginID (
          Name,
          email,
          phone,
          LocationText,
          LocationCoordinates,
          addressInstructions
        ),
        OrderStatus:OrderStatusID (
          StatusName
        ),
        PaymentMethod:RfPaymentMethodID (
          PaymentMethodName
        )
      `)
      .eq('OrderID', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Error fetching order:', orderError)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('LkOrderProduct')
      .select('*')
      .eq('OrderID', orderId)

    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      )
    }

    // Parse coordinates if available
    let coordinates = null
    if (order.OrderLocationCoordinates) {
      try {
        coordinates = JSON.parse(order.OrderLocationCoordinates)
      } catch (error) {
        console.warn('Failed to parse order coordinates:', order.OrderLocationCoordinates)
      }
    }

    let userCoordinates = null
    if (order.Login?.LocationCoordinates) {
      try {
        userCoordinates = JSON.parse(order.Login.LocationCoordinates)
      } catch (error) {
        console.warn('Failed to parse user coordinates:', order.Login.LocationCoordinates)
      }
    }

    // Parse addons for each item
    const itemsWithParsedAddons = orderItems?.map(item => ({
      ...item,
      Addons: item.Addons ? JSON.parse(item.Addons) : null
    })) || []

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        OrderLocationCoordinates: coordinates,
        Login: order.Login ? {
          ...order.Login,
          LocationCoordinates: userCoordinates
        } : null,
        items: itemsWithParsedAddons
      }
    })

  } catch (error) {
    console.error('❌ Order details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}