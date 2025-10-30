import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { orderId, statusId, readyTime, comments } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Handle ready time update
    if (readyTime) {
      console.log(`API: Updating order ${orderId} ready time to ${readyTime}`);

      // First check if order exists
      const { data: existingOrder, error: fetchError } = await supabaseAdmin
        .from('Order')
        .select('OrderID')
        .eq('OrderID', orderId)
        .single();

      if (fetchError) {
        console.error('API: Error fetching order:', fetchError);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Update the order ready time
      const { data, error } = await supabaseAdmin
        .from('Order')
        .update({ ReadyTime: readyTime })
        .eq('OrderID', orderId)
        .select();

      if (error) {
        console.error('API: Error updating order ready time:', error);
        return NextResponse.json(
          { error: 'Failed to update order ready time', details: error.message },
          { status: 500 }
        );
      }

      console.log('API: Successfully updated order ready time:', data);
      return NextResponse.json({ success: true, data });
    }

    // Handle status update
    if (!statusId) {
      return NextResponse.json(
        { error: 'Status ID is required for status updates' },
        { status: 400 }
      );
    }

    console.log(`API: Updating order ${orderId} to status ${statusId}${comments ? ` with comments: ${comments}` : ''}`);

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

    // Prepare update object
    const updateData: any = { OrderStatusID: statusId };
    if (comments !== undefined) {
      updateData.Comments = comments;
    }

    // Update the order status and/or comments
    const { data, error } = await supabaseAdmin
      .from('Order')
      .update(updateData)
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
    console.error('API: Exception in update order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
