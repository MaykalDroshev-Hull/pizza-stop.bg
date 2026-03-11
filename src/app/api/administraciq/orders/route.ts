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
      return false;
    }

    // Check if user has admin role
    const userRole = user.user_metadata?.role;
    const canAccess = user.user_metadata?.can_access || [];

    // Must be admin and have admin access
    return userRole === 'admin' && canAccess.includes('admin');
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthorized = await checkAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Fetch all orders with customer information and products
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        LoginID,
        OrderDT,
        TotalAmount,
        DeliveryPrice,
        OrderStatusID,
        Login (
          Name,
          email,
          phone
        ),
        RfOrderStatus (
          OrderStatus
        ),
        LkOrderProduct (
          TotalPrice
        )
      `)
      .order('OrderDT', { ascending: false })
      .limit(500); // Limit to recent 500 orders

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedOrders = (orders || []).map((order: any) => {
      const customerName = order.Login?.Name || 'Неизвестен клиент';
      const orderStatus = order.RfOrderStatus?.[0]?.OrderStatus || 'Неизвестен';
      
      // Calculate total amount from products if TotalAmount is null
      let totalAmount = order.TotalAmount;
      if (!totalAmount && order.LkOrderProduct && order.LkOrderProduct.length > 0) {
        totalAmount = order.LkOrderProduct.reduce((sum: number, product: any) => {
          return sum + (Number(product.TotalPrice) || 0);
        }, 0);
        // Add delivery price if exists
        if (order.DeliveryPrice) {
          totalAmount += Number(order.DeliveryPrice);
        }
      }
      
      // Fallback to 0 if still no amount
      totalAmount = totalAmount || 0;

      return {
        OrderID: order.OrderID,
        CustomerName: customerName,
        TotalAmount: totalAmount,
        OrderDT: order.OrderDT,
        OrderStatus: orderStatus,
      };
    });

    return NextResponse.json({
      orders: transformedOrders,
    });
  } catch (error: any) {
    console.error('Error in GET /api/administraciq/orders:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
