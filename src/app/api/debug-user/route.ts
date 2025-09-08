import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('🔍 Debug user API called with userId:', userId)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Usage: /api/debug-user?userId=123' },
        { status: 400 }
      )
    }

    // Fetch raw user data from database
    const { data: user, error: userError } = await supabase
      .from('Login')
      .select('*')
      .eq('LoginID', userId)
      .single()

    console.log('🔍 Raw database result:', { user, userError })

    if (userError || !user) {
      console.error('🔍 Database error:', userError)
      return NextResponse.json(
        { error: 'User not found', details: userError },
        { status: 404 }
      )
    }

    // Return debug information
    return NextResponse.json({
      debug: {
        userId: userId,
        foundUser: !!user,
        rawDatabaseData: user,
        addressFields: {
          LocationText: user.LocationText || 'EMPTY',
          addressInstructions: user.addressInstructions || 'EMPTY', 
          LocationCoordinates: user.LocationCoordinates || 'EMPTY'
        },
        allFields: Object.keys(user)
      }
    })

  } catch (error) {
    console.error('🔍 Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}

