import { NextRequest, NextResponse } from 'next/server';
import { softDeleteProducts } from '@/server/productService.server';
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
  const adminToken = process.env.ADMIN_API_TOKEN;
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

export async function POST(request: NextRequest) {
  // Admin authentication required
  if (!(await checkAdminAuth(request))) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const result = await softDeleteProducts(ids);
    
    return NextResponse.json({
      success: true,
      message: `Successfully soft deleted ${ids.length} product${ids.length > 1 ? 's' : ''}`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error soft deleting products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to soft delete products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
