import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

/**
 * API endpoint to test printer connectivity
 * POST /api/printer/test
 */
export async function POST(request: NextRequest) {
  try {
    const { printerIp, printerPort } = await request.json();
    
    // Validate input
    if (!printerIp || !printerPort) {
      return NextResponse.json(
        { success: false, message: 'Missing printer IP or port' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Testing printer connection to ${printerIp}:${printerPort}`);
    
    // Test connection
    const result = await testConnection(printerIp, printerPort);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully connected to printer at ${printerIp}:${printerPort}`,
        latency: result.latency,
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Printer test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Test connection to printer
 */
function testConnection(
  ip: string, 
  port: number
): Promise<{ success: boolean; latency?: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = new net.Socket();
    
    // Set timeout
    client.setTimeout(5000); // 5 seconds
    
    // Connection successful
    client.on('connect', () => {
      const latency = Date.now() - startTime;
      console.log(`✅ Printer connection test successful (${latency}ms)`);
      
      client.destroy();
      resolve({ success: true, latency });
    });
    
    // Connection error
    client.on('error', (err) => {
      console.error('❌ Printer connection test failed:', err);
      client.destroy();
      
      let errorMessage = 'Unknown error';
      if (err.message.includes('ECONNREFUSED')) {
        errorMessage = `Printer refused connection. Is it turned on and connected to network?`;
      } else if (err.message.includes('ETIMEDOUT') || err.message.includes('EHOSTUNREACH')) {
        errorMessage = `Cannot reach printer. Check network connection and IP address.`;
      } else if (err.message.includes('ENOTFOUND')) {
        errorMessage = `Invalid IP address or hostname.`;
      } else {
        errorMessage = err.message;
      }
      
      resolve({ success: false, error: errorMessage });
    });
    
    // Timeout
    client.on('timeout', () => {
      console.error('❌ Printer connection test timeout');
      client.destroy();
      resolve({ 
        success: false, 
        error: 'Connection timeout. Printer did not respond within 5 seconds.' 
      });
    });
    
    // Attempt connection
    client.connect(port, ip);
  });
}


