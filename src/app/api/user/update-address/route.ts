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

export async function POST(request: NextRequest) {
  try {
    const { userId, address } = await request.json()

    // Validate input
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!address) {
      return NextResponse.json(
        { error: 'Address data is required' },
        { status: 400 }
      )
    }

    // Update address, phone, and instructions fields in the Login table
    const updateData: any = {}
    
    if (address.address) {
      updateData.LocationText = address.address
    }
    
    if (address.phone) {
      updateData.phone = address.phone
    }
    
    if (address.addressInstructions) {
      updateData.addressInstructions = address.addressInstructions
    }

    // Update user information
    const { error: updateError } = await supabase
      .from('Login')
      .update(updateData)
      .eq('LoginID', userId)

    if (updateError) {
      console.error('Error updating address:', updateError)
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Address updated successfully'
    })

  } catch (error) {
    console.error('Update address API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
