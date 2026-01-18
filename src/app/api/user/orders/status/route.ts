import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch only status information for the specified orders
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        OrderStatusID,
        RfOrderStatus (
          OrderStatus
        )
      `)
      .in('OrderID', orderIds.map(id => parseInt(id, 10)))

    if (ordersError) {
      console.error('Error fetching order statuses:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch order statuses', details: ordersError.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const statusMap = (orders || []).reduce((acc, order) => {
      acc[order.OrderID.toString()] = {
        StatusID: order.OrderStatusID,
        Status: order.RfOrderStatus?.[0]?.OrderStatus || 'Unknown'
      }
      return acc
    }, {} as Record<string, { StatusID: number; Status: string }>)

    return NextResponse.json({
      statuses: statusMap
    })

  } catch (error) {
    console.error('Order statuses API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
