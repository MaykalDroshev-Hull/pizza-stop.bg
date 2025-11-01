/**
 * Order helper functions
 */

import { createServerClient } from '@/lib/supabase';

/**
 * Get the daily order number for a given order
 * This counts how many orders were placed today before this one
 * @param orderId - The database OrderID
 * @returns The daily order sequence number (1, 2, 3, etc.)
 */
export async function getDailyOrderNumber(orderId: number): Promise<number> {
  try {
    const supabase = createServerClient();
    
    // Get the order details first
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('OrderDT')
      .eq('OrderID', orderId)
      .single();
    
    if (orderError || !order) {
      console.error('❌ Error fetching order:', orderError);
      return orderId; // Fallback to database ID
    }
    
    // Get start of today in the order's timezone
    const orderDate = new Date(order.OrderDT);
    const startOfDay = new Date(orderDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(orderDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Count orders placed before this one today (including this one)
    const { count, error: countError } = await supabase
      .from('Order')
      .select('OrderID', { count: 'exact', head: true })
      .gte('OrderDT', startOfDay.toISOString())
      .lte('OrderDT', order.OrderDT);
    
    if (countError) {
      console.error('❌ Error counting daily orders:', countError);
      return orderId; // Fallback to database ID
    }
    
    const dailyNumber = count || 1;
    console.log(`📊 Order ${orderId} is daily order #${dailyNumber} (${orderDate.toLocaleDateString('bg-BG')})`);
    
    return dailyNumber;
  } catch (error) {
    console.error('❌ Error calculating daily order number:', error);
    return orderId; // Fallback to database ID
  }
}

/**
 * Get daily order count for today
 * @returns Number of orders placed today
 */
export async function getTodayOrderCount(): Promise<number> {
  try {
    const supabase = createServerClient();
    
    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Count orders placed today
    const { count, error } = await supabase
      .from('Order')
      .select('OrderID', { count: 'exact', head: true })
      .gte('OrderDT', startOfDay.toISOString())
      .lte('OrderDT', endOfDay.toISOString());
    
    if (error) {
      console.error('❌ Error counting today orders:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('❌ Error getting today order count:', error);
    return 0;
  }
}

