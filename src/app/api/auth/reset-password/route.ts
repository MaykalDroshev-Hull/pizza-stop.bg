import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

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
    const { token, password } = await request.json()

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Невалиден или липсващ токен за възстановяване' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Паролата е задължителна' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Паролата трябва да бъде поне 6 символа дълга' },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const { data: user, error: fetchError } = await supabase
      .from('Login')
      .select('LoginID, reset_token, reset_token_expiry')
      .eq('reset_token', token)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Невалиден или изтекъл токен за възстановяване' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const tokenExpiry = new Date(user.reset_token_expiry)
    
    if (now > tokenExpiry) {
      return NextResponse.json(
        { error: 'Токенът за възстановяване е изтекъл. Моля, заявете нов линк' },
        { status: 400 }
      )
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('Login')
      .update({
        Password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null
      })
      .eq('LoginID', user.LoginID)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Грешка при възстановяването на паролата' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Паролата е възстановена успешно'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Вътрешна грешка на сървъра' },
      { status: 500 }
    )
  }
}