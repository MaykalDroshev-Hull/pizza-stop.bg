import { NextRequest, NextResponse } from 'next/server';
import { softDeleteProducts } from '@/server/productService.server';

export async function POST(request: NextRequest) {
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
