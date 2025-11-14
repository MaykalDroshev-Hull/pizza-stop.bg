import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone || phone.trim().length < 3) {
      return NextResponse.json({ customers: [] })
    }

    // Create server-side Supabase client
    const supabase = createServerClient()

    // Search for customers by phone number (partial match)
    // Get the most recent customer records first (by created_at desc)
    const { data: customers, error } = await supabase
      .from('Login')
      .select('LoginID, Name, phone, LocationText, LocationCoordinates, addressInstructions, created_at')
      .ilike('phone', `%${phone.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(10) // Limit to 10 most recent matches

    if (error) {
      console.error('❌ Error searching customers:', error)
      return NextResponse.json({ customers: [] })
    }

    // Return customer data
    return NextResponse.json({ 
      customers: customers || []
    })

  } catch (error) {
    console.error('❌ Customer search error:', error)
    return NextResponse.json({ customers: [] })
  }
}

