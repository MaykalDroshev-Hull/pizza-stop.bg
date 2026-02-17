import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser, sanitizeInput } from '@/utils/auth'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ✅ SECURE GET METHOD - requires authentication
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER
    const { error: authError, status: authStatus, user: authUser } = await getAuthenticatedUser(request)

    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }

    // 2. GET REQUESTED USER ID
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

    // 3. VERIFY USER CAN ONLY ACCESS THEIR OWN DATA
    if (authUser.LoginID !== userIdNum) {
      return NextResponse.json(
        { error: 'Забранен достъп - можете да достъпвате само собствения си профил' },
        { status: 403 }
      )
    }

    // 4. FETCH USER PROFILE
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
      .eq('LoginID', userIdNum)
      .single()

    if (userError || !user) {
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
      } catch {
        // Failed to parse coordinates
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ✅ SECURE PUT METHOD - requires authentication + input sanitization
export async function PUT(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER
    const { error: authError, status: authStatus, user: authUser } = await getAuthenticatedUser(request)

    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }

    // 2. GET REQUEST BODY
    const body = await request.json()
    let { userId, name, email, phone } = body

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

    // 3. VERIFY USER CAN ONLY UPDATE THEIR OWN DATA
    if (authUser.LoginID !== userIdNum) {
      return NextResponse.json(
        { error: 'Забранен достъп - можете да обновявате само собствения си профил' },
        { status: 403 }
      )
    }

    // 4. VALIDATE REQUIRED FIELDS
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    // ✅ 5. INPUT SANITIZATION - REJECT MALICIOUS CONTENT
    name = name.trim()

    const nameSanitization = sanitizeInput(name, 'Името')
    if (!nameSanitization.safe) {
      return NextResponse.json(
        { error: nameSanitization.reason },
        { status: 400 }
      )
    }

    // Limit name length
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Името е твърде дълго (максимум 100 символа)' },
        { status: 400 }
      )
    }

    // 6. VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // 7. VALIDATE PHONE FORMAT (Bulgarian phone numbers)
    const phoneRegex = /^(\+359|0)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Please use Bulgarian phone number format (e.g., 0888123456 or +359888123456)' },
        { status: 400 }
      )
    }

    // 8. CHECK IF EMAIL IS TAKEN BY ANOTHER USER
    const { data: existingUser, error: checkError } = await supabase
      .from('Login')
      .select('LoginID, email')
      .eq('email', email)
      .neq('LoginID', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
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

    // 9. UPDATE USER PROFILE
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
