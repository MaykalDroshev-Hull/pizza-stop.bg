import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { emailService } from '@/utils/emailService'
import { calculateServerSidePrice, validatePriceMatch } from '@/utils/priceCalculation'
import { orderConfirmationSchema } from '@/utils/zodSchemas'
import { withRateLimit, createRateLimitResponse } from '@/utils/rateLimit'
import { encryptOrderId } from '@/utils/orderEncryption'

// Helper function to get payment method name
function getPaymentMethodName(paymentMethodId: number): string {
  const paymentMethods: { [key: number]: string } = {
    1: 'С карта в ресторант',
    2: 'В брой в ресторант',
    3: 'С карта на адрес',
    4: 'В брой на адрес',
    5: 'Онлайн'
  }
  return paymentMethods[paymentMethodId] || 'Неизвестен метод'
}

export async function POST(request: NextRequest) {
  const requestId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
 
  try {
    // Rate limiting
    const rateLimit = await withRateLimit(request, 'order')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.headers)
    }

    // Parse and validate request body
    const body = await request.json()

    // Validate with Zod
    const validationResult = orderConfirmationSchema.safeParse(body)
    if (!validationResult.success) {
      console.error(`❌ [${requestId}] Order validation failed:`, validationResult.error.flatten())
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        },
        {
          status: 400,
          headers: rateLimit.headers
        }
      )
    }

    const {
      customerInfo,
      orderItems,
      orderTime,
      orderType,
      deliveryCost,
      totalPrice,
      isCollection = false,
      paymentMethodId,
      loginId
    } = validationResult.data

    // Create Supabase client
    const supabase = createServerClient()

    // Calculate server-side prices
    const serverSideCalculation = await calculateServerSidePrice(orderItems, isCollection)

    // Validate price match
    const priceValidation = validatePriceMatch(serverSideCalculation.totalPrice, totalPrice)
    if (!priceValidation.isValid) {
      console.error(`❌ [${requestId}] Price validation failed:`, priceValidation)
      return NextResponse.json(
        {
          error: 'Price validation failed',
          details: priceValidation
        },
        {
          status: 400,
          headers: rateLimit.headers
        }
      )
    }

    // 1. Create order record
    const orderInsertData = {
      LoginID: loginId || null,
      OrderDT: new Date().toISOString(),
      ExpectedDT: orderTime.scheduledTime || null,
      OrderLocation: customerInfo.LocationText || null,
      OrderLocationCoordinates: customerInfo.LocationCoordinates || null,
      TotalAmount: serverSideCalculation.totalPrice + (deliveryCost || 0),
      ItemsTotal: serverSideCalculation.totalPrice,
      DeliveryPrice: deliveryCost || 0,
      IsCollection: isCollection,
      PaymentMethodID: paymentMethodId,
      OrderStatusID: 1, // Pending payment for online orders
      OrderType: orderType === 'user' ? 1 : 0, // 1 = registered user, 0 = guest
      Comments: null,
      addressInstructions: null
    }

    const { data: orderData, error: orderError } = await supabase
      .from('Orders')
      .insert([orderInsertData])
      .select('OrderID')
      .single()

    if (orderError) {
      console.error(`❌ [${requestId}] Order creation failed:`, orderError)
      throw new Error('Failed to create order')
    }

    const orderId = orderData.OrderID

    // 2. Create order items
    const orderItemsInsert = orderItems.map(item => ({
      OrderID: orderId,
      ProductID: item.id,
      ProductName: item.name,
      ProductSize: item.size || null,
      Quantity: item.quantity,
      UnitPrice: item.price,
      TotalPrice: item.price * item.quantity,
      Addons: item.addons ? JSON.stringify(item.addons) : null,
      Comment: item.comment || null
    }))

    const { error: itemsError } = await supabase
      .from('OrderItems')
      .insert(orderItemsInsert)

    if (itemsError) {
      console.error(`❌ [${requestId}] Order items creation failed:`, itemsError)
      throw new Error('Failed to create order items')
    }


    // 3. Update user profile if logged in
    if (loginId && orderType === 'user') {
      const { error: userUpdateError } = await supabase
        .from('Login')
        .update({
          Name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          LocationText: customerInfo.LocationText,
          LocationCoordinates: customerInfo.LocationCoordinates
        })
        .eq('id', loginId)

      if (userUpdateError) {
        console.warn(`⚠️ [${requestId}] User profile update failed:`, userUpdateError)
        // Don't fail the order for this
      }
    }
    
    // Store ORDER number in Comments for lookup in callback
    await supabase
      .from('Orders')
      .update({
        Comments: `Pending payment. Will be updated after BORICA callback.`
      })
      .eq('OrderID', orderId)

    // Generate Datecs payment request
    const { createDatecsService } = await import('@/utils/datecsPayment')
    const datecsService = createDatecsService()

    const paymentRequest = await datecsService.generatePaymentRequest(
      orderId.toString(),
      serverSideCalculation.totalPrice + (deliveryCost || 0),
      {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      },
      `Pizza Stop Order #${orderId}`
    )

    // Store ORDER number in database for callback lookup
    await supabase
      .from('Orders')
      .update({
        Comments: `ORDER:${paymentRequest.ORDER} | Pending payment confirmation from BORICA`
      })
      .eq('OrderID', orderId)

    // Generate HTML form for auto-submission to BORICA
    const paymentFormHtml = datecsService.generatePaymentForm(paymentRequest)

    // 5. Send confirmation email
    try {
      await emailService.sendOrderConfirmationEmail({
        to: customerInfo.email,
        name: customerInfo.name,
        orderId: orderId.toString(),
        orderDetails: {
          items: orderItems.map(item => ({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            addons: item.addons ? item.addons.map(addon => ({
              name: addon.Name || addon.name || '',
              price: addon.Price || addon.price
            })) : undefined,
            comment: item.comment
          })),
          totalAmount: serverSideCalculation.totalPrice + (deliveryCost || 0),
          orderTime: orderTime.scheduledTime ? new Date(orderTime.scheduledTime).toLocaleString('bg-BG') : new Date().toLocaleString('bg-BG'),
          orderType: orderType,
          paymentMethod: getPaymentMethodName(paymentMethodId),
          location: customerInfo.LocationText || '',
          estimatedTime: orderTime.scheduledTime ? new Date(orderTime.scheduledTime).toLocaleString('bg-BG') : undefined
        }
      })
    } catch (emailError) {
      console.warn(`⚠️ [${requestId}] Email sending failed:`, emailError)
      // Don't fail the order for email issues
    }

    // Return HTML form for auto-submission to BORICA
    return new NextResponse(paymentFormHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...rateLimit.headers
      }
    })

  } catch (error: any) {
    console.error(`❌ [${requestId}] Payment initiation failed:`, error)

    return NextResponse.json(
      {
        error: error.message || 'Payment initiation failed',
        requestId
      },
      { status: 500 }
    )
  }
}
