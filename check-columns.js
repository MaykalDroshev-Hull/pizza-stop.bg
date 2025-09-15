// Check what columns exist in the orders table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  console.log('🔍 Checking columns in the "orders" table...');
  
  try {
    // Get just one row to see the column structure
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error fetching orders:', error.message);
      return;
    }
    
    console.log('📊 Orders found:', orders?.length || 0);
    
    if (orders && orders.length > 0) {
      console.log('\n🔍 Column names in orders table:');
      const columns = Object.keys(orders[0]);
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col}: ${typeof orders[0][col]} = ${orders[0][col]}`);
      });
      
      console.log('\n📝 Sample order data:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('⚠️  No orders found in database');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkColumns();

