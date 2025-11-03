// Simple test to debug the API key issue
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eGRuaXFocmdyZWJtYWJ1ZG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTU3NjksImV4cCI6MjcwMjQ3NTc2OX0.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSimple() {
  try {
    
    // Test 1: Just try to connect
    const { data, error } = await supabase
      .from('Product')
      .select('ProductID')
      .limit(1)
    
    if (error) {
      console.error('  Message:', error.message)
    } 
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

testSimple()
