import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { emailService } from '@/utils/emailService'

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
    const { name, email, phone, password } = await request.json()

    // Validate input - all fields are mandatory
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { 
          error: 'Всички полета са задължителни',
          details: {
            name: !name ? 'Името е задължително' : null,
            email: !email ? 'Имейлът е задължителен' : null,
            phone: !phone ? 'Телефонът е задължителен' : null,
            password: !password ? 'Паролата е задължителна' : null
          }
        },
        { status: 400 }
      )
    }

    // Validate name (minimum 2 characters, only letters and spaces)
    const nameRegex = /^[а-яА-Яa-zA-Z\s]{2,50}$/
    if (!nameRegex.test(name.trim())) {
      return NextResponse.json(
        { error: 'Името трябва да е между 2 и 50 символа и да съдържа само букви' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Невалиден формат на имейл адреса' },
        { status: 400 }
      )
    }

    // Validate phone (Bulgarian format: +359XXXXXXXXX or 0XXXXXXXXX)
    const phoneRegex = /^(\+359|0)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Невалиден формат на телефонния номер. Използвайте формат: +359XXXXXXXXX или 0XXXXXXXXX' },
        { status: 400 }
      )
    }

    // Validate password strength (minimum 8 characters, at least one letter and one number)
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

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'Имейл адресът вече се използва',
          suggestion: 'Ако вече имате акаунт, моля влезте в системата',
          action: 'login'
        },
        { status: 409 }
      )
    }

    // Hash password with bcrypt
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user in Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('Login')
      .insert([
        {
          email,
          Password: hashedPassword,
          Name: name,
          phone,
          NumberOfOrders: 0
        }
      ])
      .select('LoginID, Name, email, phone, created_at')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        to: email,
        name: name
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail registration if email fails, just log it
    }

    // Return success response (without password)
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.LoginID,
        name: newUser.Name,
        email: newUser.email,
        phone: newUser.phone,
        created_at: newUser.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
