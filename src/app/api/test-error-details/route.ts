import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/utils/emailService'

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json().catch(() => ({ to: 'hm.websiteprovisioning@gmail.com' }))
    
    console.log('🔍 Testing email with:')
    console.log('  EMAIL:', process.env.EMAIL)
    console.log('  EMAIL_USER:', process.env.EMAIL_USER)
    console.log('  EMAIL_PASS length:', process.env.EMAIL_PASS?.length)
    console.log('  To:', to)
    
    await emailService.sendWelcomeEmail({ to, name: 'Test User' })
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      config: {
        EMAIL: !!process.env.EMAIL,
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS
      }
    })
  } catch (error: any) {
    console.error('❌ Detailed error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      config: {
        EMAIL: !!process.env.EMAIL ? 'Set' : 'Not Set',
        EMAIL_USER: !!process.env.EMAIL_USER ? 'Set' : 'Not Set',
        EMAIL_PASS: !!process.env.EMAIL_PASS ? 'Set' : 'Not Set',
        EMAIL_value: process.env.EMAIL,
        EMAIL_USER_value: process.env.EMAIL_USER
      }
    }, { status: 500 })
  }
}

