import { NextRequest, NextResponse } from 'next/server';
import { listProducts, upsertProduct, setProductDisabled, deleteProducts } from '@/server/productService.server';

/**
 * Simple admin authentication check
 * TODO: Replace with proper session-based authentication
 */
function checkAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('x-admin-auth');
  const adminToken = process.env.ADMIN_API_TOKEN;
  
  // For now, require a simple token
  // TODO: Implement proper session validation
  return authHeader === adminToken && !!adminToken;
}

export async function GET(req: NextRequest) {
  // Admin authentication required
  if (!checkAdminAuth(req)) {
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
  if (!checkAdminAuth(req)) {
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
  if (!checkAdminAuth(req)) {
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
  if (!checkAdminAuth(req)) {
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