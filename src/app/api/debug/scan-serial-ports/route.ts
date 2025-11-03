import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime for serial port access

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Note: In a real implementation with serialport package:
    /*
    const { SerialPort } = require('serialport');
    const ports = await SerialPort.list();
        
    const serialPrinters = ports.map(port => ({
      comPort: port.path,
      status: 'connected' as const,
      baudRate: 9600, // Default baud rate
      lastChecked: new Date().toLocaleTimeString('bg-BG'),
      deviceName: port.friendlyName || port.path,
      manufacturer: port.manufacturer || 'Unknown',
      vendorId: port.vendorId,
      productId: port.productId,
      serialNumber: port.serialNumber
    }));
    */
    
    // Simulate scanning for serial ports with detailed info
    const simulatedSerialPorts = [
      {
        comPort: 'COM3',
        status: 'connected' as const,
        baudRate: 9600,
        lastChecked: new Date().toLocaleTimeString('bg-BG'),
        deviceName: 'USB Serial Port (COM3)',
        manufacturer: 'FTDI',
        vendorId: '0403',
        productId: '6001',
        serialNumber: 'A12345'
      },
      {
        comPort: 'COM4',
        status: 'connected' as const,
        baudRate: 19200,
        lastChecked: new Date().toLocaleTimeString('bg-BG'),
        deviceName: 'Prolific USB-to-Serial Comm Port',
        manufacturer: 'Prolific',
        vendorId: '067B',
        productId: '2303'
      },
      {
        comPort: 'COM7',
        status: 'connected' as const,
        baudRate: 38400,
        lastChecked: new Date().toLocaleTimeString('bg-BG'),
        deviceName: 'Citizen ST-S2010 Thermal Printer',
        manufacturer: 'Citizen',
        vendorId: '1CBE',
        productId: '0003'
      }
    ];

    const scanTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ports: simulatedSerialPorts,
      printers: simulatedSerialPorts,
      total: simulatedSerialPorts.length,
      connected: simulatedSerialPorts.length,
      scanTime,
      timestamp: new Date().toISOString(),
      message: `Намерени ${simulatedSerialPorts.length} серийни портове`,
      note: 'Симулирани данни - за реална имплементация инсталирайте serialport пакет'
    });
    
  } catch (error) {
    const scanTime = Date.now() - startTime;
    console.error(`[Serial Port Scan] Error after ${scanTime}ms:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Грешка при сканиране на серийни портове',
        error: error instanceof Error ? error.message : 'Unknown error',
        scanTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
