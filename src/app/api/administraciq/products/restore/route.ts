import { NextRequest, NextResponse } from 'next/server';
import { restoreProducts } from '@/server/productService.server';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const result = await restoreProducts(ids);
    
    return NextResponse.json({
      success: true,
      message: `Successfully restored ${ids.length} product${ids.length > 1 ? 's' : ''}`,
      restoredCount: ids.length
    });
  } catch (error) {
    console.error('Error restoring products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to restore products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
