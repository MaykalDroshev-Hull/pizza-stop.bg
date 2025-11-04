import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

/**
 * API endpoint to send print jobs to network thermal printer
 * POST /api/printer/print
 */
export async function POST(request: NextRequest) {
  try {
    const { printerIp, printerPort, data } = await request.json();
    
    // Validate input
    if (!printerIp || !printerPort || !data) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(printerIp)) {
      return NextResponse.json(
        { success: false, message: 'Invalid IP address format' },
        { status: 400 }
      );
    }
    
    // Validate port
    if (printerPort < 1 || printerPort > 65535) {
      return NextResponse.json(
        { success: false, message: 'Invalid port number' },
        { status: 400 }
      );
    }
    
    
    // Send data to printer
    const result = await sendToPrinter(printerIp, printerPort, Buffer.from(data));
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Print job sent successfully',
        bytesSent: result.bytesSent,
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Print API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

/**
 * Send raw bytes to network printer
 */
function sendToPrinter(
  ip: string, 
  port: number, 
  data: Buffer
): Promise<{ success: boolean; bytesSent?: number; error?: string }> {
  return new Promise((resolve) => {
    const client = new net.Socket();
    let bytesSent = 0;
    
    // Set timeout for connection
    client.setTimeout(10000); // 10 seconds
    
    // Connection successful
    client.on('connect', () => {
      
      // Send data to printer
      client.write(data, (err) => {
        if (err) {
          console.error('❌ Error writing to printer:', err);
          client.destroy();
          resolve({ success: false, error: `Write error: ${err.message}` });
        } else {
          bytesSent = data.length;
          
          // Wait a bit for printer to process, then close connection
          setTimeout(() => {
            client.destroy();
            resolve({ success: true, bytesSent });
          }, 1000);
        }
      });
    });
    
    // Connection error
    client.on('error', (err) => {
      console.error('❌ Printer connection error:', err);
      client.destroy();
      
      let errorMessage = 'Unknown error';
      if (err.message.includes('ECONNREFUSED')) {
        errorMessage = `Printer refused connection. Check if printer is on and IP ${ip}:${port} is correct.`;
      } else if (err.message.includes('ETIMEDOUT') || err.message.includes('EHOSTUNREACH')) {
        errorMessage = `Cannot reach printer at ${ip}:${port}. Check network connection.`;
      } else {
        errorMessage = err.message;
      }
      
      resolve({ success: false, error: errorMessage });
    });
    
    // Timeout
    client.on('timeout', () => {
      console.error('❌ Printer connection timeout');
      client.destroy();
      resolve({ 
        success: false, 
        error: `Connection timeout. Printer at ${ip}:${port} did not respond.` 
      });
    });
    
    // Close event
    client.on('close', () => {
    });
    
    // Attempt connection
    client.connect(port, ip);
  });
}


