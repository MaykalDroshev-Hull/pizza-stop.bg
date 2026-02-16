import { NextRequest, NextResponse } from 'next/server';
import {
  getProductsForAddon,
  setProductsForAddon,
  getAllAddonAssignments,
  listProductsForAssignment
} from '@/server/addonService.server';
import { createClient } from '@supabase/supabase-js';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('x-admin-auth');
  if (!authHeader) return false;

  const adminToken = process.env.ADMIN_API_TOKEN || 'admin-token';
  if (adminToken && authHeader === adminToken) return true;

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(authHeader);
    if (error || !user) return false;
    const userRole = user.user_metadata?.role;
    const canAccess = user.user_metadata?.can_access || [];
    return userRole === 'admin' && canAccess.includes('admin');
  } catch {
    return false;
  }
}

/**
 * GET - fetch products assigned to a specific addon, all assignments, or all products for the assignment UI
 * Query params:
 *   ?addonId=X   -> returns ProductIDs for that addon
 *   ?all=true    -> returns all assignments as a map
 *   ?products=true -> returns all products for the assignment UI
 */
export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const addonId = searchParams.get('addonId');
    const all = searchParams.get('all');
    const products = searchParams.get('products');

    if (products === 'true') {
      return NextResponse.json(await listProductsForAssignment());
    }

    if (all === 'true') {
      return NextResponse.json(await getAllAddonAssignments());
    }

    if (addonId) {
      const productIds = await getProductsForAddon(Number(addonId));
      return NextResponse.json({ addonId: Number(addonId), productIds });
    }

    return NextResponse.json({ error: 'Provide addonId, all=true, or products=true' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

/**
 * POST - set product assignments for an addon
 * Body: { addonId: number, productIds: number[] }
 */
export async function POST(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { addonId, productIds } = await req.json();
    if (!addonId || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const result = await setProductsForAddon(Number(addonId), productIds.map(Number));
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
