import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/utils/emailService'

export async function POST(request: NextRequest) {
  try {
    // Get email from request body or use default
    const body = await request.json().catch(() => ({}))
    const email = body.to || 'hm.websiteprovisioning@gmail.com'
    const name = body.name || 'Pizza Stop Test User'

    console.log('🚀 Sending welcome/registration email to:', email)

    await emailService.sendWelcomeEmail({ to: email, name })

    return NextResponse.json({
      message: `Registration email sent successfully to ${email}`,
      sentTo: email,
      timestamp: new Date().toISOString(),
      emailType: 'registration'
    })

  } catch (error: any) {
    console.error('Registration email error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send registration email',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

