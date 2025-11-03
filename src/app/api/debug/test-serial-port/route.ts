import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime for serial port access

export async function POST(request: NextRequest) {
  try {
    const { comPort, baudRate = 9600 } = await request.json();

    if (!comPort) {
      return NextResponse.json(
        { success: false, message: 'COM портът е задължителен' },
        { status: 400 }
      );
    }

    try {
      // Note: In production, you would use the 'serialport' package:
      /*
      const { SerialPort } = require('serialport');
      
      const port = new SerialPort({
        path: comPort,
        baudRate: baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      });
      
      return new Promise((resolve) => {
        port.open((err) => {
          if (err) {
            resolve(NextResponse.json({
              success: false,
              message: `Cannot open ${comPort}: ${err.message}`,
              error: err.message
            }));
          } else {
            port.close();
            resolve(NextResponse.json({
              success: true,
              message: `Serial port ${comPort} opened successfully`,
              comPort,
              baudRate,
              status: 'connected'
            }));
          }
        });
      });
      */
      
      // Simulated response for environments without serial port access
      const simulatedPorts = ['COM3', 'COM4', 'COM7'];
      const isKnownPort = simulatedPorts.includes(comPort);
      
      if (isKnownPort) {
        return NextResponse.json({
          success: true,
          message: `Serial port ${comPort} е готов за използване`,
          comPort,
          baudRate,
          status: 'connected',
          note: 'Симулиран отговор - за реална имплементация използвайте serialport пакет'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Serial port ${comPort} не е намерен`,
          comPort,
          baudRate,
          status: 'disconnected',
          error: 'Port not found',
          note: 'Симулиран отговор - за реална имплементация използвайте serialport пакет'
        });
      }

    } catch (error) {
      console.error(`[Test Serial Port] Error testing ${comPort}:`, error);
      
      return NextResponse.json({
        success: false,
        message: `Грешка при тестване на ${comPort}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        comPort,
        baudRate
      });
    }

  } catch (error) {
    console.error('[Test Serial Port] Fatal error:', error);
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

/* Real implementation with serialport package:

npm install serialport

import { SerialPort } from 'serialport';

export async function POST(request: NextRequest) {
  try {
    const { comPort, baudRate = 9600 } = await request.json();
    
    return new Promise((resolve) => {
      const port = new SerialPort({
        path: comPort,
        baudRate: baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      });
      
      port.open((err) => {
        if (err) {
          resolve(NextResponse.json({
            success: false,
            message: `Cannot open ${comPort}: ${err.message}`,
            error: err.message,
            comPort,
            baudRate
          }));
        } else {
          // Send test data
          port.write(Buffer.from([0x1B, 0x40]), (writeErr) => {
            port.close();
            
            if (writeErr) {
              resolve(NextResponse.json({
                success: false,
                message: `Write error on ${comPort}: ${writeErr.message}`,
                error: writeErr.message,
                comPort,
                baudRate
              }));
            } else {
              resolve(NextResponse.json({
                success: true,
                message: `Serial port ${comPort} working correctly`,
                comPort,
                baudRate,
                status: 'connected'
              }));
            }
          });
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        port.close();
        resolve(NextResponse.json({
          success: false,
          message: `Timeout on ${comPort}`,
          error: 'Connection timeout',
          comPort,
          baudRate
        }));
      }, 5000);
    });
    
  } catch (error) {
    console.error('[Test Serial Port] Fatal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/
