'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { webSerialPrinter, ConnectedPrinter } from '@/utils/webSerialPrinter';
import { ESCPOSCommands, OrderData } from '@/utils/escposCommands';

interface SerialPrinterContextType {
  isSupported: boolean;
  connectedPrinters: ConnectedPrinter[];
  connectPrinter: () => Promise<void>;
  disconnectPrinter: (port: SerialPort) => Promise<void>;
  printOrder: (order: OrderData, port?: SerialPort) => Promise<void>;
  printTest: (port?: SerialPort) => Promise<void>;
  refreshPrinters: () => Promise<void>;
  defaultPrinter: SerialPort | null;
  setDefaultPrinter: (port: SerialPort | null) => void;
  isConnecting: boolean;
  error: string | null;
  clearError: () => void;
}

const SerialPrinterContext = createContext<SerialPrinterContextType | undefined>(undefined);

export function SerialPrinterProvider({ children }: { children: ReactNode }) {
  const [connectedPrinters, setConnectedPrinters] = useState<ConnectedPrinter[]>([]);
  const [defaultPrinter, setDefaultPrinterState] = useState<SerialPort | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSupported = webSerialPrinter.isSupported();

  // Load saved default printer and auto-reconnect on mount
  useEffect(() => {
    if (isSupported) {
      initializePrinters();
    }
  }, [isSupported]);

  const initializePrinters = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Auto-reconnect to previously authorized ports
      await webSerialPrinter.reconnectSavedPorts();
      await refreshPrinters();
      
      console.log('✅ [Serial Context] Initialization completed');
    } catch (error) {
      console.error('❌ [Serial Context] Initialization failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error during initialization');
    } finally {
      setIsConnecting(false);
    }
  };

  const refreshPrinters = async () => {
    try {
      const printers = webSerialPrinter.getConnectedPrinters();
      setConnectedPrinters(printers);
      
      // Set default printer if not set and we have printers
      if (!defaultPrinter && printers.length > 0) {
        setDefaultPrinterState(printers[0].port);
        console.log('🖨️ [Serial Context] Default printer set to:', printers[0].name);
      }
    } catch (error) {
      console.error('❌ [Serial Context] Failed to refresh printers:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh printers');
    }
  };

  const connectPrinter = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const port = await webSerialPrinter.requestPort();
      if (!port) {
        console.log('ℹ️ [Serial Context] User cancelled port selection');
        return;
      }

      // Get printer name from user
      const name = prompt('Име на принтера:', 'Kitchen Printer');
      if (!name) {
        console.log('ℹ️ [Serial Context] User cancelled naming');
        return;
      }

      // Get configuration from user (optional)
      const baudRateInput = prompt('Baud Rate (по подразбиране 9600):', '9600');
      const baudRate = baudRateInput ? parseInt(baudRateInput) : 9600;

      await webSerialPrinter.connect(port, name, {
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      await refreshPrinters();
      
      // Set as default if first printer
      if (!defaultPrinter) {
        setDefaultPrinterState(port);
      }

      console.log('✅ [Serial Context] Printer connected successfully:', name);
    } catch (error) {
      console.error('❌ [Serial Context] Failed to connect printer:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect printer');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectPrinter = async (port: SerialPort) => {
    try {
      setError(null);
      await webSerialPrinter.disconnect(port);
      await refreshPrinters();
      
      if (defaultPrinter === port) {
        const remainingPrinters = webSerialPrinter.getConnectedPrinters();
        setDefaultPrinterState(remainingPrinters.length > 0 ? remainingPrinters[0].port : null);
      }

      console.log('🔌 [Serial Context] Printer disconnected');
    } catch (error) {
      console.error('❌ [Serial Context] Failed to disconnect printer:', error);
      setError(error instanceof Error ? error.message : 'Failed to disconnect printer');
    }
  };

  const printOrder = async (order: OrderData, port?: SerialPort) => {
    try {
      setError(null);
      const targetPort = port || defaultPrinter;
      
      if (!targetPort) {
        throw new Error('Няма свързан принтер. Моля свържете принтер от Debug панела.');
      }

      console.log(`🖨️ [Serial Context] Printing order #${order.orderId}...`);
      const ticketData = ESCPOSCommands.generateOrderTicket(order);
      await webSerialPrinter.print(targetPort, ticketData);
      
      console.log(`✅ [Serial Context] Order #${order.orderId} printed successfully`);
    } catch (error) {
      console.error('❌ [Serial Context] Print failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Print failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const printTest = async (port?: SerialPort) => {
    try {
      setError(null);
      const targetPort = port || defaultPrinter;
      
      if (!targetPort) {
        throw new Error('Няма свързан принтер. Моля свържете принтер от Debug панела.');
      }

      console.log('🧪 [Serial Context] Printing test page...');
      const testData = ESCPOSCommands.generateTestTicket();
      await webSerialPrinter.print(targetPort, testData);
      
      console.log('✅ [Serial Context] Test page printed successfully');
    } catch (error) {
      console.error('❌ [Serial Context] Test print failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Test print failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const setDefaultPrinter = (port: SerialPort | null) => {
    setDefaultPrinterState(port);
    console.log('🖨️ [Serial Context] Default printer changed');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <SerialPrinterContext.Provider
      value={{
        isSupported,
        connectedPrinters,
        connectPrinter,
        disconnectPrinter,
        printOrder,
        printTest,
        refreshPrinters,
        defaultPrinter,
        setDefaultPrinter,
        isConnecting,
        error,
        clearError,
      }}
    >
      {children}
    </SerialPrinterContext.Provider>
  );
}

export function useSerialPrinter() {
  const context = useContext(SerialPrinterContext);
  if (context === undefined) {
    throw new Error('useSerialPrinter must be used within SerialPrinterProvider');
  }
  return context;
}
