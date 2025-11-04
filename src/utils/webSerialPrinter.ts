/**
 * Web Serial API wrapper for thermal printers
 * Works with RS232/USB-to-Serial adapters
 */

export interface SerialPrinterConfig {
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
  flowControl: 'none' | 'hardware';
}

export interface ConnectedPrinter {
  port: SerialPort;
  name: string;
  config: SerialPrinterConfig;
  lastUsed: Date;
}

export class WebSerialPrinter {
  private static instance: WebSerialPrinter;
  private connectedPorts: Map<SerialPort, ConnectedPrinter> = new Map();

  private constructor() {}

  static getInstance(): WebSerialPrinter {
    if (!WebSerialPrinter.instance) {
      WebSerialPrinter.instance = new WebSerialPrinter();
    }
    return WebSerialPrinter.instance;
  }

  /**
   * Check if Web Serial API is supported
   */
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Request user to select a serial port
   */
  async requestPort(): Promise<SerialPort | null> {
    try {
      if (!this.isSupported() || !navigator.serial) {
        throw new Error('Web Serial API не се поддържа в този браузър. Използвайте Chrome или Edge.');
      }

      const port = await navigator.serial.requestPort();
      return port;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        return null;
      }
      console.error('❌ [Web Serial] Error requesting port:', error);
      throw error;
    }
  }

  /**
   * Connect to a serial port
   */
  async connect(
    port: SerialPort,
    name: string,
    config: SerialPrinterConfig = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none'
    }
  ): Promise<void> {
    try {
      await port.open(config);
      
      this.connectedPorts.set(port, {
        port,
        name,
        config,
        lastUsed: new Date()
      });

    } catch (error) {
      console.error(`❌ [Web Serial] Failed to connect to ${name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a port
   */
  async disconnect(port: SerialPort): Promise<void> {
    try {
      await port.close();
      this.connectedPorts.delete(port);
    } catch (error) {
      console.error('❌ [Web Serial] Error disconnecting:', error);
      throw error;
    }
  }

  /**
   * Send data to printer with proper timing
   */
  async print(port: SerialPort, data: Uint8Array): Promise<void> {
    try {
      if (!port.writable) {
        throw new Error('Port is not writable');
      }

      const writer = port.writable.getWriter();
      
      try {
        // Send data in chunks to avoid overwhelming the printer
        const chunkSize = 64; // Small chunks for thermal printers
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await writer.write(chunk);
          
          // Small delay between chunks to ensure proper transmission
          if (i + chunkSize < data.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        // Wait a bit for the printer to process
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update last used
        const printer = this.connectedPorts.get(port);
        if (printer) {
          printer.lastUsed = new Date();
        }
      } finally {
        writer.releaseLock();
      }
    } catch (error) {
      console.error('❌ [Web Serial] Print error:', error);
      throw error;
    }
  }

  /**
   * Get all previously authorized ports
   */
  async getPorts(): Promise<SerialPort[]> {
    if (!this.isSupported() || !navigator.serial) {
      return [];
    }
    return await navigator.serial.getPorts();
  }

  /**
   * Get connected printers
   */
  getConnectedPrinters(): ConnectedPrinter[] {
    return Array.from(this.connectedPorts.values());
  }

  /**
   * Get port info
   */
  private async getPortInfo(port: SerialPort): Promise<SerialPortInfo> {
    return port.getInfo();
  }

  /**
   * Test connection by sending init command
   */
  async testConnection(port: SerialPort): Promise<boolean> {
    try {
      // Send basic ESC/POS commands to test printer
      const testCommands = new Uint8Array([
        0x1B, 0x40,  // Initialize printer
        0x1B, 0x61, 0x01,  // Center align
        0x1B, 0x45, 0x01,  // Bold on
        0x54, 0x65, 0x73, 0x74, 0x0A,  // "Test" + LF
        0x1B, 0x45, 0x00,  // Bold off
        0x0A, 0x0A, 0x0A,  // Line feeds
        0x1D, 0x56, 0x00   // Cut paper
      ]);
      
      await this.print(port, testCommands);
      return true;
    } catch (error) {
      console.error('❌ [Web Serial] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Auto-reconnect to previously authorized ports
   */
  async reconnectSavedPorts(): Promise<void> {
    try {
      if (!this.isSupported()) {
        return;
      }

      const savedPorts = await this.getPorts();

      for (const port of savedPorts) {
        try {
          if (!port.readable || !port.writable) {
            await port.open({
              baudRate: 9600,
              dataBits: 8,
              stopBits: 1,
              parity: 'none',
              flowControl: 'none'
            });
          }

          if (!this.connectedPorts.has(port)) {
            this.connectedPorts.set(port, {
              port,
              name: `Saved Printer ${port.getInfo()}`,
              config: {
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
              },
              lastUsed: new Date()
            });
          }

        } catch (error) {
        }
      }
    } catch (error) {
      console.error('❌ [Web Serial] Error during auto-reconnect:', error);
    }
  }
}

// Export singleton instance
export const webSerialPrinter = WebSerialPrinter.getInstance();
