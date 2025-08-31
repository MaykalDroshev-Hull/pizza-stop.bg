// Simple test script to query Supabase database
// Run this with: node test-db.js

const { createClient } = require('@supabase/supabase-js')

// Your credentials from .env.local
const supabaseUrl = 'https://ktxdniqhrgjebmabudoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eGRuaXFocmdyZWJtYWJ1ZG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTU3NjksImV4cCI6MjcwMjQ3NTc2OX0.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test 1: Check if we can connect
    console.log('🧪 Test 1: Basic connection test...')
    const { data: testData, error: testError } = await supabase
      .from('Product')
      .select('count')
      .limit(1)
    
    console.log('✅ Connection test result:', testData)
    console.log('❌ Connection test error:', testError)
    
    // Test 2: Get all products
    console.log('\n🧪 Test 2: Fetching all products...')
    const { data: products, error } = await supabase
      .from('Product')
      .select('*')
      .eq('IsDisabled', 0)
      .order('ProductTypeID', { ascending: true })
      .order('Product', { ascending: true })
    
    console.log('✅ Products fetched:', products?.length || 0)
    console.log('❌ Fetch error:', error)
    
    if (products && products.length > 0) {
      console.log('\n📊 Sample products:')
      products.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.Product} (TypeID: ${product.ProductTypeID}, Price: ${product.SmallPrice}лв)`)
      })
      
      // Test 3: Get just pizzas
      console.log('\n🧪 Test 3: Fetching only pizzas (ProductTypeID = 1)...')
      const { data: pizzas, error: pizzaError } = await supabase
        .from('Product')
        .select('*')
        .eq('ProductTypeID', 1)
        .eq('IsDisabled', 0)
      
      console.log('✅ Pizzas found:', pizzas?.length || 0)
      console.log('❌ Pizza fetch error:', pizzaError)
      
      if (pizzas && pizzas.length > 0) {
        console.log('\n🍕 Pizzas in database:')
        pizzas.forEach((pizza, index) => {
          console.log(`${index + 1}. ${pizza.Product} - Small: ${pizza.SmallPrice}лв, Large: ${pizza.LargePrice || 'N/A'}лв`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

testDatabase()
