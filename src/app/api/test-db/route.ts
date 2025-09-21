import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'FOUND' : 'MISSING',
    key: supabaseServiceKey ? 'FOUND' : 'MISSING'
  })
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    console.log('Testing database connection...')
    
    // Check if we can connect to the database
    const { data: testData, error: testError } = await supabase
      .from('Login')
      .select('LoginID, Name, email')
      .limit(1)
    
    if (testError) {
      console.error('Database connection test failed:', testError)
      return NextResponse.json({
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }
    
    console.log('Database connection successful')
    console.log('Test data:', testData)
    
    // Check Order table structure
    const { data: orderTest, error: orderError } = await supabase
      .from('Order')
      .select('*')
      .limit(1)
    
    console.log('Order table test:', orderTest)
    console.log('Order table error:', orderError)
    
    // Check if there are any orders at all
    const { count: orderCount, error: countError } = await supabase
      .from('Order')
      .select('*', { count: 'exact', head: true })
    
    console.log('Total orders in database:', orderCount)
    console.log('Count error:', countError)
    
    // Check Login table count
    const { count: loginCount, error: loginCountError } = await supabase
      .from('Login')
      .select('*', { count: 'exact', head: true })
    
    console.log('Total users in database:', loginCount)
    console.log('Login count error:', loginCountError)
    
    return NextResponse.json({
      message: 'Database test completed',
      connection: 'successful',
      testData,
      orderTest,
      orderCount,
      loginCount,
      orderError: orderError?.message,
      countError: countError?.message,
      loginCountError: loginCountError?.message
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
