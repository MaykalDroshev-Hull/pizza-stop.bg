/**
 * ESC/POS command generator for thermal printers
 */

export interface OrderData {
  orderId: number;
  dailyOrderNumber?: number; // Daily order sequence number
  orderType: string;
  customerName: string;
  phone: string;
  address?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string; // Product size (e.g., "30cm", "60cm")
    addons?: string[];
    comment?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod?: string;
  paymentMethodId?: number; // Payment method ID for status determination
  isPaid: boolean;
  placedTime: string;
  restaurantPhone: string;
}

export class ESCPOSCommands {
  // ESC/POS Control Characters
  private static readonly ESC = 0x1B;
  private static readonly GS = 0x1D;
  private static readonly LF = 0x0A;

  /**
   * Initialize printer with proper setup
   */
  static init(): Uint8Array {
    const commands: Uint8Array[] = [];
    
    // Initialize printer
    commands.push(new Uint8Array([ESCPOSCommands.ESC, 0x40]));
    
    // Set character encoding to UTF-8
    commands.push(new Uint8Array([ESCPOSCommands.ESC, 0x74, 0x00]));
    
    // Set line spacing
    commands.push(new Uint8Array([ESCPOSCommands.ESC, 0x33, 0x18]));
    
    // Set print density
    commands.push(new Uint8Array([ESCPOSCommands.GS, 0x28, 0x4C, 0x02, 0x00, 0x30, 0x00]));
    
    return this.combine(...commands);
  }

  /**
   * Set text alignment
   */
  static setAlign(align: 'left' | 'center' | 'right'): Uint8Array {
    const alignCodes = { left: 0x00, center: 0x01, right: 0x02 };
    return new Uint8Array([ESCPOSCommands.ESC, 0x61, alignCodes[align]]);
  }

  /**
   * Set text size
   */
  static setSize(width: number, height: number): Uint8Array {
    const size = ((width - 1) << 4) | (height - 1);
    return new Uint8Array([ESCPOSCommands.GS, 0x21, size]);
  }

  /**
   * Set bold
   */
  static setBold(enabled: boolean): Uint8Array {
    return new Uint8Array([ESCPOSCommands.ESC, 0x45, enabled ? 0x01 : 0x00]);
  }

  /**
   * Set font type (for Datecs printers)
   * @param font 0 = Font A (standard), 1 = Font B (compact)
   */
  static setFont(font: 0 | 1): Uint8Array {
    return new Uint8Array([ESCPOSCommands.ESC, 0x4D, font]);
  }

  /**
   * Feed lines
   */
  static feedLines(lines: number): Uint8Array {
    return new Uint8Array([ESCPOSCommands.ESC, 0x64, lines]);
  }

  /**
   * Cut paper - For Datecs EP-2000
   * 
   * According to Datecs EP-2000 manual (section 87, lines 2892-2920):
   * Command: GS V [1Dh] [56h] + m + n
   * 
   * m = 1: Feeds paper to cutting position and cuts receipt (n not significant)
   * m = 66 (0x42): Feeds paper + n steps (n x 0.125mm), then cuts
   * m = 104 (0x68): Feeds paper + n steps, cuts, and feeds paper back to print position
   * 
   * Using mode m=66 with n=40 (5mm extra feed) for clean cuts.
   */
  static cut(): Uint8Array {
    const GS = 0x1D;
    const V = 0x56;
    const mode = 0x42; // 66 decimal - Feed extra lines before cutting
    const extraFeed = 40; // 40 steps x 0.125mm = 5mm extra feed
    
    return new Uint8Array([GS, V, mode, extraFeed]);
  }

  /**
   * Convert text to bytes with CP1251 encoding for Cyrillic support
   */
  static text(text: string): Uint8Array {
    try {
      // Convert UTF-8 Cyrillic to CP1251 for Datecs printers
      const cp1251Text = ESCPOSCommands.utf8ToCp1251(text);
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
      
      return new Uint8Array(bytes);
    } catch (error) {
      console.warn('Failed to convert UTF-8 to CP1251, using UTF-8:', error);
      const encoder = new TextEncoder();
      return encoder.encode(text);
    }
  }

  /**
   * Convert UTF-8 text to CP1251 for Datecs printers
   */
  private static utf8ToCp1251(text: string): string {
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
   * Line feed
   */
  static lineFeed(): Uint8Array {
    return new Uint8Array([ESCPOSCommands.LF]);
  }

  /**
   * Generate separator line
   */
  static separator(char: string = '=', length: number = 48): Uint8Array {
    return ESCPOSCommands.text(char.repeat(length));
  }

  /**
   * Combine multiple commands
   */
  static combine(...commands: Uint8Array[]): Uint8Array {
    const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const cmd of commands) {
      result.set(cmd, offset);
      offset += cmd.length;
    }
    
    return result;
  }

  /**
   * Word wrap text to fit printer width
   */
  static wrapText(text: string, maxWidth: number = 48): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Generate complete order ticket
   */
  static generateOrderTicket(order: OrderData): Uint8Array {
    const commands: Uint8Array[] = [];

    // Initialize
    commands.push(this.init());

    // Header - Order Type (ДОСТАВКА/ВЗИМАНЕ)
    commands.push(
      this.setAlign('center'),
      this.setSize(2, 2),
      this.setBold(true),
      this.text(order.orderType),
      this.lineFeed(),
      this.setSize(1, 1),
      this.setBold(false),
      this.feedLines(1)
    );

    // Restaurant name
    commands.push(
      this.setSize(2, 2),
      this.setBold(true),
      this.text('PIZZA STOP'),
      this.lineFeed(),
      this.setSize(1, 1),
      this.setBold(false),
      this.text('www.pizza-stop.bg'),
      this.lineFeed(),
      this.text(`тел: ${order.restaurantPhone}`),
      this.feedLines(2)
    );

    // Separator
    commands.push(
      this.setAlign('left'),
      this.separator('=', 48),
      this.lineFeed()
    );

    // Order number (with daily sequence if available)
    const orderNumberText = order.dailyOrderNumber 
      ? `ПОРЪЧКА #${order.dailyOrderNumber}` 
      : `ПОРЪЧКА #${order.orderId}`;
    
    commands.push(
      this.setBold(true),
      this.setAlign('center'),
      this.text(orderNumberText),
      this.lineFeed(),
      this.setBold(false),
      this.setAlign('left'),
      this.separator('=', 48),
      this.lineFeed()
    );

    // Order info
    commands.push(
      this.text(`Дата/Час: ${order.placedTime}`),
      this.lineFeed(),
      this.separator('-', 48),
      this.lineFeed()
    );

    // Customer info
    commands.push(
      this.setBold(true),
      this.text('КЛИЕНТ:'),
      this.lineFeed(),
      this.setBold(false),
      this.text(`Име: ${order.customerName}`),
      this.lineFeed(),
      this.text(`Тел: ${order.phone}`),
      this.lineFeed()
    );

    if (order.address) {
      // Switch to Font B for address (compact font)
      commands.push(
        this.setFont(1)
      );
      
      // Wrap long addresses (using wider wrap for Font B)
      const addressLines = this.wrapText(order.address, 48);
      commands.push(
        this.text('Адрес: '),
        this.text(addressLines[0] || ''),
        this.lineFeed()
      );
      
      for (let i = 1; i < addressLines.length; i++) {
        commands.push(
          this.text('       '),
          this.text(addressLines[i]),
          this.lineFeed()
        );
      }
      
      // Switch back to Font A (standard)
      commands.push(
        this.setFont(0)
      );
    }

    commands.push(
      this.separator('=', 48),
      this.lineFeed()
    );

    // Items
    commands.push(
      this.setBold(true),
      this.text('АРТИКУЛИ:'),
      this.lineFeed(),
      this.setBold(false),
      this.separator('-', 48),
      this.lineFeed()
    );

    for (const item of order.items) {
      // Include size if available (e.g., "30cm", "60cm")
      const sizeText = item.size ? ` (${item.size})` : '';
      const itemLine = `${item.quantity}x ${item.name}${sizeText}`;
      
      commands.push(
        this.text(itemLine),
        this.lineFeed()
      );

      if (item.addons && item.addons.length > 0) {
        const addonsText = `  + ${item.addons.join(', ')}`;
        const addonsLines = this.wrapText(addonsText, 46);
        
        for (const line of addonsLines) {
          commands.push(
            this.text(line),
            this.lineFeed()
          );
        }
      }

      if (item.comment) {
        const commentText = `  Забележка: ${item.comment}`;
        const commentLines = this.wrapText(commentText, 46);
        
        for (const line of commentLines) {
          commands.push(
            this.text(line),
            this.lineFeed()
          );
        }
      }
    }

    commands.push(
      this.separator('=', 48),
      this.lineFeed()
    );

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
    
    commands.push(
      this.feedLines(1),
      this.setAlign('center'),
      this.setBold(true),
      this.setSize(1, 2),
      this.text(paymentStatusText),
      this.lineFeed(),
      this.setSize(1, 1),
      this.setBold(false),
      this.setAlign('left'),
      this.feedLines(1)
    );

    // Footer
    commands.push(
      this.feedLines(2),
      this.setAlign('center'),
      this.text('Благодарим Ви!'),
      this.lineFeed(),
      this.text('Приятен апетит!')
    );

    // Cut paper using GS V command (Datecs EP-2000 manual section 87)
    const cutCmd = this.cut();
    console.log('🔪 [Cut Command] Sending GS V cut:', Array.from(cutCmd).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
    commands.push(cutCmd);

    return this.combine(...commands);
  }

  /**
   * Generate test ticket
   */
  static generateTestTicket(): Uint8Array {
    const commands: Uint8Array[] = [];

    commands.push(
      this.init(),
      this.setAlign('center'),
      this.setSize(2, 2),
      this.setBold(true),
      this.text('PIZZA STOP'),
      this.lineFeed(),
      this.setSize(1, 1),
      this.setBold(false),
      this.text('Test Print'),
      this.lineFeed(),
      this.lineFeed(),
      this.separator('=', 48),
      this.lineFeed(),
      this.setAlign('left'),
      this.text(`Time: ${new Date().toLocaleString('bg-BG')}`),
      this.lineFeed(),
      this.text('Status: Connection OK'),
      this.lineFeed(),
      this.text('Web Serial API Active'),
      this.lineFeed(),
      this.lineFeed(),
      this.setAlign('center'),
      this.text('--- END TEST ---'),
      this.lineFeed(),
      this.lineFeed(),
      this.lineFeed(),
      this.lineFeed(),
      this.cut()
    );

    return this.combine(...commands);
  }

  /**
   * Generate simple text print
   */
  static generateTextPrint(text: string): Uint8Array {
    const commands: Uint8Array[] = [];

    commands.push(
      this.init(),
      this.setAlign('left'),
      this.text(text),
      this.lineFeed(),
      this.feedLines(2),
      this.cut()
    );

    return this.combine(...commands);
  }

  /**
   * Generate QR code (if printer supports it)
   */
  static generateQRCode(data: string): Uint8Array {
    const commands: Uint8Array[] = [];
    
    // QR Code model and size
    commands.push(
      new Uint8Array([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]), // QR Code model 2, size 3
      new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08]), // Error correction level M
      new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30]) // Store data
    );
    
    // Store QR code data
    const dataBytes = this.text(data);
    const dataLength = dataBytes.length + 3;
    commands.push(
      new Uint8Array([0x1D, 0x28, 0x6B, dataLength & 0xFF, (dataLength >> 8) & 0xFF, 0x31, 0x50, 0x30]),
      dataBytes
    );
    
    // Print QR code
    commands.push(
      new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]),
      this.lineFeed()
    );

    return this.combine(...commands);
  }
}
