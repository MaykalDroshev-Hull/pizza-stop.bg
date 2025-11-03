// src/app/api/payment/callback/route.ts
// Callback endpoint for BORICA APGW responses

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createDatecsService } from '@/utils/datecsPayment'
import { DatecsPaymentResponse } from '@/types/datecs'
import { Logger } from '@/utils/logger'

/**
 * POST handler for BORICA payment callback
 * Receives payment result from BORICA gateway and updates order status
 * 
 * This endpoint is called by BORICA's gateway after payment processing
 * The cardholder's browser is redirected here with payment result
 */
export async function POST(request: NextRequest) {
  const requestId = `CB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    // Parse form data from BORICA
    const formData = await request.formData()
    
    // Convert FormData to DatecsPaymentResponse object
    const response: DatecsPaymentResponse = {
      ACTION: formData.get('ACTION') as string || '',
      RC: formData.get('RC') as string || '',
      STATUSMSG: formData.get('STATUSMSG') as string || '',
      TERMINAL: formData.get('TERMINAL') as string || '',
      TRTYPE: formData.get('TRTYPE') as string || '',
      AMOUNT: formData.get('AMOUNT') as string || undefined,
      CURRENCY: formData.get('CURRENCY') as string || undefined,
      ORDER: formData.get('ORDER') as string || '',
      LANG: formData.get('LANG') as string || undefined,
      TIMESTAMP: formData.get('TIMESTAMP') as string || '',
      TRAN_DATE: formData.get('TRAN_DATE') as string || undefined,
      TRAN_TRTYPE: formData.get('TRAN_TRTYPE') as string || undefined,
      APPROVAL: formData.get('APPROVAL') as string || undefined,
      RRN: formData.get('RRN') as string || undefined,
      INT_REF: formData.get('INT_REF') as string || '',
      PARES_STATUS: formData.get('PARES_STATUS') as string || undefined,
      AUTH_STEP_RES: formData.get('AUTH_STEP_RES') as string || undefined,
      CARDHOLDERINFO: formData.get('CARDHOLDERINFO') as string || undefined,
      ECI: formData.get('ECI') as string || undefined,
      CARD: formData.get('CARD') as string || undefined,
      CARD_BRAND: formData.get('CARD_BRAND') as string || undefined,
      NONCE: formData.get('NONCE') as string || '',
      P_SIGN: formData.get('P_SIGN') as string || ''
    }

    // Initialize Datecs service
    const datecsService = createDatecsService()

    // Verify signature
    const isSignatureValid = await datecsService.verifyResponse(response)

    if (!isSignatureValid) {
      console.error(`❌ [${requestId}] Invalid signature from BORICA!`)
      Logger.error('Payment callback signature verification failed', {
        requestId,
        order: response.ORDER,
        intRef: response.INT_REF
      })

      // Redirect to error page
      return NextResponse.redirect(
        new URL(`/payment-error?reason=invalid_signature`, request.url)
      )
    }

    // Initialize Supabase client
    const supabase = createServerClient()

    // Find order by ORDER number
    // Note: ORDER field from BORICA is the 6-digit order number we generated
    // We need to find the corresponding OrderID in our database

    // Look up order in OrderItems table to find OrderID
    // We stored the ORDER number in AD.CUST_BOR_ORDER_ID which starts with ORDER
    const { data: orderData, error: orderFindError } = await supabase
      .from('Orders')
      .select('OrderID, OrderStatusID, TotalAmount')
      .ilike('Comments', `%ORDER:${response.ORDER}%`)
      .or(`Comments.ilike.%${response.ORDER}%`)
      .order('OrderDT', { ascending: false })
      .limit(1)
      .single()

    if (orderFindError || !orderData) {
      console.error(`❌ [${requestId}] Order not found:`, orderFindError)
      
      // Log the failed lookup attempt
      Logger.error('Payment callback - order not found', {
        requestId,
        orderNumber: response.ORDER,
        error: orderFindError
      })

      // Still redirect but with warning
      return NextResponse.redirect(
        new URL(`/payment-error?reason=order_not_found&order=${response.ORDER}`, request.url)
      )
    }

    const orderId = orderData.OrderID
    // Check if payment is successful
    const isSuccess = datecsService.isPaymentSuccessful(response)
    const isDeclined = datecsService.isPaymentDeclined(response)

    // Determine new order status
    let newOrderStatusId: number
    let statusMessage: string

    if (isSuccess) {
      newOrderStatusId = 2 // Paid / Confirmed
      statusMessage = 'Payment successful'
    } else if (isDeclined) {
      newOrderStatusId = 6 // Payment failed
      statusMessage = datecsService.getErrorMessage(response)
    } else {
      newOrderStatusId = 6 // Payment failed
      statusMessage = 'Payment processing error'
      console.error(`⚠️ Payment ERROR`)
    }

    // Update order status in database
    
    const { error: updateError } = await supabase
      .from('Orders')
      .update({
        OrderStatusID: newOrderStatusId,
        Comments: `Payment ${isSuccess ? 'successful' : 'failed'}. RC: ${response.RC}. BORICA Ref: ${response.INT_REF}. ${response.STATUSMSG || ''}`
      })
      .eq('OrderID', orderId)

    if (updateError) {
      console.error(`❌ [${requestId}] Failed to update order:`, updateError)
      Logger.error('Failed to update order status after payment', {
        requestId,
        orderId,
        error: updateError
      })
    } 
    // Store payment transaction record
    
    const { error: transactionError } = await supabase
      .from('PaymentTransactions')
      .insert({
        OrderID: orderId,
        TransactionType: 'BORICA_PAYMENT',
        TransactionStatus: isSuccess ? 'SUCCESS' : 'FAILED',
        Amount: response.AMOUNT ? parseFloat(response.AMOUNT) : null,
        Currency: response.CURRENCY || 'BGN',
        PaymentGatewayRef: response.INT_REF,
        PaymentGatewayResponse: JSON.stringify(response),
        ResponseCode: response.RC,
        ResponseMessage: response.STATUSMSG || statusMessage,
        CardMasked: response.CARD || null,
        CardBrand: response.CARD_BRAND || null,
        ApprovalCode: response.APPROVAL || null,
        RRN: response.RRN || null,
        TransactionDT: new Date().toISOString()
      })

    if (transactionError) {
      console.warn(`⚠️ [${requestId}] Failed to store transaction record:`, transactionError)
      // Don't fail the callback for this
    } 
    // Log successful callback processing
    Logger.info('Payment callback processed successfully', {
      requestId,
      orderId,
      orderNumber: response.ORDER,
      success: isSuccess,
      amount: response.AMOUNT,
      intRef: response.INT_REF
    })

    // Redirect user to appropriate page
    if (isSuccess) {
      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/order-success?orderId=${orderId}&ref=${response.INT_REF}`, request.url)
      )
    } else {
      // Redirect to error page
      return NextResponse.redirect(
        new URL(`/payment-error?orderId=${orderId}&reason=${response.RC}&message=${encodeURIComponent(statusMessage)}`, request.url)
      )
    }

  } catch (error: any) {
    console.error(`❌ [${requestId}] Callback processing failed:`, error)
    
    Logger.error('Payment callback processing error', {
      requestId,
      error: error.message,
      stack: error.stack
    })

    // Redirect to generic error page
    return NextResponse.redirect(
      new URL('/payment-error?reason=processing_error', request.url)
    )
  }
}

/**
 * GET handler for direct callback URL access (not recommended)
 * BORICA should POST to this endpoint
 */
export async function GET(request: NextRequest) {
  
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint expects POST requests from BORICA payment gateway'
    },
    { status: 405 }
  )
}

