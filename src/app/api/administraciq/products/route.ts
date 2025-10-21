import { NextRequest, NextResponse } from 'next/server';
import { listProducts, upsertProduct, setProductDisabled, deleteProducts } from '@/server/productService.server';
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

export async function GET(req: NextRequest) {
  // Admin authentication required
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try { return NextResponse.json(await listProducts()); }
  catch (e:any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  // Admin authentication required
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try { return NextResponse.json(await upsertProduct(await req.json())); }
  catch (e:any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PUT(req: NextRequest) {
  // Admin authentication required
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  try {
    const { id, isDisabled } = await req.json();
    await setProductDisabled(Number(id), !!isDisabled);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  // Admin authentication required
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }
  
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 });
    }
    
    const productIds = ids.map((id: any) => Number(id));
    const result = await deleteProducts(productIds);
    
    return NextResponse.json({
      success: true,
      deleted: productIds,
      disabled: [], // For future use if we implement soft delete
      message: `Successfully deleted ${result.deletedCount} product${result.deletedCount > 1 ? 's' : ''}`,
      deletedCount: result.deletedCount
    });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
