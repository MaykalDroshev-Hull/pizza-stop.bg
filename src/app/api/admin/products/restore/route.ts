import { NextRequest, NextResponse } from 'next/server';
import { restoreProducts } from '@/server/productService.server';

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

export async function POST(request: NextRequest) {
  // Admin authentication required
  if (!checkAdminAuth(request)) {
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
