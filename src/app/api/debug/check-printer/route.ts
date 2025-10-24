import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { ip, port = 9100 } = await request.json();

    if (!ip) {
      return NextResponse.json(
        { success: false, message: 'IP адресът е задължителен' },
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
      // Real TCP socket connection test
      const isLikelyPrinter = await testTCPConnection(ip, port);
      const responseTime = Date.now() - startTime;
      
      if (isLikelyPrinter) {
        return NextResponse.json({
          success: true,
          isPrinter: true,
          ip,
          port,
          responseTime,
          name: `Printer ${ip}`,
          model: 'Unknown Model',
          manufacturer: 'Unknown',
          protocol: 'ESC/POS',
          status: 'online'
        });
      } else {
        return NextResponse.json({
          success: false,
          isPrinter: false,
          message: 'No printer detected on this IP'
        });
      }
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        isPrinter: false,
        message: 'Connection timeout or refused'
      });
    }
    
  } catch (error) {
    console.error('Debug printer check error:', error);
    return NextResponse.json(
      { success: false, message: 'Вътрешна грешка на сървъра' },
      { status: 500 }
    );
  }
}

// Test TCP connection to printer port
async function testTCPConnection(ip: string, port: number): Promise<boolean> {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 3000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, ip);
  });
}
