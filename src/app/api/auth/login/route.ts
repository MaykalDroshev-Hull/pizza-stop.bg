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
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert email to lowercase for consistent database queries
    const normalizedEmail = email.toLowerCase().trim()

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('Login')
      .select('LoginID, Name, email, phone, Password, LocationText, LocationCoordinates, addressInstructions, created_at')
      .eq('email', normalizedEmail)
      .single()
      
    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Невалиден имейл или парола' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.Password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Невалиден имейл или парола' },
        { status: 401 }
      )
    }

    // Parse coordinates if available
    let coordinates = null
    if (user.LocationCoordinates) {
      try {
        let parsedCoords = JSON.parse(user.LocationCoordinates)
        
        // Fix typo in database: "Ing" should be "lng"
        if (parsedCoords && parsedCoords.Ing !== undefined) {
          parsedCoords.lng = parsedCoords.Ing
          delete parsedCoords.Ing
          console.log('Fixed coordinate typo: Ing -> lng')
        }
        
        coordinates = parsedCoords
      } catch (error) {
        console.warn('Failed to parse coordinates:', user.LocationCoordinates)
      }
    }

    // Return user data (without password)
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.LoginID,
        name: user.Name,
        email: user.email,
        phone: user.phone,
        LocationText: user.LocationText || '',
        LocationCoordinates: user.LocationCoordinates || '',
        addressInstructions: user.addressInstructions || '',
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
