import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/utils/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    await emailService.sendWelcomeEmail({ to: email, name })

    return NextResponse.json({
      message: 'Test email sent successfully',
      sentTo: email
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

