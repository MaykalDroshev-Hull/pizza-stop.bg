import { NextRequest, NextResponse } from 'next/server';
import {
  listAddons,
  upsertAddon,
  setAddonDisabled,
  deleteAddons
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

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await listAddons());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await upsertAddon(await req.json()));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id, isDisabled } = await req.json();
    await setAddonDisabled(Number(id), !!isDisabled);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid addon IDs' }, { status: 400 });
    }
    const result = await deleteAddons(ids.map((id: any) => Number(id)));
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
