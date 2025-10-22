import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const config = {
    EMAIL: !!process.env.EMAIL,
    EMAIL_PASS: !!process.env.EMAIL_PASS,
    EMAIL_USER: !!process.env.EMAIL_USER,
    EMAIL_value: process.env.EMAIL ? '***@' + process.env.EMAIL.split('@')[1] : 'NOT SET',
    EMAIL_USER_value: process.env.EMAIL_USER ? '***@' + process.env.EMAIL_USER.split('@')[1] : 'NOT SET',
    EMAIL_PASS_length: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
  }

  const allConfigured = config.EMAIL && config.EMAIL_PASS && config.EMAIL_USER

  return NextResponse.json({
    configured: allConfigured,
    config,
    message: allConfigured 
      ? '✅ All email environment variables are set' 
      : '❌ Missing email environment variables',
    instructions: !allConfigured ? [
      'Create or edit .env.local file in your project root',
      'Add these variables:',
      'EMAIL=your-email@gmail.com',
      'EMAIL_PASS=your-app-password',
      'EMAIL_USER=your-email@gmail.com',
      '',
      'For Gmail, you need an App Password:',
      '1. Go to https://myaccount.google.com/security',
      '2. Enable 2-Step Verification',
      '3. Go to App Passwords',
      '4. Generate new app password',
      '5. Copy the 16-character password',
      '6. Use it as EMAIL_PASS'
    ] : null
  })
}

