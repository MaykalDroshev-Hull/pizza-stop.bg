import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
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

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json()

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Fetch user to verify current password
    const { data: user, error: fetchError } = await supabase
      .from('Login')
      .select('LoginID, Password')
      .eq('LoginID', userIdNum)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.Password)

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password in database
    const { error: updateError } = await supabase
      .from('Login')
      .update({ Password: hashedNewPassword })
      .eq('LoginID', userIdNum)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Change password API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
