import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailService } from '@/utils/emailService'
import crypto from 'crypto'

// Helper function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const { email } = await request.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Имейл адресът е задължителен' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Невалиден формат на имейл адреса' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('Login')
      .select('LoginID, Name, email')
      .eq('email', email)
      .single()

    if (fetchError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'Ако имейл адресът съществува, ще получите линк за възстановяване на паролата'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('Login')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry
      })
      .eq('LoginID', user.LoginID)

    if (updateError) {
      console.error('Error storing reset token:', updateError)
      return NextResponse.json(
        { error: 'Грешка при обработката на заявката' },
        { status: 500 }
      )
    }

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail({
        to: email,
        name: user.Name,
        resetToken,
        resetUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/reset-password?token=${resetToken}`
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return NextResponse.json(
        { error: 'Грешка при изпращането на имейла' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Ако имейл адресът съществува, ще получите линк за възстановяване на паролата'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Вътрешна грешка на сървъра' },
      { status: 500 }
    )
  }
}
