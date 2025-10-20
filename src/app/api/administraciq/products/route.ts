import { NextResponse } from 'next/server';
import { listProducts, upsertProduct, setProductDisabled, deleteProducts } from '@/server/productService.server';

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

export async function DELETE(req: Request) {
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
