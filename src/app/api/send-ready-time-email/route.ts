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

    await emailService.sendOrderReadyTimeEmail({
      to,
      name,
      orderId,
      readyTimeMinutes,
      orderDetails
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API: Error sending ready time email:', error)
    return NextResponse.json(
      { error: 'Failed to send ready time email' },
      { status: 500 }
    )
  }
}

