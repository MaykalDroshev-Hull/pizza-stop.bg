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
   * Initialize printer
   */
  static init(): Uint8Array {
    return new Uint8Array([ESCPOSCommands.ESC, 0x40]);
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
   * Convert text to bytes
   */
  static text(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
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

    // Header - PIZZA STOP
    commands.push(
      this.setAlign('center'),
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
      this.text(`Тип: ${order.orderType}`),
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
      // Wrap long addresses
      const addressLines = this.wrapText(order.address, 40);
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
      const price = `${(item.quantity * item.price).toFixed(2)} лв`;
      const spaces = 48 - itemLine.length - price.length;
      
      commands.push(
        this.text(itemLine + ' '.repeat(Math.max(0, spaces)) + price),
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

    // Totals
    commands.push(
      this.setBold(true),
      this.text(`Междинна сума:${' '.repeat(20)}${order.subtotal.toFixed(2)} лв`),
      this.lineFeed()
    );

    if (order.deliveryCharge > 0) {
      commands.push(
        this.text(`Доставка:${' '.repeat(26)}${order.deliveryCharge.toFixed(2)} лв`),
        this.lineFeed()
      );
    }

    commands.push(
      this.separator(),
      this.lineFeed(),
      this.setSize(1, 2),
      this.text(`ОБЩО:${' '.repeat(20)}${order.total.toFixed(2)} лв`),
      this.lineFeed(),
      this.setSize(1, 1),
      this.setBold(false),
      this.separator(),
      this.lineFeed()
    );

    // Payment info
    if (order.paymentMethod) {
      commands.push(
        this.text(`Плащане: ${order.paymentMethod}`),
        this.lineFeed()
      );
    }

    if (order.isPaid) {
      commands.push(
        this.setAlign('center'),
        this.setBold(true),
        this.text('*** ПЛАТЕНА ***'),
        this.lineFeed(),
        this.setBold(false),
        this.setAlign('left')
      );
    }

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
      this.separator(),
      this.lineFeed(),
      this.text(`Time: ${new Date().toLocaleString('bg-BG')}`),
      this.lineFeed(),
      this.text('Status: Connection OK'),
      this.lineFeed(),
      this.text('Web Serial API Active'),
      this.feedLines(3),
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
