import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateUserSession } from '@/utils/sessionAuth'

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

    const userIdNum = parseInt(userId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // SECURITY: Validate user authorization (prevent IDOR)
    const authValidation = await validateUserSession(request, userIdNum)
    if (!authValidation.isValid) {
      return NextResponse.json(
        { error: authValidation.error || 'Unauthorized access' },
        { status: 401 }
      )
    }

    // Fetch user profile information
    const { data: user, error: userError} = await supabase
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
      .eq('LoginID', userIdNum)
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, email, phone } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdNum = parseInt(userId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // SECURITY: Validate user authorization (prevent IDOR)
    const authValidation = await validateUserSession(request, userIdNum)
    if (!authValidation.isValid) {
      return NextResponse.json(
        { error: authValidation.error || 'Unauthorized access' },
        { status: 401 }
      )
    }

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format (Bulgarian phone numbers)
    const phoneRegex = /^(\+359|0)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Please use Bulgarian phone number format (e.g., 0888123456 or +359888123456)' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('Login')
      .select('LoginID, email')
      .eq('email', email)
      .neq('LoginID', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing email:', checkError)
      return NextResponse.json(
        { error: 'Error checking email availability' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 400 }
      )
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('Login')
      .update({
        Name: name,
        email: email,
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq('LoginID', userIdNum)
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
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return updated user profile
    return NextResponse.json({
      user: {
        id: updatedUser.LoginID,
        name: updatedUser.Name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        LocationText: updatedUser.LocationText || '',
        LocationCoordinates: updatedUser.LocationCoordinates || '',
        addressInstructions: updatedUser.addressInstructions || '',
        created_at: updatedUser.created_at
      },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}