'use client';

import { useState, useEffect } from 'react';
import { X, Printer, Settings, CheckCircle, AlertCircle, Wifi, TestTube } from 'lucide-react';
import { useSerialPrinter } from '@/contexts/SerialPrinterContext';

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export default function PrinterConfigModal({ isOpen, onClose, onConfigSaved }: PrinterConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Web Serial Configuration
  const {
    isSupported: webSerialSupported,
    connectedPrinters,
    connectPrinter,
    disconnectPrinter,
    printTest,
    defaultPrinter,
    setDefaultPrinter
  } = useSerialPrinter();

  const handleWebSerialTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Use printTest without port - it will connect using saved config
      await printTest();
      setTestResult({ 
        success: true, 
        message: 'Web Serial принтерът е успешно тестван!' 
      });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Грешка при тестване: ${error instanceof Error ? error.message : 'Неизвестна грешка'}. Моля конфигурирайте принтер първо.` 
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleWebSerialConnect = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      await connectPrinter();
      setTestResult({ 
        success: true, 
        message: 'Web Serial принтерът е свързан успешно!' 
      });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Грешка при свързване: ${error instanceof Error ? error.message : 'Неизвестна грешка'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/12 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/12">
          <div className="flex items-center space-x-3">
            <Printer className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-white">Конфигурация на принтер</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>


        {/* Content */}
        <div className="p-6">
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-green-200 mb-2">Web Serial принтер</h3>
                <p className="text-green-300 text-sm">
                  Използвайте Web Serial API за свързване с USB принтери. 
                  Трябва да използвате Chrome или Edge браузър.
                </p>
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    <strong>За USB принтери:</strong> Chrome ще поиска разрешение за достъп до серийния порт. 
                    Изберете вашия принтер от списъка и потвърдете разрешението.
                  </p>
                </div>
              </div>

              {!webSerialSupported && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-300 font-medium">Web Serial не се поддържа</span>
                  </div>
                  <p className="text-yellow-200 text-sm mt-1">
                    Използвайте Chrome или Edge браузър за Web Serial функционалност.
                  </p>
                </div>
              )}

              {webSerialSupported && (
                <>
                  {/* Connected Printers */}
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Свързани принтери</h4>
                    {connectedPrinters.length === 0 ? (
                      <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <p className="text-gray-400">Няма свързани принтери</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {connectedPrinters.map((printer, index) => (
                          <div key={index} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Printer className="w-5 h-5 text-green-500" />
                              <div>
                                <p className="text-white font-medium">{printer.name}</p>
                                <p className="text-gray-400 text-sm">
                                  Последно използван: {printer.lastUsed.toLocaleString('bg-BG')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {defaultPrinter === printer.port && (
                                <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
                                  По подразбиране
                                </span>
                              )}
                              <button
                                onClick={() => setDefaultPrinter(printer.port)}
                                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                              >
                                Избери
                              </button>
                              <button
                                onClick={() => disconnectPrinter(printer.port)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                Изключи
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Test Result */}
                  {testResult && (
                    <div className={`p-4 rounded-lg border ${
                      testResult.success 
                        ? 'bg-green-900/20 border-green-500/30' 
                        : 'bg-red-900/20 border-red-500/30'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {testResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                          {testResult.message}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={handleWebSerialConnect}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Wifi className="w-4 h-4" />
                      <span>Свържи нов принтер</span>
                    </button>
                    <button
                      onClick={handleWebSerialTest}
                      disabled={isLoading || !defaultPrinter}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>Тест на печат</span>
                    </button>
                  </div>
                </>
              )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/12">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Затвори
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
