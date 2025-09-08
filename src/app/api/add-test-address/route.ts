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
    const { userId } = await request.json()

    console.log('🔧 Adding test address data for userId:', userId)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Add test address data
    const testData = {
      LocationText: 'ул. Васил Левски 15, Ловеч 5500, България',
      addressInstructions: 'Втори етаж, апартамент 12. Звънете на домофона.',
      LocationCoordinates: JSON.stringify({ lat: 43.1353, lng: 24.7258 })
    }

    const { error: updateError } = await supabase
      .from('Login')
      .update(testData)
      .eq('LoginID', userId)

    if (updateError) {
      console.error('🔧 Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to add test data', details: updateError },
        { status: 500 }
      )
    }

    console.log('🔧 Successfully added test address data')

    return NextResponse.json({
      message: 'Test address data added successfully',
      data: testData
    })

  } catch (error) {
    console.error('🔧 Add test address API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

