import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Type definitions for the database response
interface LkOrderProductData {
  LkOrderProductID: number
  ProductID: number
  ProductName: string
  ProductSize: string
  Quantity: number
  UnitPrice: number
  TotalPrice: number
  Addons: string | null
  Comment: string | null
}

interface OrderData {
  OrderID: number
  LoginID: number
  OrderDT: string
  OrderLocation: string
  OrderLocationCoordinates: string
  OrderStatusID: number
  RfPaymentMethodID: number
  IsPaid: boolean
  LkOrderProduct: LkOrderProductData[]
  RfOrderStatus: {
    OrderStatus: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate that userId is a valid number
    const userIdNum = parseInt(userId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'User ID must be a valid number' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = createServerClient()

    // Fetch user's orders with complete details
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        LoginID,
        OrderDT,
        OrderLocation,
        OrderLocationCoordinates,
        OrderStatusID,
        RfPaymentMethodID,
        IsPaid,
        LkOrderProduct (
          LkOrderProductID,
          ProductID,
          ProductName,
          ProductSize,
          Quantity,
          UnitPrice,
          TotalPrice,
          Addons,
          Comment
        ),
        RfOrderStatus (
          OrderStatus
        )
      `)
      .eq('LoginID', userIdNum)
      .order('OrderDT', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      console.error('Error details:', {
        code: ordersError.code,
        message: ordersError.message,
        details: ordersError.details,
        hint: ordersError.hint
      })
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      )
    }

    // Get unique payment method IDs to fetch payment method names
    const paymentMethodIds = [...new Set(orders?.map(order => order.RfPaymentMethodID) || [])]
    
    // Fetch payment method names
    const { data: paymentMethods, error: paymentMethodsError } = await supabase
      .from('RfPaymentMethod')
      .select('PaymentMethodID, PaymentMethod')
      .in('PaymentMethodID', paymentMethodIds)
    
    // Create a lookup map for payment methods
    const paymentMethodMap = new Map()
    if (paymentMethods) {
      paymentMethods.forEach(pm => {
        paymentMethodMap.set(pm.PaymentMethodID, pm.PaymentMethod)
      })
    }

    // Transform the data to match the expected format
    const transformedOrders = (orders as OrderData[])?.map(order => {
      // Calculate total amount from order items
      const totalAmount = order.LkOrderProduct?.reduce((sum, item) => sum + Number(item.TotalPrice), 0) || 0
      
      return {
        OrderID: order.OrderID.toString(),
        OrderDate: order.OrderDT,
        TotalAmount: totalAmount,
        Status: order.RfOrderStatus?.OrderStatus || 'Unknown',
        PaymentMethod: paymentMethodMap.get(order.RfPaymentMethodID) || 'Unknown',
        IsPaid: order.IsPaid,
        DeliveryAddress: order.OrderLocation,
        Products: order.LkOrderProduct?.map(item => {
          let addons = []
          if (item.Addons) {
            try {
              addons = JSON.parse(item.Addons)
            } catch (e) {
              console.warn('Failed to parse addons:', item.Addons)
            }
          }
          
          return {
            ProductName: item.ProductName,
            ProductSize: item.ProductSize,
            Quantity: item.Quantity,
            UnitPrice: Number(item.UnitPrice),
            TotalPrice: Number(item.TotalPrice),
            Addons: addons,
            Comment: item.Comment
          }
        }) || []
      }
    }) || []

    return NextResponse.json({
      orders: transformedOrders,
      count: transformedOrders.length
    })

  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
