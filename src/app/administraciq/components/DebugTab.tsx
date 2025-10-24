"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  RefreshCw, 
  Printer, 
  Wifi, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MapPin,
  Activity,
  Terminal,
  Download,
  Trash2,
  Copy,
  Info,
  XCircle,
  Usb,
  Power,
  TestTube
} from "lucide-react";
import { useSerialPrinter } from "@/contexts/SerialPrinterContext";
import { comPortPrinter } from "@/utils/comPortPrinter";

interface NetworkPrinter {
  ip: string;
  name: string;
  status: 'online' | 'offline' | 'unknown';
  responseTime?: number;
  lastChecked: string;
  model?: string;
  manufacturer?: string;
  port?: number;
  protocol?: string;
  errorMessage?: string;
}

interface SerialPrinter {
  comPort: string;
  status: 'connected' | 'disconnected' | 'unknown';
  baudRate?: number;
  lastChecked: string;
  deviceName?: string;
  manufacturer?: string;
  vendorId?: string;
  productId?: string;
  errorMessage?: string;
}

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
}

const DebugTab = (): React.JSX.Element => {
  const [networkPrinters, setNetworkPrinters] = useState<NetworkPrinter[]>([]);
  const [serialPrinters, setSerialPrinters] = useState<SerialPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<string>("");
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showDebugConsole, setShowDebugConsole] = useState(true);
  const debugConsoleRef = useRef<HTMLDivElement>(null);

  // Web Serial API integration
  const {
    isSupported: isWebSerialSupported,
    connectedPrinters,
    connectPrinter,
    disconnectPrinter,
    printTest,
    refreshPrinters,
    defaultPrinter,
    setDefaultPrinter,
    isConnecting,
    error: serialError,
    clearError
  } = useSerialPrinter();

  // Add debug log
  const addDebugLog = (level: DebugLog['level'], message: string, details?: any) => {
    const log: DebugLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('bg-BG', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3
      }),
      level,
      message,
      details
    };
    
    setDebugLogs(prev => [...prev, log]);
    
    if (autoScroll && debugConsoleRef.current) {
      setTimeout(() => {
        debugConsoleRef.current?.scrollTo({
          top: debugConsoleRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  // Clear debug logs
  const clearDebugLogs = () => {
    setDebugLogs([]);
    addDebugLog('info', 'Debug console очистен');
  };

  // Export debug logs
  const exportDebugLogs = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      logs: debugLogs,
      networkPrinters,
      serialPrinters,
      lastScanTime
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addDebugLog('success', 'Debug логове експортирани успешно');
  };

  // Network scan function with real implementation
  const scanNetworkPrinters = async () => {
    addDebugLog('info', '🔍 Започване на мрежово сканиране...');
    setIsScanning(true);
    setScanProgress(0);
    
    const commonRanges = [
      "192.168.1.", "192.168.0.", "10.0.0.", "172.16.0.","127.0.0."
    ];
    
    const foundPrinters: NetworkPrinter[] = [];
    let totalProgress = 0;
    const totalRanges = commonRanges.length;
    
    addDebugLog('debug', `Ще бъдат сканирани ${totalRanges} мрежови диапазона`, { ranges: commonRanges });
    
    for (let rangeIndex = 0; rangeIndex < commonRanges.length; rangeIndex++) {
      const range = commonRanges[rangeIndex];
      addDebugLog('info', `📡 Сканиране на диапазон ${range}x (${rangeIndex + 1}/${totalRanges})`);
      
      try {
        const response = await fetch('/api/debug/network-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            networkRange: range,
            ports: [9100, 9101, 9102, 631, 515],
            timeout: 3000
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          addDebugLog('debug', `Получен отговор за ${range}x`, data);
          
          if (data.success && data.devices) {
            addDebugLog('success', `✅ Намерени ${data.devices.length} устройства в ${range}x`);
            
            data.devices.forEach((device: any) => {
              const printer: NetworkPrinter = {
                ip: device.ip,
                name: device.name || `Printer ${device.ip}`,
                status: device.status || 'online',
                responseTime: device.responseTime,
                lastChecked: device.lastChecked || new Date().toLocaleTimeString('bg-BG'),
                model: device.model || 'Unknown Model',
                manufacturer: device.manufacturer || 'Unknown',
                port: device.port,
                protocol: device.protocol || 'ESC/POS',
                errorMessage: device.errorMessage
              };
              
              foundPrinters.push(printer);
              addDebugLog('info', `🖨️ Принтер открит: ${printer.ip}:${printer.port} (${printer.responseTime}ms)`, printer);
            });
          } else {
            addDebugLog('warning', `⚠️ Няма намерени устройства в ${range}x`);
          }
        } else {
          const errorData = await response.json();
          addDebugLog('error', `❌ Грешка при сканиране на ${range}x: ${errorData.message}`, errorData);
        }
        
        // Update progress
        totalProgress = ((rangeIndex + 1) / totalRanges) * 100;
        setScanProgress(totalProgress);
        addDebugLog('debug', `Прогрес: ${Math.round(totalProgress)}%`);
        
      } catch (error) {
        addDebugLog('error', `❌ Изключение при сканиране на ${range}x: ${error}`, error);
        console.error(`Error scanning range ${range}:`, error);
      }
      
      // Small delay between ranges
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setNetworkPrinters(foundPrinters);
    setIsScanning(false);
    setLastScanTime(new Date().toLocaleString('bg-BG'));
    
    addDebugLog('success', `✅ Мрежово сканиране завършено! Намерени ${foundPrinters.length} принтери.`, {
      total: foundPrinters.length,
      online: foundPrinters.filter(p => p.status === 'online').length,
      scanTime: lastScanTime
    });
  };

  // Serial port scan
  const scanSerialPrinters = async () => {
    addDebugLog('info', '🔌 Започване на сканиране на серийни портове...');
    
    try {
      const response = await fetch('/api/debug/scan-serial-ports');
      const data = await response.json();
      
      addDebugLog('debug', 'Получен отговор от serial port scan', data);
      
      if (data.success) {
        setSerialPrinters(data.printers || []);
        addDebugLog('success', `✅ Намерени ${data.printers?.length || 0} серийни портове`, data);
        
        if (data.printers && data.printers.length > 0) {
          data.printers.forEach((printer: SerialPrinter) => {
            addDebugLog('info', `🔌 COM порт: ${printer.comPort} - ${printer.deviceName}`, printer);
          });
        }
      } else {
        addDebugLog('error', `❌ Грешка при сканиране: ${data.message}`, data);
      }
    } catch (error) {
      addDebugLog('error', `❌ Изключение при сканиране на серийни портове: ${error}`, error);
      console.error('Error scanning serial ports:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Онлайн';
      case 'connected':
        return 'Свързан';
      case 'offline':
        return 'Офлайн';
      case 'disconnected':
        return 'Несвързан';
      default:
        return 'Неизвестен';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'text-green-400';
      case 'offline':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getLogIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'debug':
        return <Terminal className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'debug':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const testPrinterConnection = async (ip: string, port: number = 9100) => {
    addDebugLog('info', `🔍 Тестване на връзка с ${ip}:${port}...`);
    
    try {
      const response = await fetch('/api/debug/test-printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addDebugLog('success', `✅ Принтер ${ip}:${port} отговаря успешно! (${data.responseTime}ms)`, data);
        alert(`✅ Принтер ${ip}:${port} отговаря!\n\nВреме за отговор: ${data.responseTime}ms\nСтатус: ${data.status}\n${data.message}`);
      } else {
        addDebugLog('error', `❌ Принтер ${ip}:${port} не отговаря: ${data.message}`, data);
        alert(`❌ Принтер ${ip}:${port} не отговаря.\n\nГрешка: ${data.message}`);
      }
    } catch (error) {
      addDebugLog('error', `❌ Изключение при тестване на ${ip}:${port}: ${error}`, error);
      alert(`❌ Грешка при тестване на ${ip}:${port}\n${error}`);
    }
  };

  const sendTestPrint = async (ip: string, port: number = 9100) => {
    addDebugLog('info', `🖨️ Изпращане на тестова страница към ${ip}:${port}...`);
    
    try {
      const response = await fetch('/api/debug/send-test-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addDebugLog('success', `✅ Тестова страница изпратена успешно към ${ip}:${port} (${data.bytesSent} bytes)`, data);
        alert(`✅ Тестова страница изпратена успешно!\n\nПринтер: ${ip}:${port}\nБайтове: ${data.bytesSent}\n${data.message}`);
      } else {
        addDebugLog('error', `❌ Грешка при изпращане на тестова страница към ${ip}:${port}: ${data.message}`, data);
        alert(`❌ Грешка при изпращане на тестова страница.\n\nПринтер: ${ip}:${port}\nГрешка: ${data.message}`);
      }
    } catch (error) {
      addDebugLog('error', `❌ Изключение при изпращане на тестова страница: ${error}`, error);
      alert(`❌ Грешка при изпращане на тестова страница.\n${error}`);
    }
  };

  const testSerialPort = async (comPort: string, baudRate: number = 9600) => {
    addDebugLog('info', `🔌 Тестване на серийно порт ${comPort} (${baudRate} baud)...`);
    
    try {
      const response = await fetch('/api/debug/test-serial-port', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comPort, baudRate })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addDebugLog('success', `✅ Серийно порт ${comPort} работи успешно!`, data);
        alert(`✅ Серийно порт ${comPort} работи!\n\n${data.message}`);
      } else {
        addDebugLog('error', `❌ Серийно порт ${comPort} не отговаря: ${data.message}`, data);
        alert(`❌ Серийно порт ${comPort} не отговаря.\n\nГрешка: ${data.message}`);
      }
    } catch (error) {
      addDebugLog('error', `❌ Изключение при тестване на ${comPort}: ${error}`, error);
      alert(`❌ Грешка при тестване на ${comPort}\n${error}`);
    }
  };

  const configureComPortPrinter = async (comPort: string, baudRate: number = 9600) => {
    addDebugLog('info', `⚙️ Конфигуриране на COM порт принтер ${comPort} (${baudRate} baud)...`);
    
    try {
      // Set configuration in COM port printer
      comPortPrinter.setConfig({
        comPort,
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });
      
      addDebugLog('success', `✅ COM порт принтер конфигуриран: ${comPort}`, { comPort, baudRate });
      alert(`✅ COM порт принтер конфигуриран!\n\nПорт: ${comPort}\nBaud Rate: ${baudRate}\n\nСега ще се използва за печат на поръчки.`);
    } catch (error) {
      addDebugLog('error', `❌ Грешка при конфигуриране на COM порт принтер: ${error}`, error);
      alert(`❌ Грешка при конфигуриране на COM порт принтер.\n${error}`);
    }
  };

  const testComPortPrint = async (comPort: string, baudRate: number = 9600) => {
    addDebugLog('info', `🧪 Тест печат на COM порт ${comPort} (${baudRate} baud)...`);
    
    try {
      // Configure printer first
      comPortPrinter.setConfig({
        comPort,
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });
      
      // Send test print
      await comPortPrinter.printTest();
      
      addDebugLog('success', `✅ Тест печат изпратен успешно на ${comPort}`, { comPort, baudRate });
      alert(`✅ Тест печат изпратен успешно!\n\nПорт: ${comPort}\nBaud Rate: ${baudRate}\n\nПроверете принтера за тестовата страница.`);
    } catch (error) {
      addDebugLog('error', `❌ Грешка при тест печат на ${comPort}: ${error}`, error);
      alert(`❌ Грешка при тест печат на ${comPort}.\n\nГрешка: ${error}`);
    }
  };

  // Web Serial API functions
  const handleConnectWebSerial = async () => {
    addDebugLog('info', '🔌 Започване на свързване с Web Serial принтер...');
    try {
      await connectPrinter();
      addDebugLog('success', '✅ Web Serial принтер свързан успешно!');
    } catch (error) {
      addDebugLog('error', `❌ Грешка при свързване с Web Serial принтер: ${error}`);
    }
  };

  const handleDisconnectWebSerial = async (port: SerialPort) => {
    addDebugLog('info', '🔌 Изключване на Web Serial принтер...');
    try {
      await disconnectPrinter(port);
      addDebugLog('success', '✅ Web Serial принтер изключен успешно!');
    } catch (error) {
      addDebugLog('error', `❌ Грешка при изключване на Web Serial принтер: ${error}`);
    }
  };

  const handleWebSerialTestPrint = async (port?: SerialPort) => {
    addDebugLog('info', '🧪 Започване на тест печат с Web Serial...');
    try {
      await printTest(port);
      addDebugLog('success', '✅ Web Serial тест печат успешен!');
    } catch (error) {
      addDebugLog('error', `❌ Грешка при Web Serial тест печат: ${error}`);
    }
  };

  useEffect(() => {
    addDebugLog('info', '🚀 Debug панел зареден');
    scanSerialPrinters();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold text-white">Debug - RS232 & Мрежови принтери</h2>
        </div>
        <p className="text-gray-400">
          Сканиране и диагностика на всички принтери в мрежата и серийни портове с пълна debug информация
        </p>
      </div>

      {/* Scan Controls */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={scanNetworkPrinters}
              disabled={isScanning}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors duration-200"
            >
              <Wifi className="w-5 h-5" />
              <span>Сканирай мрежа</span>
            </button>
            
            <button
              onClick={scanSerialPrinters}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200"
            >
              <Activity className="w-5 h-5" />
              <span>Сканирай COM портове</span>
            </button>
            
            <button
              onClick={() => {
                scanNetworkPrinters();
                scanSerialPrinters();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-200"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Пълно сканиране</span>
            </button>
            
            <button
              onClick={exportDebugLogs}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors duration-200"
              disabled={debugLogs.length === 0}
            >
              <Download className="w-5 h-5" />
              <span>Експорт логове</span>
            </button>
          </div>
          
          {lastScanTime && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Последно: {lastScanTime}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isScanning && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Сканиране на мрежата...</span>
              <span>{Math.round(scanProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Debug Console */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-white">Debug Console</h3>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              {debugLogs.length} логове
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDebugConsole(!showDebugConsole)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200"
            >
              {showDebugConsole ? 'Скрий' : 'Покажи'}
            </button>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 ${autoScroll ? 'bg-green-700' : 'bg-gray-700'} hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-200`}
            >
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={clearDebugLogs}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Изчисти
            </button>
          </div>
        </div>

        {showDebugConsole && (
          <div 
            ref={debugConsoleRef}
            className="bg-black rounded-xl p-4 font-mono text-sm max-h-96 overflow-y-auto border border-gray-700"
          >
            {debugLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Няма debug логове. Започнете сканиране.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {debugLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-2 hover:bg-gray-900 p-1 rounded group"
                  >
                    <span className="text-gray-500 text-xs">{log.timestamp}</span>
                    {getLogIcon(log.level)}
                    <span className={`flex-1 ${getLogColor(log.level)}`}>
                      {log.message}
                    </span>
                    {log.details && (
                      <button
                        onClick={() => {
                          console.log('Debug details:', log.details);
                          addDebugLog('debug', `Детайли за "${log.message}" изписани в console`);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
                        title="Покажи детайли в console"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network Printers */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wifi className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-bold text-white">Мрежови принтери</h3>
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            {networkPrinters.length} намерени
          </span>
        </div>

        {networkPrinters.length === 0 ? (
          <div className="text-center py-12">
            <Printer className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Няма намерени мрежови принтери</p>
            <p className="text-gray-500 text-sm">Натиснете "Сканирай мрежа" за да започнете</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {networkPrinters.map((printer, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(printer.status)}
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{printer.name}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {printer.ip}:{printer.port}
                        </span>
                        <span className={`flex items-center gap-1 ${getStatusColor(printer.status)}`}>
                          {getStatusIcon(printer.status)}
                          {getStatusText(printer.status)}
                        </span>
                        {printer.responseTime && (
                          <span className="text-blue-400">⚡ {printer.responseTime}ms</span>
                        )}
                        {printer.protocol && (
                          <span className="text-purple-400">📡 {printer.protocol}</span>
                        )}
                        <span className="text-gray-500">🕒 {printer.lastChecked}</span>
                      </div>
                      {printer.model && (
                        <p className="text-xs text-gray-500 mt-1">
                          🖨️ {printer.manufacturer} {printer.model}
                        </p>
                      )}
                      {printer.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">
                          ⚠️ {printer.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => testPrinterConnection(printer.ip, printer.port)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200"
                      title="Тестване на връзката"
                    >
                      Тест връзка
                    </button>
                    <button
                      onClick={() => sendTestPrint(printer.ip, printer.port)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors duration-200"
                      title="Изпращане на тестова страница"
                    >
                      Тест печат
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${printer.ip}:${printer.port}`);
                        addDebugLog('success', `📋 IP адрес ${printer.ip}:${printer.port} копиран в clipboard`);
                      }}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors duration-200"
                      title="Копиране на IP адрес"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Web Serial Printers (RS232/USB) */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Usb className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold text-white">Web Serial Printers (RS232/USB)</h3>
          {!isWebSerialSupported && (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
              Не се поддържа в този браузър
            </span>
          )}
          {isWebSerialSupported && (
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
              {connectedPrinters.length} свързани
            </span>
          )}
        </div>

        {!isWebSerialSupported ? (
          <div className="text-center py-8">
            <Usb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Web Serial API не се поддържа</p>
            <p className="text-gray-500 text-sm">Използвайте Chrome или Edge браузър</p>
            <p className="text-gray-500 text-xs mt-2">
              Web Serial API работи само в Chrome 89+ и Edge 89+
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleConnectWebSerial}
                disabled={isConnecting}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors duration-200"
              >
                {isConnecting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Usb className="w-5 h-5" />
                )}
                <span>{isConnecting ? 'Свързване...' : 'Свържи нов принтер'}</span>
              </button>
              
              <button
                onClick={() => refreshPrinters()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Обнови</span>
              </button>
            </div>

            {serialError && (
              <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-400 font-medium">Web Serial грешка:</span>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-red-300 text-sm mt-1">{serialError}</p>
              </div>
            )}

            {connectedPrinters.length === 0 ? (
              <div className="text-center py-8">
                <Usb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Няма свързани принтери</p>
                <p className="text-gray-500 text-sm">Натиснете "Свържи нов принтер" за да започнете</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedPrinters.map((printer, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{printer.name}</h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <span className="text-purple-400">🔌 Web Serial</span>
                            <span className="text-blue-400">⚡ Baud: {printer.config.baudRate}</span>
                            <span className="text-green-400">✅ Свързан</span>
                            <span className="text-gray-500">🕒 {printer.lastUsed.toLocaleTimeString('bg-BG')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWebSerialTestPrint(printer.port)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors duration-200"
                          title="Тест печат"
                        >
                          <TestTube className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDefaultPrinter(printer.port)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                            defaultPrinter === printer.port
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                          title="Задай като default"
                        >
                          {defaultPrinter === printer.port ? 'Default' : 'Set Default'}
                        </button>
                        <button
                          onClick={() => handleDisconnectWebSerial(printer.port)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors duration-200"
                          title="Изключи"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Legacy Serial Printers (API-based) */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-white">Серийни портове (Legacy API)</h3>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {serialPrinters.length} намерени
          </span>
        </div>

        {serialPrinters.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Няма намерени серийни портове</p>
            <p className="text-gray-500 text-sm">Натиснете "Сканирай COM портове" за да започнете</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {serialPrinters.map((printer, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(printer.status)}
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">
                        {printer.deviceName || `COM порт ${printer.comPort}`}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="text-blue-400">🔌 Порт: {printer.comPort}</span>
                        {printer.baudRate && (
                          <span className="text-purple-400">⚡ Baud: {printer.baudRate}</span>
                        )}
                        {printer.manufacturer && (
                          <span className="text-green-400">🏭 {printer.manufacturer}</span>
                        )}
                        <span className={`flex items-center gap-1 ${getStatusColor(printer.status)}`}>
                          {getStatusIcon(printer.status)}
                          {getStatusText(printer.status)}
                        </span>
                        <span className="text-gray-500">🕒 {printer.lastChecked}</span>
                      </div>
                      {(printer.vendorId || printer.productId) && (
                        <p className="text-xs text-gray-500 mt-1">
                          🆔 VID: {printer.vendorId || 'N/A'} | PID: {printer.productId || 'N/A'}
                        </p>
                      )}
                      {printer.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">
                          ⚠️ {printer.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => testSerialPort(printer.comPort, printer.baudRate)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200"
                    >
                      Тест връзка
                    </button>
                    <button
                      onClick={() => testComPortPrint(printer.comPort, printer.baudRate)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors duration-200"
                    >
                      Тест печат
                    </button>
                    <button
                      onClick={() => configureComPortPrinter(printer.comPort, printer.baudRate)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors duration-200"
                    >
                      Използвай за печат
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Статистики</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-green-500">{networkPrinters.length}</div>
            <div className="text-gray-400">Мрежови принтери</div>
            <div className="text-xs text-gray-500 mt-1">
              {networkPrinters.filter(p => p.status === 'online').length} онлайн
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-purple-500">{connectedPrinters.length}</div>
            <div className="text-gray-400">Web Serial</div>
            <div className="text-xs text-gray-500 mt-1">
              {connectedPrinters.length} свързани
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-blue-500">{serialPrinters.length}</div>
            <div className="text-gray-400">Legacy Serial</div>
            <div className="text-xs text-gray-500 mt-1">
              {serialPrinters.filter(p => p.status === 'connected').length} свързани
            </div>
            <div className="text-xs text-purple-400 mt-1">
              {comPortPrinter.isConfigured() ? '✅ Конфигуриран' : '❌ Не е конфигуриран'}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-yellow-500">
              {networkPrinters.filter(p => p.status === 'online').length + connectedPrinters.length + serialPrinters.filter(p => p.status === 'connected').length}
            </div>
            <div className="text-gray-400">Активни връзки</div>
            <div className="text-xs text-gray-500 mt-1">
              {networkPrinters.length + connectedPrinters.length + serialPrinters.length > 0 ? 
                `${Math.round(((networkPrinters.filter(p => p.status === 'online').length + connectedPrinters.length + serialPrinters.filter(p => p.status === 'connected').length) / (networkPrinters.length + connectedPrinters.length + serialPrinters.length)) * 100)}% успех` : 
                '0% успех'
              }
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-orange-500">
              {networkPrinters.length > 0 ? 
                Math.round(networkPrinters.reduce((acc, p) => acc + (p.responseTime || 0), 0) / networkPrinters.length) : 
                0}
            </div>
            <div className="text-gray-400">Средно време (ms)</div>
            <div className="text-xs text-gray-500 mt-1">
              {networkPrinters.length > 0 ? 'Отговор на мрежа' : 'Няма данни'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugTab;