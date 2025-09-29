import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { EmailService } from '@/utils/emailService'
import { ORDER_STATUS } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 ETA API: Starting request processing')
    
    const body = await request.json()
    console.log('🚀 ETA API: Request body:', body)
    
    const { orderId, etaMinutes, driverId } = body

    // Validate input
    if (!orderId || !etaMinutes) {
      console.log('❌ ETA API: Missing required fields', { orderId, etaMinutes })
      return NextResponse.json(
        { error: 'Order ID and ETA minutes are required' },
        { status: 400 }
      )
    }

    if (![15, 30, 45, 60].includes(etaMinutes)) {
      console.log('❌ ETA API: Invalid ETA minutes', { etaMinutes })
      return NextResponse.json(
        { error: 'ETA must be 15, 30, 45, or 60 minutes' },
        { status: 400 }
      )
    }

    // Ensure orderId is a number
    const numericOrderId = parseInt(orderId.toString(), 10)
    if (isNaN(numericOrderId)) {
      console.log('❌ ETA API: Invalid order ID', { orderId, numericOrderId })
      return NextResponse.json(
        { error: 'Order ID must be a valid number' },
        { status: 400 }
      )
    }

    console.log(`🚗 Updating ETA for order ${numericOrderId} to ${etaMinutes} minutes`)

    const supabase = createServerClient()
    console.log('🚀 ETA API: Supabase client created')

    // First, let's check if the order exists at all
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('Order')
      .select('OrderID, OrderStatusID')
      .limit(10)

    console.log('🔍 Available orders in database:', allOrders)
    console.log('🔍 Looking for order ID:', numericOrderId)
    console.log('🔍 Order ID type:', typeof numericOrderId)

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        LoginID,
        OrderDT,
        OrderLocation,
        OrderLocationCoordinates,
        OrderStatusID,
        RfPaymentMethodID
      `)
      .eq('OrderID', numericOrderId)
      .single()

    console.log('🔍 Order query result:', { order, orderError })

    if (orderError || !order) {
      console.error('❌ Error fetching order:', orderError)
      console.error('❌ Order data:', order)
      return NextResponse.json(
        { error: `Order not found. Error: ${orderError?.message || 'No order data'}` },
        { status: 404 }
      )
    }

    // Get customer details
    console.log('🚀 ETA API: Fetching customer details for LoginID:', order.LoginID)
    let customer: any = null
    if (order.LoginID) {
      const { data: customerData, error: customerError } = await supabase
        .from('Login')
        .select('Name, email, phone, LocationText, addressInstructions')
        .eq('LoginID', order.LoginID)
        .single()
      
      console.log('🚀 ETA API: Customer query result:', { customerData, customerError })
      customer = customerData
    }

    if (!customer) {
      console.error('❌ ETA API: Customer not found for order:', orderId)
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get order items
    console.log('🚀 ETA API: Fetching order items for OrderID:', numericOrderId)
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
      .eq('OrderID', numericOrderId)

    console.log('🚀 ETA API: Order items query result:', { orderItems, itemsError })

    if (itemsError) {
      console.error('❌ ETA API: Error fetching order items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      )
    }

    // Calculate new expected delivery time
    const now = new Date()
    const newExpectedDT = new Date(now.getTime() + etaMinutes * 60 * 1000)

    // Update order with new expected delivery time and status
    console.log('🚀 ETA API: Updating order status to IN_DELIVERY')
    const { error: updateError } = await supabase
      .from('Order')
      .update({
        ExpectedDT: newExpectedDT.toISOString(),
        OrderStatusID: ORDER_STATUS.IN_DELIVERY // Status: "В процес на доставка"
      })
      .eq('OrderID', numericOrderId)

    console.log('🚀 ETA API: Order update result:', { updateError })

    if (updateError) {
      console.error('❌ ETA API: Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    console.log(`✅ Order ${numericOrderId} updated to IN_DELIVERY status with ETA ${etaMinutes} minutes`)

    // Helper function to safely parse JSON
    const safeJsonParse = (data: any) => {
      if (!data) return null
      if (typeof data === 'object') return data // Already parsed
      if (typeof data === 'string') {
        try {
          return JSON.parse(data)
        } catch (error) {
          console.warn('⚠️ Failed to parse JSON:', data, error)
          return null
        }
      }
      return null
    }

    // Prepare email data
    const itemsWithParsedAddons = orderItems?.map((item) => {
      const parsedItem = {
        ...item,
        Addons: safeJsonParse(item.Addons)
      }
      
      // If this is a composite product, parse the Parts data
      if (item.CompositeProduct) {
        parsedItem.CompositeProduct = {
          ...item.CompositeProduct,
          Parts: safeJsonParse(item.CompositeProduct.Parts),
          Addons: safeJsonParse(item.CompositeProduct.Addons)
        }
      }
      
      return parsedItem
    }) || []

    // Calculate total order price from items
    const totalOrderPrice = orderItems?.reduce((sum, item) => sum + (item.TotalPrice || 0), 0) || 0

    // Format items for email
    const emailItems = itemsWithParsedAddons.map(item => {
      let customizations: string[] = []
      
      // Handle CompositeProduct (50/50 pizza) customizations
      if (item.CompositeProduct) {
        // Add pizza halves information
        if (item.CompositeProduct.Parts && Array.isArray(item.CompositeProduct.Parts)) {
          item.CompositeProduct.Parts.forEach((part: any) => {
            customizations.push(`${part.Portion === 'left' ? 'Лява половина' : 'Дясна половина'}: ${part.Name}`)
          })
        }
        
        // Add composite product addons
        if (item.CompositeProduct.Addons && Array.isArray(item.CompositeProduct.Addons)) {
          item.CompositeProduct.Addons.forEach((addon: any) => {
            customizations.push(addon.Name || addon.name || addon)
          })
        }
      } else if (item.Addons) {
        // Handle regular product addons
        const addonsData = safeJsonParse(item.Addons)
        if (Array.isArray(addonsData)) {
          customizations = addonsData.map((addon: any) => addon.Name || addon.name || addon).filter(Boolean)
        } else if (typeof item.Addons === 'string') {
          // Fallback to comma-separated string
          customizations = item.Addons.split(',').map(a => a.trim()).filter(Boolean)
        }
      }

      return {
        name: item.ProductName,
        size: item.ProductSize,
        quantity: item.Quantity,
        price: item.UnitPrice,
        addons: customizations.map(name => ({ name, price: 0 })),
        comment: item.Comment
      }
    })

    // Get payment method name
    let paymentMethodName = 'Неизвестен метод'
    if (order.RfPaymentMethodID) {
      const { data: paymentData } = await supabase
        .from('RfPaymentMethod')
        .select('PaymentMethod')
        .eq('PaymentMethodID', order.RfPaymentMethodID)
        .single()
      paymentMethodName = paymentData?.PaymentMethod || paymentMethodName
    }

    // Determine order type
    const isCollection = order.OrderLocation?.includes('Lovech Center')
    const orderType = isCollection ? 'Вземане от ресторанта' : 'Доставка'

    // Format estimated arrival time
    const estimatedArrivalTime = newExpectedDT.toLocaleString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })

    // Send delivery ETA email
    console.log('🚀 ETA API: Starting email sending process')
    try {
      const emailService = new EmailService()
      console.log('🚀 ETA API: EmailService created, sending email to:', customer.email)
      await emailService.sendDeliveryETAEmail({
        to: customer.email,
        name: customer.Name,
        orderId: numericOrderId.toString(),
        etaMinutes,
        estimatedArrivalTime,
        orderDetails: {
          items: emailItems,
          totalAmount: totalOrderPrice,
          orderTime: new Date(order.OrderDT).toLocaleString('bg-BG'),
          orderType,
          paymentMethod: paymentMethodName,
          location: order.OrderLocation || customer.LocationText || ''
        }
      })

      console.log(`✅ Delivery ETA email sent successfully to ${customer.email}`)
    } catch (emailError) {
      console.error('❌ Error sending delivery ETA email:', emailError)
      // Don't fail the request if email fails, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'ETA updated successfully',
      data: {
        orderId: numericOrderId,
        etaMinutes,
        newExpectedDT: newExpectedDT.toISOString(),
        estimatedArrivalTime,
        emailSent: true
      }
    })

  } catch (error) {
    console.error('❌ ETA API: Critical error caught:', error)
    console.error('❌ ETA API: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ ETA API: Error type:', typeof error)
    console.error('❌ ETA API: Error details:', JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : 'No additional details'
      },
      { status: 500 }
    )
  }
}
