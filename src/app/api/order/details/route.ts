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
  RfPaymentMethod: {
    PaymentMethod: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Order ID and User ID are required' },
        { status: 400 }
      )
    }

    // Validate that orderId and userId are valid numbers
    const orderIdNum = parseInt(orderId, 10)
    const userIdNum = parseInt(userId, 10)
    
    if (isNaN(orderIdNum) || isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Order ID and User ID must be valid numbers' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = createServerClient()

    // Fetch order details with complete information
    const { data: order, error: orderError } = await supabase
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
        ),
        RfPaymentMethod (
          PaymentMethod
        )
      `)
      .eq('OrderID', orderIdNum)
      .eq('LoginID', userIdNum) // Ensure user can only access their own orders
      .single()

    if (orderError) {
      console.error('Error fetching order details:', orderError)
      return NextResponse.json(
        { error: 'Order not found or access denied', details: orderError.message },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format
    const transformedOrder = {
      OrderID: order.OrderID.toString(),
      OrderDate: order.OrderDT,
      TotalAmount: order.LkOrderProduct?.reduce((sum, item) => sum + Number(item.TotalPrice), 0) || 0,
      Status: order.RfOrderStatus?.OrderStatus || 'Unknown',
      PaymentMethod: order.RfPaymentMethod?.PaymentMethod || 'Unknown',
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
          OrderItemID: item.LkOrderProductID,
          ProductID: item.ProductID,
          ProductName: item.ProductName,
          ProductSize: item.ProductSize,
          Quantity: item.Quantity,
          UnitPrice: Number(item.UnitPrice),
          TotalPrice: Number(item.TotalPrice),
          Addons: addons,
          Comment: item.Comment
        }
      }) || [],
      // Add estimated time based on order status
      EstimatedTime: getEstimatedTime(order.RfOrderStatus?.OrderStatus)
    }

    return NextResponse.json({
      order: transformedOrder
    })

  } catch (error) {
    console.error('Order details API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate estimated time based on order status
function getEstimatedTime(status: string): string | undefined {
  const now = new Date()
  
  switch (status?.toLowerCase()) {
    case 'нова поръчка':
      // New orders: 30-45 minutes
      const newOrderTime = new Date(now.getTime() + 45 * 60 * 1000)
      return newOrderTime.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
    
    case 'потвърдена':
      // Confirmed orders: 25-35 minutes
      const confirmedTime = new Date(now.getTime() + 35 * 60 * 1000)
      return confirmedTime.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
    
    case 'приготвя се':
      // Preparing: 15-25 minutes
      const preparingTime = new Date(now.getTime() + 25 * 60 * 1000)
      return preparingTime.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
    
    case 'готова за вземане':
      // Ready for pickup: 5-10 minutes
      const readyTime = new Date(now.getTime() + 10 * 60 * 1000)
      return readyTime.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
    
    case 'в доставка':
      // Out for delivery: 10-20 minutes
      const deliveryTime = new Date(now.getTime() + 20 * 60 * 1000)
      return deliveryTime.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
    
    default:
      return undefined
  }
}
