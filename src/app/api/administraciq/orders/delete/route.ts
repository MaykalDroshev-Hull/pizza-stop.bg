import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side auth validation
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Admin authentication check - supports both legacy token and Supabase JWT
 */
async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('x-admin-auth');

  if (!authHeader) {
    return false;
  }

  // First try legacy token validation
  const adminToken = process.env.ADMIN_API_TOKEN || 'admin-token';
  if (adminToken && authHeader === adminToken) {
    return true;
  }

  // Then try Supabase JWT validation
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(authHeader);

    if (error || !user) {
      console.error('Supabase JWT validation failed:', error);
      return false;
    }

    // Check if user has admin role
    const userRole = user.user_metadata?.role;
    const canAccess = user.user_metadata?.can_access || [];

    // Must be admin and have admin access
    return userRole === 'admin' && canAccess.includes('admin');
  } catch (error) {
    console.error('Error validating Supabase JWT:', error);
    return false;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // First, delete all order products from LkOrderProduct table
    const { error: deleteProductsError } = await supabase
      .from('LkOrderProduct')
      .delete()
      .eq('OrderID', orderId);

    if (deleteProductsError) {
      console.error('Error deleting order products:', deleteProductsError);
      return NextResponse.json(
        { error: 'Failed to delete order products' },
        { status: 500 }
      );
    }

    // Then, delete the order from Order table
    const { error: deleteOrderError } = await supabase
      .from('Order')
      .delete()
      .eq('OrderID', orderId);

    if (deleteOrderError) {
      console.error('Error deleting order:', deleteOrderError);
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/administraciq/orders/delete:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
