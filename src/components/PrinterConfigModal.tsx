'use client';

import { useState, useEffect } from 'react';
import { X, Printer, Settings, CheckCircle, AlertCircle, Usb, Wifi, TestTube } from 'lucide-react';
import { comPortPrinter, ComPortConfig } from '@/utils/comPortPrinter';
import { useSerialPrinter } from '@/contexts/SerialPrinterContext';

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export default function PrinterConfigModal({ isOpen, onClose, onConfigSaved }: PrinterConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'com' | 'serial'>('serial');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // COM Port Configuration
  const [comConfig, setComConfig] = useState<ComPortConfig>({
    comPort: 'COM1',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none'
  });
  
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

  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [isScanningPorts, setIsScanningPorts] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    if (isOpen) {
      const savedConfig = comPortPrinter.getConfig();
      if (savedConfig) {
        setComConfig(savedConfig);
      }
      
      // Load available COM ports
      loadAvailablePorts();
    }
  }, [isOpen]);

  const loadAvailablePorts = async () => {
    setIsScanningPorts(true);
    try {
      // Common COM ports to check
      const commonPorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8'];
      setAvailablePorts(commonPorts);
    } catch (error) {
      console.error('Error loading ports:', error);
    } finally {
      setIsScanningPorts(false);
    }
  };

  const handleComPortTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Test COM port configuration
      const success = await comPortPrinter.testConnection(comConfig);
      
      if (success) {
        setTestResult({ 
          success: true, 
          message: 'COM порт принтерът е успешно свързан и готов за печат!' 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: 'Неуспешно свързване с COM порт принтера. Проверете настройките и връзката.' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Грешка при тестване: ${error instanceof Error ? error.message : 'Неизвестна грешка'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebSerialTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      if (defaultPrinter) {
        await printTest(defaultPrinter);
        setTestResult({ 
          success: true, 
          message: 'Web Serial принтерът е успешно тестван!' 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: 'Няма избран Web Serial принтер за тестване.' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Грешка при тестване: ${error instanceof Error ? error.message : 'Неизвестна грешка'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComPortSave = async () => {
    setIsLoading(true);
    
    try {
      // Save COM port configuration
      comPortPrinter.setConfig(comConfig);
      
      // Test the configuration
      const success = await comPortPrinter.testConnection(comConfig);
      
      if (success) {
        setTestResult({ 
          success: true, 
          message: 'COM порт принтерът е конфигуриран и готов за използване!' 
        });
        onConfigSaved();
      } else {
        setTestResult({ 
          success: false, 
          message: 'Конфигурацията е запазена, но тестът неуспешен. Проверете връзката.' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Грешка при запазване: ${error instanceof Error ? error.message : 'Неизвестна грешка'}` 
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/12">
          <button
            onClick={() => setActiveTab('com')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'com'
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Usb className="w-4 h-4" />
              <span>COM Порт принтер</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('serial')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'serial'
                ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span>Web Serial принтер</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'com' && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-blue-200 mb-2">COM Порт настройки</h3>
                <p className="text-blue-300 text-sm">
                  Конфигурирайте COM порт принтера за автоматичен печат на поръчки. 
                  Този принтер ще се използва по подразбиране за всички печатни операции.
                </p>
                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    <strong>Забележка:</strong> COM порт принтерите изискват backend API достъп. 
                    За USB принтери използвайте <strong>Web Serial принтер</strong> таба.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COM Port Selection */}
                <div className="space-y-2">
                  <label className="text-white font-medium">COM Порт</label>
                  <div className="flex space-x-2">
                    <select
                      value={comConfig.comPort}
                      onChange={(e) => setComConfig(prev => ({ ...prev, comPort: e.target.value }))}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                    >
                      {availablePorts.map(port => (
                        <option key={port} value={port}>{port}</option>
                      ))}
                    </select>
                    <button
                      onClick={loadAvailablePorts}
                      disabled={isScanningPorts}
                      className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      {isScanningPorts ? '...' : 'Обнови'}
                    </button>
                  </div>
                </div>

                {/* Baud Rate */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Скорост на предаване (Baud Rate)</label>
                  <select
                    value={comConfig.baudRate}
                    onChange={(e) => setComConfig(prev => ({ ...prev, baudRate: parseInt(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={38400}>38400</option>
                    <option value={57600}>57600</option>
                    <option value={115200}>115200</option>
                  </select>
                </div>

                {/* Data Bits */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Битове данни</label>
                  <select
                    value={comConfig.dataBits}
                    onChange={(e) => setComConfig(prev => ({ ...prev, dataBits: parseInt(e.target.value) as 7 | 8 }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                  </select>
                </div>

                {/* Stop Bits */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Стоп битове</label>
                  <select
                    value={comConfig.stopBits}
                    onChange={(e) => setComConfig(prev => ({ ...prev, stopBits: parseInt(e.target.value) as 1 | 2 }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </div>

                {/* Parity */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Паритет</label>
                  <select
                    value={comConfig.parity}
                    onChange={(e) => setComConfig(prev => ({ ...prev, parity: e.target.value as 'none' | 'even' | 'odd' }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="none">Няма</option>
                    <option value="even">Четен</option>
                    <option value="odd">Нечетен</option>
                  </select>
                </div>

                {/* Flow Control */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Контрол на потока</label>
                  <select
                    value={comConfig.flowControl}
                    onChange={(e) => setComConfig(prev => ({ ...prev, flowControl: e.target.value as 'none' | 'hardware' }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="none">Няма</option>
                    <option value="hardware">Хардуерен</option>
                  </select>
                </div>
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
                  onClick={handleComPortTest}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Тест на връзката</span>
                </button>
                <button
                  onClick={handleComPortSave}
                  disabled={isLoading}
                  className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Запази като подразбиране</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'serial' && (
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
          )}
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
