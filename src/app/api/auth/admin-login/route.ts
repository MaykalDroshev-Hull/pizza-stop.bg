import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, createRateLimitResponse } from '@/utils/rateLimit'

// Create Supabase client for server-side auth
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force attacks on admin login
    const rateLimit = await withRateLimit(request, 'admin')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.headers)
    }

    const { username, password, type } = await request.json()

    // Validate input
    if (!username || !password || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['admin', 'kitchen', 'delivery', 'printer']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid login type' },
        { status: 400 }
      )
    }

    // Attempt to authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: username, // username is actually email in our setup
      password: password,
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user metadata to check role
    const userRole = authData.user.user_metadata?.role
    const canAccess = authData.user.user_metadata?.can_access || []

    // Check if user has permission to access this role/type
    if (!canAccess.includes(type)) {
      console.error('Access denied:', {
        userRole,
        canAccess,
        attemptedType: type
      })
      return NextResponse.json(
        { 
          error: 'Access denied. Your account does not have permission to access this area.',
          requiredRole: type,
          userRole: userRole
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      type,
      role: userRole,
      user: {
        email: authData.user.email,
        fullName: authData.user.user_metadata?.full_name,
        role: userRole
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token
      },
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

