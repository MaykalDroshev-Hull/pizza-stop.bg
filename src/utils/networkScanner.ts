/**
 * Network Scanner Utility
 * Real TCP socket implementation for printer detection
 */

import { Socket } from 'net';

export interface ScanResult {
  ip: string;
  port: number;
  status: 'online' | 'offline' | 'timeout' | 'error';
  responseTime: number;
  error?: string;
  protocol?: string;
}

export interface PrinterInfo {
  ip: string;
  port: number;
  name: string;
  status: 'online' | 'offline';
  responseTime: number;
  lastChecked: string;
  model?: string;
  manufacturer?: string;
  protocol: string;
  errorMessage?: string;
}

/**
 * Test TCP connection to a specific IP and port
 */
export async function testTCPConnection(
  ip: string,
  port: number,
  timeout: number = 3000
): Promise<ScanResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    // Check if we're in Node.js environment
    if (typeof window !== 'undefined') {
      // Browser environment - can't use raw TCP sockets
      resolve({
        ip,
        port,
        status: 'error',
        responseTime: 0,
        error: 'TCP sockets не са налични в browser environment'
      });
      return;
    }

    try {
      const socket = new Socket();
      let resolved = false;

      // Set timeout
      socket.setTimeout(timeout);

      // Connection successful
      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          const responseTime = Date.now() - startTime;
          socket.destroy();
          
          resolve({
            ip,
            port,
            status: 'online',
            responseTime,
            protocol: 'TCP'
          });
        }
      });

      // Connection timeout
      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          
          resolve({
            ip,
            port,
            status: 'timeout',
            responseTime: Date.now() - startTime,
            error: 'Connection timeout'
          });
        }
      });

      // Connection error
      socket.on('error', (error: Error) => {
        if (!resolved) {
          resolved = true;
          
          resolve({
            ip,
            port,
            status: 'error',
            responseTime: Date.now() - startTime,
            error: error.message
          });
        }
      });

      // Attempt connection
      socket.connect(port, ip);

    } catch (error) {
      resolve({
        ip,
        port,
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Test if a port is a printer port by sending ESC/POS init command
 */
export async function testPrinterPort(
  ip: string,
  port: number,
  timeout: number = 3000
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      resolve(false);
      return;
    }

    try {
      const socket = new Socket();
      let resolved = false;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        // Send ESC/POS initialization command
        const initCommand = Buffer.from([0x1B, 0x40]); // ESC @
        socket.write(initCommand);

        // If we can write, assume it's a printer
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(true);
        }
      });

      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });

      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });

      socket.connect(port, ip);

    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Scan network range for printers
 */
export async function scanNetworkRange(
  networkRange: string,
  ports: number[] = [9100, 9101, 9102],
  timeout: number = 2000,
  maxConcurrent: number = 10
): Promise<PrinterInfo[]> {
  const foundPrinters: PrinterInfo[] = [];
  
  // Validate network range format (e.g., "192.168.1.")
  if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}$/.test(networkRange)) {
    throw new Error('Invalid network range format');
  }

  // Scan IPs 1-254 in the range
  const scanPromises: Promise<void>[] = [];
  
  for (let i = 1; i <= 254; i++) {
    const ip = networkRange + i;
    
    for (const port of ports) {
      const scanPromise = (async () => {
        const result = await testTCPConnection(ip, port, timeout);
        
        if (result.status === 'online') {
          // Verify it's actually a printer
          const isPrinter = await testPrinterPort(ip, port, timeout);
          
          if (isPrinter) {
            foundPrinters.push({
              ip,
              port,
              name: `Printer ${ip}`,
              status: 'online',
              responseTime: result.responseTime,
              lastChecked: new Date().toLocaleTimeString('bg-BG'),
              protocol: 'ESC/POS',
              model: 'Unknown Model',
              manufacturer: 'Unknown'
            });
          }
        }
      })();
      
      scanPromises.push(scanPromise);
      
      // Limit concurrent scans
      if (scanPromises.length >= maxConcurrent) {
        await Promise.race(scanPromises);
        scanPromises.splice(0, 1);
      }
    }
  }

  // Wait for remaining scans
  await Promise.allSettled(scanPromises);
  
  return foundPrinters;
}

/**
 * Send test print to printer
 */
export async function sendTestPrint(
  ip: string,
  port: number,
  timeout: number = 5000
): Promise<{ success: boolean; bytesSent?: number; error?: string }> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      resolve({ success: false, error: 'Not available in browser' });
      return;
    }

    try {
      const socket = new Socket();
      let resolved = false;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        // Generate test print ESC/POS commands
        const testPrintData = generateTestPrintData();
        socket.write(testPrintData);
        
        // Close connection after sending
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            socket.destroy();
            resolve({ success: true, bytesSent: testPrintData.length });
          }
        }, 1000);
      });

      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve({ success: false, error: 'Connection timeout' });
        }
      });

      socket.on('error', (error: Error) => {
        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: error.message });
        }
      });

      socket.connect(port, ip);

    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Generate ESC/POS test print data
 */
function generateTestPrintData(): Buffer {
  const commands: number[] = [];
  
  // ESC/POS commands
  const ESC = 0x1B;
  const GS = 0x1D;
  
  // Initialize printer
  commands.push(ESC, 0x40);
  
  // Center alignment
  commands.push(ESC, 0x61, 0x01);
  
  // Double height and width
  commands.push(GS, 0x21, 0x11);
  
  // Bold on
  commands.push(ESC, 0x45, 0x01);
  
  // Print header
  commands.push(...Buffer.from('PIZZA STOP', 'utf8'));
  commands.push(0x0A); // LF
  
  // Normal size
  commands.push(GS, 0x21, 0x00);
  
  // Bold off
  commands.push(ESC, 0x45, 0x00);
  
  // Print test message
  commands.push(...Buffer.from('Debug Test Print', 'utf8'));
  commands.push(0x0A);
  
  // Separator
  commands.push(...Buffer.from('='.repeat(32), 'utf8'));
  commands.push(0x0A);
  
  // Timestamp
  const timestamp = new Date().toLocaleString('bg-BG');
  commands.push(...Buffer.from(`Time: ${timestamp}`, 'utf8'));
  commands.push(0x0A);
  
  // IP info
  commands.push(...Buffer.from('System: Pizza Stop Debug', 'utf8'));
  commands.push(0x0A);
  commands.push(...Buffer.from('Status: Connection OK', 'utf8'));
  commands.push(0x0A, 0x0A);
  
  // Thank you
  commands.push(...Buffer.from('Thank you for testing!', 'utf8'));
  commands.push(0x0A, 0x0A, 0x0A);
  
  // Cut paper
  commands.push(ESC, 0x69);
  
  return Buffer.from(commands);
}
