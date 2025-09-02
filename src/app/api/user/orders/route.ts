import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Type definitions for the database response
interface OrderProductData {
  LkOrderProductID: number
  ProductID: number
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
  LkOrderProduct: OrderProductData[]
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

    // Fetch user's orders with product details
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
          ProductID
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

    // Transform the data to match the expected format
    const transformedOrders = (orders as any[])?.map(order => ({
      OrderID: order.OrderID.toString(),
      OrderDate: order.OrderDT,
      TotalAmount: 0, // Not available in current schema
      Status: 'Completed', // Not available in current schema  
      DeliveryAddress: order.OrderLocation,
      Products: order.LkOrderProduct?.map((item: any) => ({
        ProductName: `Product ${item.ProductID}`,
        Quantity: 1, // Not available in current schema
        Price: 0 // Not available in current schema
      })) || []
    })) || []

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
