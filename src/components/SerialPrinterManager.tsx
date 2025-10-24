'use client';

import { useEffect, useState } from 'react';
import { useSerialPrinter } from '@/contexts/SerialPrinterContext';
import { Printer, AlertCircle, CheckCircle, Usb } from 'lucide-react';

interface SerialPrinterManagerProps {
  autoPrint?: boolean;
  showStatus?: boolean;
  className?: string;
}

export default function SerialPrinterManager({ 
  autoPrint = true, 
  showStatus = true,
  className = '' 
}: SerialPrinterManagerProps) {
  const {
    isSupported,
    connectedPrinters,
    defaultPrinter,
    printTest,
    error,
    clearError
  } = useSerialPrinter();

  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (autoPrint && isSupported && connectedPrinters.length === 0) {
      setShowWarning(true);
    }
  }, [autoPrint, isSupported, connectedPrinters.length]);

  if (!showStatus) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className={`bg-yellow-900 border border-yellow-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="text-yellow-300 font-medium">Web Serial не се поддържа</span>
        </div>
        <p className="text-yellow-200 text-sm mt-1">
          Използвайте Chrome или Edge браузър за печат на принтери
        </p>
      </div>
    );
  }

  if (connectedPrinters.length === 0) {
    return (
      <div className={`bg-red-900 border border-red-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Usb className="w-5 h-5 text-red-500" />
            <span className="text-red-300 font-medium">Няма свързани принтери</span>
          </div>
          <button
            onClick={() => window.open('/administraciq', '_blank')}
            className="text-red-300 hover:text-red-200 text-sm underline"
          >
            Свържи принтер
          </button>
        </div>
        <p className="text-red-200 text-sm mt-1">
          Отидете в Debug панела за да свържете принтер
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-green-900 border border-green-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-green-300 font-medium">
          Принтери готови ({connectedPrinters.length})
        </span>
      </div>
      
      <div className="mt-2 space-y-1">
        {connectedPrinters.map((printer, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-green-400" />
              <span className="text-green-200 text-sm">
                {printer.name} {defaultPrinter === printer.port && '(Default)'}
              </span>
            </div>
            <button
              onClick={() => printTest(printer.port)}
              className="text-green-300 hover:text-green-200 text-xs underline"
            >
              Тест
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-800 border border-red-600 rounded">
          <div className="flex items-center justify-between">
            <span className="text-red-300 text-sm">{error}</span>
            <button
              onClick={clearError}
              className="text-red-300 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
