import { NextResponse } from 'next/server';
import { listProducts, upsertProduct, setProductDisabled } from '@/server/productService.server';

export async function GET() {
  try { return NextResponse.json(await listProducts()); }
  catch (e:any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: Request) {
  try { return NextResponse.json(await upsertProduct(await req.json())); }
  catch (e:any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PUT(req: Request) {
  try {
    const { id, isDisabled } = await req.json();
    await setProductDisabled(Number(id), !!isDisabled);
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}