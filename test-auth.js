// Test to check if it's auth or table access issue
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eGRuaXFocmdyZWJtYWJ1ZG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTU3NjksImV4cCI6MjcwMjQ3NTc2OX0.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  try {
    console.log('🧪 Testing authentication...')
    
    // Test 1: Check if we can access auth endpoints
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('🔐 Auth test:', authError ? 'Failed' : 'Success')
    if (authError) console.log('  Error:', authError.message)
    
    // Test 2: Try to list tables (this might work even if Product table doesn't)
    console.log('📋 Testing table access...')
    const { data: tableData, error: tableError } = await supabase
      .from('ProductType')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.log('❌ ProductType table error:', tableError.message)
    } else {
      console.log('✅ ProductType table accessible:', tableData?.length || 0, 'rows')
    }
    
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

testAuth()
