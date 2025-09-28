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

    const supabase = createServerClient()

    // 1) Base order without joins (avoid schema relationship assumptions)
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('*')
      .eq('OrderID', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Error fetching order:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2) Related data fetched separately and composed
    let login: any = null
    if (order.LoginID) {
      const { data: loginData } = await supabase
        .from('Login')
        .select('Name, email, phone, LocationText, LocationCoordinates, addressInstructions')
        .eq('LoginID', order.LoginID)
        .single()
      login = loginData || null
    }

    let orderStatus: any = null
    if (order.OrderStatusID) {
      const { data: statusData } = await supabase
        .from('RfOrderStatus')
        .select('OrderStatus')
        .eq('OrderStatusID', order.OrderStatusID)
        .single()
      orderStatus = statusData || null
    }

    let paymentMethod: any = null
    if (order.RfPaymentMethodID) {
      const { data: paymentData } = await supabase
        .from('RfPaymentMethod')
        .select('PaymentMethod')
        .eq('PaymentMethodID', order.RfPaymentMethodID)
        .single()
      paymentMethod = paymentData || null
    }

    // 3) Order items with CompositeProduct data
    const { data: orderItems, error: itemsError } = await supabase
      .from('LkOrderProduct')
      .select(`
        *,
        CompositeProduct (
          CompositeProductID,
          Size,
          PricingMethod,
          BaseUnitPrice,
          Parts,
          Addons,
          comment
        )
      `)
      .eq('OrderID', orderId)

    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 })
    }

    // 4) Parse coordinates and addons
    let coordinates = null
    if (order.OrderLocationCoordinates) {
      try {
        coordinates = JSON.parse(order.OrderLocationCoordinates)
      } catch (e) {
        console.warn('Failed to parse order coordinates:', order.OrderLocationCoordinates)
      }
    }

    let userCoordinates = null
    if (login?.LocationCoordinates) {
      try {
        userCoordinates = JSON.parse(login.LocationCoordinates)
      } catch (e) {
        console.warn('Failed to parse user coordinates:', login.LocationCoordinates)
      }
    }

    const itemsWithParsedAddons = orderItems?.map((item) => {
      const parsedItem = {
        ...item,
        Addons: item.Addons ? JSON.parse(item.Addons) : null
      }
      
      // If this is a composite product, parse the Parts data
      if (item.CompositeProduct) {
        parsedItem.CompositeProduct = {
          ...item.CompositeProduct,
          Parts: item.CompositeProduct.Parts ? JSON.parse(item.CompositeProduct.Parts) : null,
          Addons: item.CompositeProduct.Addons ? JSON.parse(item.CompositeProduct.Addons) : null
        }
      }
      
      return parsedItem
    }) || []

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        OrderLocationCoordinates: coordinates,
        Login: login ? { ...login, LocationCoordinates: userCoordinates } : null,
        OrderStatus: orderStatus ? { StatusName: orderStatus.OrderStatus } : null,
        PaymentMethod: paymentMethod ? { PaymentMethodName: paymentMethod.PaymentMethod } : null,
        items: itemsWithParsedAddons,
        ExpectedDT: order.ExpectedDT, // Include the expected delivery time
        OrderType: order.OrderType // Include order type (1=restaurant, 2=delivery)
      }
    })

  } catch (error) {
    console.error('❌ Order details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}