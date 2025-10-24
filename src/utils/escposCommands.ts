/**
 * ESC/POS command generator for thermal printers
 */

export interface OrderData {
  orderId: number;
  orderType: string;
  customerName: string;
  phone: string;
  address?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    addons?: string[];
    comment?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod?: string;
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
    
    // Set character encoding to CP1251 for Datecs printers
    commands.push(new Uint8Array([ESCPOSCommands.ESC, 0x74, 0x11]));
    
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
   * Cut paper
   */
  static cut(): Uint8Array {
    return new Uint8Array([ESCPOSCommands.ESC, 0x69]);
  }

  /**
   * Convert UTF-8 text to CP1251 for Datecs printers
   */
  private static utf8ToCp1251(text: string): string {
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
   * Convert text to bytes with CP1251 encoding for Cyrillic support
   */
  static text(text: string): Uint8Array {
    try {
      // Convert Cyrillic to CP1251, then to bytes
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
      console.warn('Failed to convert text with CP1251, using UTF-8:', error);
      const encoder = new TextEncoder();
      return encoder.encode(text);
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
      this.separator(),
      this.lineFeed()
    );

    // Order number
    commands.push(
      this.setBold(true),
      this.setAlign('center'),
      this.text(`ПОРЪЧКА #${order.orderId}`),
      this.lineFeed(),
      this.setBold(false),
      this.setAlign('left'),
      this.separator(),
      this.lineFeed()
    );

    // Order info
    commands.push(
      this.text(`Дата/Час: ${order.placedTime}`),
      this.lineFeed(),
      this.separator('-'),
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
      this.separator(),
      this.lineFeed()
    );

    // Items
    commands.push(
      this.setBold(true),
      this.text('АРТИКУЛИ:'),
      this.lineFeed(),
      this.setBold(false),
      this.separator('-'),
      this.lineFeed()
    );

    for (const item of order.items) {
      const itemLine = `${item.quantity}x ${item.name}`;
      
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
      this.separator(),
      this.lineFeed()
    );

    // Payment info - No payment required
    commands.push(
      this.feedLines(1),
      this.setAlign('center'),
      this.setBold(true),
      this.setSize(1, 2),
      this.text('НЕ СЕ ИЗИСКВА ПЛАЩАНЕ'),
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
      this.text('Приятен апетит!'),
      this.feedLines(3)
    );

    // Cut paper
    commands.push(this.cut());

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
      this.separator(),
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
