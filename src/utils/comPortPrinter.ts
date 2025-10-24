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
      
      // Send to COM port via API
      const response = await fetch('/api/printer/com-port', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comPort: this.config.comPort,
          baudRate: this.config.baudRate,
          data: ticketData
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
      
      // Send to COM port via API
      const response = await fetch('/api/printer/com-port', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comPort: this.config.comPort,
          baudRate: this.config.baudRate,
          data: testData
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
   * Generate ESC/POS commands for order ticket
   */
  private generateOrderTicket(order: OrderData): string {
    let commands = '';
    
    // Initialize printer
    commands += '\x1B\x40'; // ESC @ - Initialize printer
    
    // Set alignment to center
    commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment
    
    // Print order type first (ДОСТАВКА/ВЗИМАНЕ)
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += `${order.orderType}\n\n`;
    
    // Print header
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += 'PIZZA STOP\n';
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal text
    commands += '================\n';
    commands += `Поръчка #${order.orderId}\n`;
    commands += `Дата: ${order.placedTime}\n\n`;
    
    // Set alignment to left
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    
    // Customer info
    commands += 'КЛИЕНТ:\n';
    commands += `Име: ${order.customerName}\n`;
    commands += `Телефон: ${order.phone}\n`;
    
    // Switch to Font B for address (ESC M 1)
    commands += '\x1B\x4D\x01';
    commands += `Адрес: ${order.address}\n`;
    // Switch back to Font A (ESC M 0)
    commands += '\x1B\x4D\x00';
    commands += '\n';
    
    // Order items
    commands += 'ПОРЪЧКА:\n';
    commands += '================\n';
    
    for (const item of order.items) {
      commands += `${item.quantity}x ${item.name}\n`;
      
      if (item.addons && item.addons.length > 0) {
        commands += `  Добавки: ${item.addons.join(', ')}\n`;
      }
      
      if (item.comment) {
        commands += `  Коментар: ${item.comment}\n`;
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
    commands += 'НЕ СЕ ИЗИСКВА ПЛАЩАНЕ\n';
    // Normal text and bold off
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal size
    commands += '\x1B\x45\x00'; // ESC E 0 - Bold OFF
    // Set alignment to left
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    commands += '\n';
    
    // Footer
    commands += '================\n';
    commands += `Телефон: ${order.restaurantPhone}\n`;
    commands += 'Благодарим за поръчката!\n\n\n';
    
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
    
    // Set alignment to center
    commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment
    
    // Print test header
    commands += '\x1B\x21\x30'; // ESC ! 0 - Normal text
    commands += 'PIZZA STOP\n';
    commands += '================\n';
    commands += 'ТЕСТОВА СТРАНИЦА\n';
    commands += `Дата: ${new Date().toLocaleString('bg-BG')}\n\n`;
    
    // Set alignment to left
    commands += '\x1B\x61\x00'; // ESC a 0 - Left alignment
    
    // Test content
    commands += 'Това е тестова страница за\n';
    commands += 'проверка на COM порт принтера.\n\n';
    commands += 'Ако виждате този текст,\n';
    commands += 'принтерът работи правилно!\n\n';
    
    // Test different text sizes
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal size
    commands += 'Нормален размер\n';
    
    commands += '\x1B\x21\x10'; // ESC ! 16 - Double height
    commands += 'Двойна височина\n';
    
    commands += '\x1B\x21\x20'; // ESC ! 32 - Double width
    commands += 'Двойна ширина\n';
    
    commands += '\x1B\x21\x30'; // ESC ! 48 - Double size
    commands += 'Двойен размер\n\n';
    
    // Reset to normal
    commands += '\x1B\x21\x00'; // ESC ! 0 - Normal size
    
    // Footer
    commands += '================\n';
    commands += 'Тест завършен успешно!\n\n\n';
    
    // Cut paper
    commands += '\x1D\x56\x00'; // GS V 0 - Full cut
    
    return commands;
  }
}

// Export singleton instance
export const comPortPrinter = ComPortPrinter.getInstance();
