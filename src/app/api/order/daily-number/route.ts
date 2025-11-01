import { NextRequest, NextResponse } from 'next/server';
import { getDailyOrderNumber } from '@/utils/orderHelpers';

/**
 * API endpoint to get the daily order number for a given order
 * GET /api/order/daily-number?orderId=123
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderIdParam = searchParams.get('orderId');
    
    if (!orderIdParam) {
      return NextResponse.json(
        { error: 'Missing orderId parameter' },
        { status: 400 }
      );
    }
    
    const orderId = parseInt(orderIdParam, 10);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid orderId parameter' },
        { status: 400 }
      );
    }
    
    const dailyNumber = await getDailyOrderNumber(orderId);
    
    return NextResponse.json({
      orderId,
      dailyOrderNumber: dailyNumber
    });
  } catch (error) {
    console.error('❌ Error getting daily order number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

