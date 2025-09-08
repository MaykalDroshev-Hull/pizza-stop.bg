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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user profile information
    const { data: user, error: userError } = await supabase
      .from('Login')
      .select(`
        LoginID,
        Name,
        email,
        phone,
        LocationText,
        LocationCoordinates,
        addressInstructions,
        created_at
      `)
      .eq('LoginID', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse coordinates if available
    let coordinates = null
    if (user.LocationCoordinates) {
      try {
        coordinates = JSON.parse(user.LocationCoordinates)
      } catch (error) {
        console.warn('Failed to parse coordinates:', user.LocationCoordinates)
      }
    }

    // Return user profile with address information
    return NextResponse.json({
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
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
