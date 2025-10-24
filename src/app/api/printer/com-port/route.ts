import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js runtime for serial port access

/**
 * API endpoint to send print jobs to COM port thermal printer
 * POST /api/printer/com-port
 */
export async function POST(request: NextRequest) {
  try {
    const { comPort, baudRate = 9600, data } = await request.json();
    
    // Validate input
    if (!comPort || !data) {
      return NextResponse.json(
        { success: false, message: 'COM портът и данните са задължителни' },
        { status: 400 }
      );
    }
    
    console.log(`🖨️ [COM Port Print] Printing to ${comPort} at ${baudRate} baud...`);
    
    try {
      // Note: In production, you would use the 'serialport' package:
      /*
      const { SerialPort } = require('serialport');
      
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
            console.error(`❌ [COM Port Print] Cannot open ${comPort}:`, err);
            resolve(NextResponse.json({
              success: false,
              message: `Cannot open ${comPort}: ${err.message}`,
              error: err.message,
              comPort,
              baudRate
            }));
          } else {
            console.log(`✅ [COM Port Print] Connected to ${comPort}`);
            
            // Convert data to buffer if it's a string
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
            
            // Send data to printer
            port.write(buffer, (writeErr) => {
              if (writeErr) {
                console.error(`❌ [COM Port Print] Write error on ${comPort}:`, writeErr);
                port.close();
                resolve(NextResponse.json({
                  success: false,
                  message: `Write error on ${comPort}: ${writeErr.message}`,
                  error: writeErr.message,
                  comPort,
                  baudRate
                }));
              } else {
                console.log(`📄 [COM Port Print] Sent ${buffer.length} bytes to ${comPort}`);
                
                // Wait a bit for printer to process, then close connection
                setTimeout(() => {
                  port.close();
                  resolve(NextResponse.json({
                    success: true,
                    message: `Print job sent successfully to ${comPort}`,
                    bytesSent: buffer.length,
                    comPort,
                    baudRate
                  }));
                }, 1000);
              }
            });
          }
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          port.close();
          resolve(NextResponse.json({
            success: false,
            message: `Timeout on ${comPort}`,
            error: 'Connection timeout',
            comPort,
            baudRate
          }));
        }, 10000);
      });
      */
      
      // Simulated response for environments without serial port access
      const simulatedPorts = ['COM3', 'COM4', 'COM7'];
      const isKnownPort = simulatedPorts.includes(comPort);
      
      if (isKnownPort) {
        // Simulate successful print
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
        
        return NextResponse.json({
          success: true,
          message: `Print job sent successfully to ${comPort}`,
          bytesSent: buffer.length,
          comPort,
          baudRate,
          note: 'Симулиран отговор - за реална имплементация използвайте serialport пакет'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `COM порт ${comPort} не е намерен`,
          error: 'Port not found',
          comPort,
          baudRate,
          note: 'Симулиран отговор - за реална имплементация използвайте serialport пакет'
        });
      }

    } catch (error) {
      console.error(`❌ [COM Port Print] Error printing to ${comPort}:`, error);
      
      return NextResponse.json({
        success: false,
        message: `Грешка при печат на ${comPort}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        comPort,
        baudRate
      });
    }

  } catch (error) {
    console.error('❌ [COM Port Print] Fatal error:', error);
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
    const { comPort, baudRate = 9600, data } = await request.json();
    
    if (!comPort || !data) {
      return NextResponse.json(
        { success: false, message: 'COM port and data are required' },
        { status: 400 }
      );
    }
    
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
          // Convert data to buffer if it's a string
          const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
          
          // Send data to printer
          port.write(buffer, (writeErr) => {
            if (writeErr) {
              port.close();
              resolve(NextResponse.json({
                success: false,
                message: `Write error on ${comPort}: ${writeErr.message}`,
                error: writeErr.message,
                comPort,
                baudRate
              }));
            } else {
              // Wait a bit for printer to process, then close connection
              setTimeout(() => {
                port.close();
                resolve(NextResponse.json({
                  success: true,
                  message: `Print job sent successfully to ${comPort}`,
                  bytesSent: buffer.length,
                  comPort,
                  baudRate
                }));
              }, 1000);
            }
          });
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        port.close();
        resolve(NextResponse.json({
          success: false,
          message: `Timeout on ${comPort}`,
          error: 'Connection timeout',
          comPort,
          baudRate
        }));
      }, 10000);
    });
    
  } catch (error) {
    console.error('[COM Port Print] Fatal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/
