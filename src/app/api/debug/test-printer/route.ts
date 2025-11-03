import { NextRequest, NextResponse } from 'next/server';
import { testTCPConnection, testPrinterPort } from '@/utils/networkScanner';

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
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
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

    const startTime = Date.now();
    
    try {
      // Test TCP connection
      const connectionResult = await testTCPConnection(ip, port, 5000);
            
      if (connectionResult.status === 'online') {
        // Test if it's actually a printer
        const isPrinter = await testPrinterPort(ip, port, 3000);
                
        return NextResponse.json({
          success: true,
          message: `Принтер ${ip}:${port} отговаря успешно`,
          responseTime: connectionResult.responseTime,
          status: 'online',
          protocol: isPrinter ? 'ESC/POS' : 'TCP',
          isPrinter,
          details: {
            connectionTime: connectionResult.responseTime,
            portOpen: true,
            printerReady: isPrinter,
            tcpStatus: connectionResult.status
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Принтер ${ip}:${port} не отговаря: ${connectionResult.error || connectionResult.status}`,
          responseTime: connectionResult.responseTime,
          status: connectionResult.status,
          error: connectionResult.error,
          details: {
            connectionTime: connectionResult.responseTime,
            portOpen: false,
            printerReady: false,
            tcpStatus: connectionResult.status,
            error: connectionResult.error
          }
        });
      }
      
    } catch (error) {
      console.error(`[Test Printer] Error testing ${ip}:${port}:`, error);
      
      return NextResponse.json({
        success: false,
        message: `Грешка при свързване с ${ip}:${port}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        responseTime: Date.now() - startTime
      });
    }
    
  } catch (error) {
    console.error('[Test Printer] Fatal error:', error);
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
