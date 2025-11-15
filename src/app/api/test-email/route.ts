import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/utils/emailService'

export async function POST(request: NextRequest) {
  try {
    // Send test email to hm.websiteprovisioning@gmail.com
    const email = 'hm.websiteprovisioning@gmail.com'
    const name = 'Pizza Stop Test User'


    await emailService.sendWelcomeEmail({ to: email, name })

    return NextResponse.json({
      message: 'Registration email sent successfully',
      sentTo: email,
      emailType: 'registration'
    })

  } catch (error) {
    console.error('Registration email error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send registration email',
        details: error.message
      },
      { status: 500 }
    )
  }
}

