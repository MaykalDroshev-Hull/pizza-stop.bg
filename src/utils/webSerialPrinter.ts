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
  private connectedPorts: Map<string, ConnectedPrinter> = new Map();

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
      console.log('🖨️ [Web Serial] Port selected:', await this.getPortInfo(port));
      return port;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        console.log('ℹ️ [Web Serial] User cancelled port selection');
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
      
      const portId = this.getPortId(port);
      this.connectedPorts.set(portId, {
        port,
        name,
        config,
        lastUsed: new Date()
      });

      console.log(`✅ [Web Serial] Connected to ${name}`, config);
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
      const portId = this.getPortId(port);
      await port.close();
      this.connectedPorts.delete(portId);
      console.log('🔌 [Web Serial] Port disconnected');
    } catch (error) {
      console.error('❌ [Web Serial] Error disconnecting:', error);
      throw error;
    }
  }

  /**
   * Send data to printer
   */
  async print(port: SerialPort, data: Uint8Array): Promise<void> {
    try {
      if (!port.writable) {
        throw new Error('Port is not writable');
      }

      const writer = port.writable.getWriter();
      
      try {
        await writer.write(data);
        console.log(`📄 [Web Serial] Sent ${data.length} bytes to printer`);
        
        // Update last used
        const portId = this.getPortId(port);
        const printer = this.connectedPorts.get(portId);
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
   * Generate unique ID for port
   */
  private getPortId(port: SerialPort): string {
    const info = port.getInfo();
    return `${info.usbVendorId}-${info.usbProductId}`;
  }

  /**
   * Test connection by sending init command
   */
  async testConnection(port: SerialPort): Promise<boolean> {
    try {
      // Send ESC @ (initialize printer)
      const initCommand = new Uint8Array([0x1B, 0x40]);
      await this.print(port, initCommand);
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
      console.log(`🔄 [Web Serial] Found ${savedPorts.length} previously authorized ports`);

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

          const portId = this.getPortId(port);
          if (!this.connectedPorts.has(portId)) {
            this.connectedPorts.set(portId, {
              port,
              name: `Saved Printer ${portId}`,
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

          console.log('✅ [Web Serial] Auto-reconnected to saved printer');
        } catch (error) {
          console.log('⚠️ [Web Serial] Could not reconnect to saved port:', error);
        }
      }
    } catch (error) {
      console.error('❌ [Web Serial] Error during auto-reconnect:', error);
    }
  }
}

// Export singleton instance
export const webSerialPrinter = WebSerialPrinter.getInstance();
