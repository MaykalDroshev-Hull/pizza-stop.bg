import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/utils/zodSchemas'
import { withRateLimit, createRateLimitResponse } from '@/utils/rateLimit'
import { generateToken } from '@/utils/auth'

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
  let rateLimitHeaders: Record<string, string> = {}

  try {
    // ✅ IMPROVED RATE LIMITING WITH ERROR HANDLING
    try {
      const rateLimit = await withRateLimit(request, 'login')
      rateLimitHeaders = rateLimit.headers
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit.headers)
      }
    } catch (rateLimitError) {
      // Rate limit check failed - continue processing (fail open)
      // In production, consider failing closed (return 503)
    }

    const supabase = createSupabaseClient()
    const body = await request.json()

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password format',
          details: validationResult.error.flatten().fieldErrors
        },
        { 
          status: 400,
          headers: rateLimitHeaders
        }
      )
    }

    const { email, password } = validationResult.data

    // Convert email to lowercase for consistent database queries
    const normalizedEmail = email.toLowerCase().trim()

    // First, try to find a real account (hashed password)
    let { data: user, error: fetchError } = await supabase
      .from('Login')
      .select('LoginID, Name, email, phone, Password, LocationText, LocationCoordinates, addressInstructions, created_at')
      .eq('email', normalizedEmail)
      .neq('Password', 'guest_password') // Exclude guest accounts
      .single()
    
    // If no real account found, check if there are guest accounts (for better error messaging)
    if (fetchError && fetchError.code === 'PGRST116') { // No rows found
      const { data: guestAccounts } = await supabase
        .from('Login')
        .select('LoginID')
        .eq('email', normalizedEmail)
        .eq('Password', 'guest_password')
        .limit(1);
      
      if (guestAccounts && guestAccounts.length > 0) {
        return NextResponse.json(
          { error: 'Този имейл е регистриран като гост акаунт. Моля, създайте реална парола чрез "Забравена парола" или се регистрирайте отново.' },
          { status: 401 }
        )
      }
    }
      
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

    // ✅ GENERATE JWT TOKEN
    const token = await generateToken(user.LoginID, user.email)

    // Parse coordinates if available
    let coordinates = null
    if (user.LocationCoordinates) {
      try {
        let parsedCoords = JSON.parse(user.LocationCoordinates)
        
        // Fix typo in database: "Ing" should be "lng"
        if (parsedCoords && parsedCoords.Ing !== undefined) {
          parsedCoords.lng = parsedCoords.Ing
          delete parsedCoords.Ing
        }
        
        coordinates = parsedCoords
      } catch {
        // Failed to parse coordinates
      }
    }

    // Return user data (without password) + JWT token
    return NextResponse.json({
      message: 'Login successful',
      token, // ✅ JWT token for subsequent API calls
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
