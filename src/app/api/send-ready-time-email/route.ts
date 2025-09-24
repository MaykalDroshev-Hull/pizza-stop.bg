import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '../../../utils/emailService'

export async function POST(request: NextRequest) {
  try {
    const { 
      to, 
      name, 
      orderId, 
      readyTimeMinutes, 
      orderDetails 
    } = await request.json()

    if (!to || !name || !orderId || !readyTimeMinutes || !orderDetails) {
      return NextResponse.json(
        { error: 'Missing required email parameters' },
        { status: 400 }
      )
    }

    console.log(`API: Sending ready time email for order ${orderId} to ${to}`)

    await emailService.sendOrderReadyTimeEmail({
      to,
      name,
      orderId,
      readyTimeMinutes,
      orderDetails
    })

    console.log(`API: Ready time email sent successfully for order ${orderId}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API: Error sending ready time email:', error)
    return NextResponse.json(
      { error: 'Failed to send ready time email' },
      { status: 500 }
    )
  }
}
