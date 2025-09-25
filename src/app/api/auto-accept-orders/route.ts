import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Order status constants
const ORDER_STATUS = {
  PAID: 1,        // Платена - New order, paid
  ACCEPTED: 2,    // Приета - Accepted, appears on dashboard
  COOKING: 3,     // Готвене - Cooking, in "работи се" field
  WITH_DRIVER: 4, // Със Шофьора - With driver
  DELIVERED: 5,   // Доставена - Delivered
  CANCELED: 6,    // Отказана - Canceled
  READY: 7,       // Приготвена - Ready/Finished
  ON_WAY: 8       // На път - On way to customer
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Auto-accepting PAID orders...')
    
    // Find all orders with PAID status (1)
    const { data: paidOrders, error: fetchError } = await supabaseAdmin
      .from('Order')
      .select('OrderID, OrderDT')
      .eq('OrderStatusID', ORDER_STATUS.PAID)
      .order('OrderDT', { ascending: true })

    if (fetchError) {
      console.error('Error fetching PAID orders:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!paidOrders || paidOrders.length === 0) {
      console.log('✅ No PAID orders found to auto-accept')
      return NextResponse.json({ 
        success: true, 
        count: 0, 
        message: 'No PAID orders found to auto-accept' 
      })
    }

    console.log(`📦 Found ${paidOrders.length} PAID orders to auto-accept`)

    // Update all PAID orders to ACCEPTED status
    const { error: updateError } = await supabaseAdmin
      .from('Order')
      .update({ OrderStatusID: ORDER_STATUS.ACCEPTED })
      .eq('OrderStatusID', ORDER_STATUS.PAID)

    if (updateError) {
      console.error('Error updating orders to ACCEPTED:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully auto-accepted ${paidOrders.length} orders`)
    
    return NextResponse.json({
      success: true,
      count: paidOrders.length,
      message: `Successfully auto-accepted ${paidOrders.length} orders`,
      orders: paidOrders.map(order => ({
        OrderID: order.OrderID,
        OrderDT: order.OrderDT
      }))
    })

  } catch (error) {
    console.error('Exception in auto-accept API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check for PAID orders without updating them
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Checking for PAID orders...')
    
    const { data: paidOrders, error } = await supabaseAdmin
      .from('Order')
      .select('OrderID, OrderDT, OrderLocation')
      .eq('OrderStatusID', ORDER_STATUS.PAID)
      .order('OrderDT', { ascending: true })

    if (error) {
      console.error('Error fetching PAID orders:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: paidOrders?.length || 0,
      orders: paidOrders || []
    })

  } catch (error) {
    console.error('Exception in GET auto-accept API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

