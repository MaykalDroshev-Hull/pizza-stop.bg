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
  dailyOrderNumber?: number; // Daily order sequence number
  orderType: string;
  customerName: string;
  phone: string;
  address: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string; // Product size (e.g., "30cm", "60cm")
    addons: string[];
    comment?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: string;
  paymentMethodId?: number; // Payment method ID for status determination
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
      // Create a mapping for common Cyrillic characters
      const cyrillicMap: { [key: string]: string } = {
        'А': '\xC0', 'Б': '\xC1', 'В': '\xC2', 'Г': '\xC3', 'Д': '\xC4', 'Е': '\xC5', 'Ж': '\xC6', 'З': '\xC7',
        'И': '\xC8', 'Й': '\xC9', 'К': '\xCA', 'Л': '\xCB', 'М': '\xCC', 'Н': '\xCD', 'О': '\xCE', 'П': '\xCF',
        'Р': '\xD0', 'С': '\xD1', 'Т': '\xD2', 'У': '\xD3', 'Ф': '\xD4', 'Х': '\xD5', 'Ц': '\xD6', 'Ч': '\xD7',
        'Ш': '\xD8', 'Щ': '\xD9', 'Ъ': '\xDA', 'Ь': '\xDB', 'Ю': '\xDC', 'Я': '\xDD',
        'а': '\xE0', 'б': '\xE1', 'в': '\xE2', 'г': '\xE3', 'д': '\xE4', 'е': '\xE5', 'ж': '\xE6', 'з': '\xE7',
        'и': '\xE8', 'й': '\xE9', 'к': '\xEA', 'л': '\xEB', 'м': '\xEC', 'н': '\xED', 'о': '\xEE', 'п': '\xEF',
        'р': '\xF0', 'с': '\xF1', 'т': '\xF2', 'у': '\xF3', 'ф': '\xF4', 'х': '\xF5', 'ц': '\xF6', 'ч': '\xF7',
        'ш': '\xF8', 'щ': '\xF9', 'ъ': '\xFA', 'ь': '\xFB', 'ю': '\xFC', 'я': '\xFD'
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
    commands += '================================================\n';
    // Use daily order number if available
    const orderNumber = order.dailyOrderNumber || order.orderId;
    commands += this.utf8ToCp1251(`Поръчка #${orderNumber}\n`);
    commands += '================================================\n';
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
    commands += this.utf8ToCp1251('АРТИКУЛИ:\n');
    commands += '------------------------------------------------\n';
    
    for (const item of order.items) {
      // Include size if available (e.g., "30cm", "60cm")
      const sizeText = item.size ? ` (${item.size})` : '';
      commands += this.utf8ToCp1251(`${item.quantity}x ${item.name}${sizeText}\n`);
      
      if (item.addons && item.addons.length > 0) {
        commands += this.utf8ToCp1251(`  + ${item.addons.join(', ')}\n`);
      }
      
      if (item.comment) {
        commands += this.utf8ToCp1251(`  Забележка: ${item.comment}\n`);
      }
      
      commands += '\n';
    }
    
    commands += '================================================\n';
    commands += '\n';
    
    // Payment status based on payment method
    // Payment method ID 5 = Online (Paid), 3/4 = On delivery (Unpaid)
    let paymentStatusText = 'НЕ СЕ ИЗИСКВА ПЛАЩАНЕ';
    
    if (order.paymentMethodId !== undefined) {
      if (order.paymentMethodId === 5) {
        // Online payment - Paid
        paymentStatusText = 'ПЛАТЕНО ОНЛАЙН';
      } else if (order.paymentMethodId === 3 || order.paymentMethodId === 4) {
        // Payment on delivery - Unpaid
        paymentStatusText = 'НЕПЛАТЕНО - ПЛАЩАНЕ ПРИ ДОСТАВКА';
      }
    }
    
    // Set alignment to center
    commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment
    // Bold on and double size
    commands += '\x1B\x45\x01'; // ESC E 1 - Bold ON
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += this.utf8ToCp1251(`${paymentStatusText}\n`);
    // Normal text and bold off
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal size
    commands += '\x1B\x45\x00'; // ESC E 0 - Bold OFF
    // Set alignment to left
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    commands += '\n';
    
    // Footer
    commands += '================\n';
    commands += this.utf8ToCp1251(`Телефон: ${order.restaurantPhone}\n`);
    commands += this.utf8ToCp1251('Благодарим за поръчката!\n');
    
    // Cut paper using GS V command (Datecs EP-2000 manual section 87)
    // GS V [1Dh] [56h] + m + n
    // m = 66 (0x42): Feed n steps before cutting
    // n = 40: Extra feed (40 x 0.125mm = 5mm)
    commands += '\x1D\x56\x42\x28'; // GS V mode=66 n=40
    
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
    commands += this.utf8ToCp1251('Тест завършен успешно!\n');
    
    // Cut paper using GS V command (Datecs EP-2000 manual section 87)
    commands += '\x1D\x56\x42\x28'; // GS V mode=66 n=40 (feed 5mm before cut)
    
    return commands;
  }
}

// Export singleton instance
export const comPortPrinter = ComPortPrinter.getInstance();
