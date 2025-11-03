// Simple test script to query Supabase database
// Run this with: node test-db.js

const { createClient } = require('@supabase/supabase-js')

// Your credentials from .env.local
const supabaseUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eGRuaXFocmdyZWJtYWJ1ZG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTU3NjksImV4cCI6MjcwMjQ3NTc2OX0.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  
  try {
    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabase
      .from('Product')
      .select('count')
      .limit(1)
    
    // Test 2: Get all products
    const { data: products, error } = await supabase
      .from('Product')
      .select('*')
      .eq('IsDisabled', 0)
      .order('ProductTypeID', { ascending: true })
      .order('Product', { ascending: true })
    
    
    if (products && products.length > 0) {
      products.slice(0, 3)

      // Test 3: Get just pizzas
      const { data: pizzas, error: pizzaError } = await supabase
        .from('Product')
        .select('*')
        .eq('ProductTypeID', 1)
        .eq('IsDisabled', 0)
      
      
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

testDatabase()
