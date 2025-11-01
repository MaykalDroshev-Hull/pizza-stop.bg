// Check what columns exist in the orders table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  
  try {
    // Get just one row to see the column structure
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching orders:');
      return;
    }
    
    
    if (orders && orders.length > 0) {
      const columns = Object.keys(orders[0]);
     
      
     
    } else {
      console.error('⚠️  No orders found');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkColumns();

