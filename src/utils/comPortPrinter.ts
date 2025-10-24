/**
 * COM Port Printer utility for thermal printers
 * Works with RS232/USB-to-Serial adapters via API
 */

export interface ComPortConfig {
  comPort: string;
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  flowControl?: 'none' | 'hardware';
}

export interface OrderData {
  orderId: number;
  orderType: string;
  customerName: string;
  phone: string;
  address: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    addons: string[];
    comment?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: string;
  isPaid: boolean;
  placedTime: string;
  restaurantPhone: string;
}

export class ComPortPrinter {
  private static instance: ComPortPrinter;
  private config: ComPortConfig | null = null;

  private constructor() {}

  static getInstance(): ComPortPrinter {
    if (!ComPortPrinter.instance) {
      ComPortPrinter.instance = new ComPortPrinter();
    }
    return ComPortPrinter.instance;
  }

  /**
   * Set COM port configuration
   */
  setConfig(config: ComPortConfig): void {
    this.config = config;
    console.log('🖨️ [COM Port Printer] Configuration set:', config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ComPortConfig | null {
    return this.config;
  }

  /**
   * Check if printer is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Test connection to COM port
   */
  async testConnection(config?: ComPortConfig): Promise<boolean> {
    const testConfig = config || this.config;
    
    if (!testConfig) {
      console.error('🖨️ [COM Port Printer] No configuration provided for test');
      return false;
    }

    try {
      console.log(`🖨️ [COM Port Printer] Testing connection to ${testConfig.comPort}...`);
      
      // Send a simple test command to the printer
      const response = await fetch('/api/printer/com-port', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comPort: testConfig.comPort,
          baudRate: testConfig.baudRate,
          data: [0x1B, 0x40] // ESC @ - Initialize printer
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ [COM Port Printer] Connection test successful');
        return true;
      } else {
        console.error('❌ [COM Port Printer] Connection test failed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ [COM Port Printer] Connection test error:', error);
      return false;
    }
  }

  /**
   * Print order ticket to COM port
   */
  async printOrder(order: OrderData): Promise<void> {
    if (!this.config) {
      throw new Error('COM портът не е конфигуриран. Моля задайте COM порт от Debug панела.');
    }

    try {
      console.log(`🖨️ [COM Port Printer] Printing order #${order.orderId} to ${this.config.comPort}...`);
      
      // Generate ESC/POS commands for the order
      const ticketData = this.generateOrderTicket(order);
      
      // Convert string to byte array to avoid JSON encoding issues with Cyrillic
      const dataBytes = this.stringToByteArray(ticketData);
      
      // Send to COM port via API
      const response = await fetch('/api/printer/com-port', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comPort: this.config.comPort,
          baudRate: this.config.baudRate,
          data: dataBytes
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ [COM Port Printer] Order #${order.orderId} printed successfully to ${this.config.comPort}`);
      } else {
        throw new Error(result.message || 'Print failed');
      }
    } catch (error) {
      console.error(`❌ [COM Port Printer] Print failed for order #${order.orderId}:`, error);
      throw error;
    }
  }

  /**
   * Print test page to COM port
   */
  async printTest(): Promise<void> {
    if (!this.config) {
      throw new Error('COM портът не е конфигуриран. Моля задайте COM порт от Debug панела.');
    }

    try {
      console.log(`🧪 [COM Port Printer] Printing test page to ${this.config.comPort}...`);
      
      // Generate test ESC/POS commands
      const testData = this.generateTestTicket();
      
      // Convert string to byte array to avoid JSON encoding issues with Cyrillic
      const dataBytes = this.stringToByteArray(testData);
      
      // Send to COM port via API
      const response = await fetch('/api/printer/com-port', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comPort: this.config.comPort,
          baudRate: this.config.baudRate,
          data: dataBytes
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ [COM Port Printer] Test page printed successfully to ${this.config.comPort}`);
      } else {
        throw new Error(result.message || 'Test print failed');
      }
    } catch (error) {
      console.error(`❌ [COM Port Printer] Test print failed:`, error);
      throw error;
    }
  }

  /**
   * Convert UTF-8 text to CP1251 for Datecs printers
   */
  private utf8ToCp1251(text: string): string {
    try {
      // Create a mapping for common Cyrillic characters using String.fromCharCode
      const cyrillicMap: { [key: string]: string } = {
        'А': String.fromCharCode(0xC0), 'Б': String.fromCharCode(0xC1), 'В': String.fromCharCode(0xC2), 'Г': String.fromCharCode(0xC3), 'Д': String.fromCharCode(0xC4), 'Е': String.fromCharCode(0xC5), 'Ж': String.fromCharCode(0xC6), 'З': String.fromCharCode(0xC7),
        'И': String.fromCharCode(0xC8), 'Й': String.fromCharCode(0xC9), 'К': String.fromCharCode(0xCA), 'Л': String.fromCharCode(0xCB), 'М': String.fromCharCode(0xCC), 'Н': String.fromCharCode(0xCD), 'О': String.fromCharCode(0xCE), 'П': String.fromCharCode(0xCF),
        'Р': String.fromCharCode(0xD0), 'С': String.fromCharCode(0xD1), 'Т': String.fromCharCode(0xD2), 'У': String.fromCharCode(0xD3), 'Ф': String.fromCharCode(0xD4), 'Х': String.fromCharCode(0xD5), 'Ц': String.fromCharCode(0xD6), 'Ч': String.fromCharCode(0xD7),
        'Ш': String.fromCharCode(0xD8), 'Щ': String.fromCharCode(0xD9), 'Ъ': String.fromCharCode(0xDA), 'Ь': String.fromCharCode(0xDB), 'Ю': String.fromCharCode(0xDC), 'Я': String.fromCharCode(0xDD),
        'а': String.fromCharCode(0xE0), 'б': String.fromCharCode(0xE1), 'в': String.fromCharCode(0xE2), 'г': String.fromCharCode(0xE3), 'д': String.fromCharCode(0xE4), 'е': String.fromCharCode(0xE5), 'ж': String.fromCharCode(0xE6), 'з': String.fromCharCode(0xE7),
        'и': String.fromCharCode(0xE8), 'й': String.fromCharCode(0xE9), 'к': String.fromCharCode(0xEA), 'л': String.fromCharCode(0xEB), 'м': String.fromCharCode(0xEC), 'н': String.fromCharCode(0xED), 'о': String.fromCharCode(0xEE), 'п': String.fromCharCode(0xEF),
        'р': String.fromCharCode(0xF0), 'с': String.fromCharCode(0xF1), 'т': String.fromCharCode(0xF2), 'у': String.fromCharCode(0xF3), 'ф': String.fromCharCode(0xF4), 'х': String.fromCharCode(0xF5), 'ц': String.fromCharCode(0xF6), 'ч': String.fromCharCode(0xF7),
        'ш': String.fromCharCode(0xF8), 'щ': String.fromCharCode(0xF9), 'ъ': String.fromCharCode(0xFA), 'ь': String.fromCharCode(0xFB), 'ю': String.fromCharCode(0xFC), 'я': String.fromCharCode(0xFD)
      };

      let result = '';
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (cyrillicMap[char]) {
          result += cyrillicMap[char];
        } else {
          result += char;
        }
      }
      return result;
    } catch (error) {
      console.warn('Failed to convert UTF-8 to CP1251, using original text:', error);
      return text;
    }
  }

  /**
   * Convert string to byte array for JSON transmission
   */
  private stringToByteArray(text: string): number[] {
    try {
      // First convert Cyrillic to CP1251, then to bytes
      const cp1251Text = this.utf8ToCp1251(text);
      const bytes: number[] = [];
      
      for (let i = 0; i < cp1251Text.length; i++) {
        const char = cp1251Text[i];
        if (char.charCodeAt(0) > 127) {
          // Non-ASCII character - use CP1251 encoding
          bytes.push(char.charCodeAt(0) & 0xFF);
        } else {
          // ASCII character
          bytes.push(char.charCodeAt(0));
        }
      }
      
      return bytes;
    } catch (error) {
      console.warn('Failed to convert string to byte array, using UTF-8:', error);
      return Array.from(new TextEncoder().encode(text));
    }
  }

  /**
   * Generate ESC/POS commands for order ticket
   */
  private generateOrderTicket(order: OrderData): string {
    let commands = '';
    
    // Initialize printer
    commands += '\x1B\x40'; // ESC @ - Initialize printer
    
    // Set character encoding to CP1251 for Cyrillic support
    commands += '\x1B\x74\x11'; // ESC t 17 - Select character code table (CP1251)
    
    // Set alignment to center
    commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment
    
    // Print order type first (ДОСТАВКА/ВЗИМАНЕ)
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += this.utf8ToCp1251(`${order.orderType}\n\n`);
    
    // Print header
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += 'PIZZA STOP\n';
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal text
    commands += '================\n';
    commands += this.utf8ToCp1251(`Поръчка #${order.orderId}\n`);
    commands += this.utf8ToCp1251(`Дата: ${order.placedTime}\n\n`);
    
    // Set alignment to left
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    
    // Customer info
    commands += this.utf8ToCp1251('КЛИЕНТ:\n');
    commands += this.utf8ToCp1251(`Име: ${order.customerName}\n`);
    commands += this.utf8ToCp1251(`Телефон: ${order.phone}\n`);
    
    // Switch to Font B for address (ESC M 1)
    commands += '\x1B\x4D\x01';
    commands += this.utf8ToCp1251(`Адрес: ${order.address}\n`);
    // Switch back to Font A (ESC M 0)
    commands += '\x1B\x4D\x00';
    commands += '\n';
    
    // Order items
    commands += this.utf8ToCp1251('ПОРЪЧКА:\n');
    commands += '================\n';
    
    for (const item of order.items) {
      commands += this.utf8ToCp1251(`${item.quantity}x ${item.name}\n`);
      
      if (item.addons && item.addons.length > 0) {
        commands += this.utf8ToCp1251(`  Добавки: ${item.addons.join(', ')}\n`);
      }
      
      if (item.comment) {
        commands += this.utf8ToCp1251(`  Коментар: ${item.comment}\n`);
      }
      
      commands += '\n';
    }
    
    // No payment required
    commands += '================\n';
    commands += '\n';
    
    // Set alignment to center
    commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment
    // Bold on and double size
    commands += '\x1B\x45\x01'; // ESC E 1 - Bold ON
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += this.utf8ToCp1251('НЕ СЕ ИЗИСКВА ПЛАЩАНЕ\n');
    // Normal text and bold off
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal size
    commands += '\x1B\x45\x00'; // ESC E 0 - Bold OFF
    // Set alignment to left
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    commands += '\n';
    
    // Footer
    commands += '================\n';
    commands += this.utf8ToCp1251(`Телефон: ${order.restaurantPhone}\n`);
    commands += this.utf8ToCp1251('Благодарим за поръчката!\n\n\n');
    
    // Cut paper
    commands += '\x1D\x56\x00'; // GS V 0 - Full cut
    
    return commands;
  }

  /**
   * Generate ESC/POS commands for test ticket
   */
  private generateTestTicket(): string {
    let commands = '';
    
    // Initialize printer
    commands += '\x1B\x40'; // ESC @ - Initialize printer
    
    // Set character encoding to CP1251 for Cyrillic support
    commands += '\x1B\x74\x11'; // ESC t 17 - Select character code table (CP1251)
    
    // Set alignment to center
    commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment
    
    // Print test header
    commands += '\x1B\x21\x30'; // ESC ! 0 - Normal text
    commands += 'PIZZA STOP\n';
    commands += '================\n';
    commands += this.utf8ToCp1251('ТЕСТОВА СТРАНИЦА\n');
    commands += this.utf8ToCp1251(`Дата: ${new Date().toLocaleString('bg-BG')}\n\n`);
    
    // Set alignment to left
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    
    // Test content
    commands += this.utf8ToCp1251('Това е тестова страница за\n');
    commands += this.utf8ToCp1251('проверка на COM порт принтера.\n\n');
    commands += this.utf8ToCp1251('Ако виждате този текст,\n');
    commands += this.utf8ToCp1251('принтерът работи правилно!\n\n');
    
    // Test different text sizes
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal size
    commands += this.utf8ToCp1251('Нормален размер\n');
    
    commands += '\x1B\x21\x10'; // ESC ! 16 - Double height
    commands += this.utf8ToCp1251('Двойна височина\n');
    
    commands += '\x1B\x21\x20'; // ESC ! 32 - Double width
    commands += this.utf8ToCp1251('Двойна ширина\n');
    
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += this.utf8ToCp1251('Двойен размер\n\n');
    
    // Reset to normal
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal size
    
    // Footer
    commands += '================\n';
    commands += this.utf8ToCp1251('Тест завършен успешно!\n\n\n');
    
    // Cut paper
    commands += '\x1D\x56\x00'; // GS V 0 - Full cut
    
    return commands;
  }
}

// Export singleton instance
export const comPortPrinter = ComPortPrinter.getInstance();
