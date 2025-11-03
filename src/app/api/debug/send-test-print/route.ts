import { NextRequest, NextResponse } from 'next/server';
import { sendTestPrint } from '@/utils/networkScanner';

export const runtime = 'nodejs'; // Use Node.js runtime for TCP sockets

export async function POST(request: NextRequest) {
  try {
    const { ip, port = 9100 } = await request.json();

    if (!ip) {
      return NextResponse.json(
        { success: false, message: 'IP адресът е задължителен' },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { success: false, message: 'Невалиден IP адрес' },
        { status: 400 }
      );
    }

    // Check if IP is in private range
    const isPrivateIP = (ip: string) => {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4) return false;
      
      return (
        (parts[0] === 10) ||
        (parts[0] === 172 && parts[1] >= 83 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 127) // localhost
      );
    };

    if (!isPrivateIP(ip)) {
      return NextResponse.json(
        { success: false, message: 'Само частни IP адреси са разрешени' },
        { status: 400 }
      );
    }
    
    try {
      // Send test print using real implementation
      const result = await sendTestPrint(ip, port, 10000);
            
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Тестова страница изпратена успешно до ${ip}:${port}`,
          bytesSent: result.bytesSent,
          timestamp: new Date().toISOString(),
          details: {
            printer: `${ip}:${port}`,
            bytesSent: result.bytesSent,
            protocol: 'ESC/POS'
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Грешка при изпращане на тестова страница до ${ip}:${port}`,
          error: result.error || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error(`[Send Test Print] Error sending to ${ip}:${port}:`, error);
      
      return NextResponse.json({
        success: false,
        message: `Грешка при изпращане на тестова страница до ${ip}:${port}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('[Send Test Print] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Вътрешна грешка на сървъра',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
