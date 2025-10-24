import { NextRequest, NextResponse } from 'next/server';
import { scanNetworkRange } from '@/utils/networkScanner';

export const runtime = 'nodejs'; // Use Node.js runtime for TCP sockets
export const maxDuration = 60; // Allow up to 60 seconds for scanning

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { networkRange, ports = [9100, 9101, 9102], timeout = 3000 } = await request.json();

    if (!networkRange) {
      return NextResponse.json(
        { success: false, message: 'Мрежовия диапазон е задължителен' },
        { status: 400 }
      );
    }

    // Validate network range format (e.g., "192.168.1.")
    const networkRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}$/;
    if (!networkRegex.test(networkRange)) {
      return NextResponse.json(
        { success: false, message: 'Невалиден мрежов диапазон' },
        { status: 400 }
      );
    }

    console.log(`[Network Scan] Starting scan for ${networkRange}x with ports:`, ports);
    
    try {
      // Use real network scanner
      const foundDevices = await scanNetworkRange(networkRange, ports, timeout, 20);
      
      const scanTime = Date.now() - startTime;
      
      console.log(`[Network Scan] Scan completed in ${scanTime}ms. Found ${foundDevices.length} devices.`);

      return NextResponse.json({
        success: true,
        networkRange,
        ports,
        devices: foundDevices,
        totalFound: foundDevices.length,
        scanTime,
        timestamp: new Date().toISOString(),
        message: `Сканирането завърши за ${(scanTime / 1000).toFixed(2)}s`
      });
    } catch (scanError) {
      console.error(`[Network Scan] Error during scan:`, scanError);
      
      return NextResponse.json({
        success: false,
        networkRange,
        ports,
        devices: [],
        totalFound: 0,
        scanTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: `Грешка при сканиране: ${scanError instanceof Error ? scanError.message : 'Unknown error'}`,
        error: scanError instanceof Error ? scanError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('[Network Scan] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Грешка при сканиране на мрежата',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
