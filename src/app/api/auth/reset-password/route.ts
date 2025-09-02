import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Токенът и новата парола са задължителни' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Паролата трябва да е поне 8 символа дълга' },
        { status: 400 }
      )
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Паролата трябва да съдържа поне една буква и една цифра' },
        { status: 400 }
      )
    }

    // Find user by reset token
    const { data: user, error: fetchError } = await supabase
      .from('Login')
      .select('LoginID, Name, email')
      .eq('reset_token', token)
      .gte('reset_token_expiry', new Date().toISOString())
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Невалиден или изтекъл токен за възстановяване' },
        { status: 400 }
      )
    }

    // Hash new password
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
        { error: 'Грешка при обновяването на паролата' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Паролата е успешно променена',
      user: {
        id: user.LoginID,
        name: user.Name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Вътрешна грешка на сървъра' },
      { status: 500 }
    )
  }
}
