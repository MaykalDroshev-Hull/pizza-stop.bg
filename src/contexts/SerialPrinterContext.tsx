'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { webSerialPrinter, ConnectedPrinter, SerialPrinterConfig } from '@/utils/webSerialPrinter';
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

  // Don't auto-reconnect on mount - we'll connect only when printing
  useEffect(() => {
    if (isSupported) {
      // Just refresh the list, don't auto-connect
      refreshPrinters();
    }
  }, [isSupported]);

  const initializePrinters = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Auto-reconnect to previously authorized ports (only for manual connection)
      await webSerialPrinter.reconnectSavedPorts();
      await refreshPrinters();
      
    } catch {
      setError('Unknown error during initialization');
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
      }
    } catch {
      setError('Failed to refresh printers');
    }
  };

  const connectPrinter = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const port = await webSerialPrinter.requestPort();
      if (!port) {
        return;
      }

      // Get printer name from user
      const name = prompt('Име на принтера:', 'Kitchen Printer');
      if (!name) {
        return;
      }

      // Get configuration from user (optional)
      const baudRateInput = prompt('Baud Rate (по подразбиране 9600):', '9600');
      const baudRate = baudRateInput ? parseInt(baudRateInput) : 9600;

      const config: SerialPrinterConfig = {
        baudRate,
        dataBits: 8 as 7 | 8,
        stopBits: 1 as 1 | 2,
        parity: 'none' as const,
        flowControl: 'none' as const
      };

      await webSerialPrinter.connect(port, name, config);
      
      // Save configuration to localStorage
      webSerialPrinter.savePrinterConfig(port, name, config);

      await refreshPrinters();
      
      // Set as default if first printer
      if (!defaultPrinter) {
        setDefaultPrinterState(port);
      }

    } catch {
      setError('Failed to connect printer');
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

    } catch {
      setError('Failed to disconnect printer');
    }
  };

  const printOrder = async (order: OrderData, port?: SerialPort) => {
    try {
      setError(null);
      
      // If port is explicitly provided, use it (for backward compatibility)
      if (port) {
        const ticketData = ESCPOSCommands.generateOrderTicket(order);
        await webSerialPrinter.print(port, ticketData);
        return;
      }
      
      // Otherwise, use connect-print-disconnect pattern with saved config
      const ticketData = ESCPOSCommands.generateOrderTicket(order);
      await webSerialPrinter.printAndDisconnect(ticketData);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Print failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const printTest = async (port?: SerialPort) => {
    try {
      setError(null);
      
      // If port is explicitly provided, use it (for backward compatibility)
      if (port) {
        const testData = ESCPOSCommands.generateTestTicket();
        await webSerialPrinter.print(port, testData);
        return;
      }
      
      // Otherwise, use connect-print-disconnect pattern with saved config
      const testData = ESCPOSCommands.generateTestTicket();
      await webSerialPrinter.printAndDisconnect(testData);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test print failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const setDefaultPrinter = (port: SerialPort | null) => {
    setDefaultPrinterState(port);
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
