import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { orderId, statusId } = await request.json();

    if (!orderId || !statusId) {
      return NextResponse.json(
        { error: 'Order ID and Status ID are required' },
        { status: 400 }
      );
    }

    console.log(`API: Updating order ${orderId} to status ${statusId}`);

    // First check if order exists
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('Order')
      .select('OrderID, OrderStatusID')
      .eq('OrderID', orderId)
      .single();

    if (fetchError) {
      console.error('API: Error fetching order:', fetchError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update the order status
    const { data, error } = await supabaseAdmin
      .from('Order')
      .update({ OrderStatusID: statusId })
      .eq('OrderID', orderId)
      .select();

    if (error) {
      console.error('API: Error updating order status:', error);
      return NextResponse.json(
        { error: 'Failed to update order status', details: error.message },
        { status: 500 }
      );
    }

    console.log('API: Successfully updated order status:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('API: Exception in update order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
