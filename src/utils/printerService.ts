/**
 * Network Printer Service
 * For thermal printers with Ethernet/WiFi connectivity
 * Uses ESC/POS protocol for direct printing
 */

import { TicketData } from './ticketTemplate';

// Printer configuration - UPDATE THESE VALUES
const PRINTER_CONFIG = {
  // Network printer IP address (find this from printer's network config page)
  ip: process.env.NEXT_PUBLIC_PRINTER_IP || '192.168.1.100',
  
  // Port (usually 9100 for raw printing, some printers use 9101 or 9102)
  port: parseInt(process.env.NEXT_PUBLIC_PRINTER_PORT || '9100'),
  
  // Character encoding (CP437 for most thermal printers, UTF-8 for modern ones)
  encoding: 'CP437',
  
  // Paper width in characters (usually 48 for 78mm printers)
  width: 48,
};

// ESC/POS Commands
const ESC = 0x1B;
const GS = 0x1D;

const Commands = {
  INIT: [ESC, 0x40],                    // Initialize printer
  CUT: [ESC, 0x69],                     // Cut paper
  BOLD_ON: [ESC, 0x45, 0x01],           // Bold text ON
  BOLD_OFF: [ESC, 0x45, 0x00],          // Bold text OFF
  UNDERLINE_ON: [ESC, 0x2D, 0x02],      // Underline ON
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],     // Underline OFF
  DOUBLE_HEIGHT: [GS, 0x21, 0x11],      // 2x height and width
  NORMAL_SIZE: [GS, 0x21, 0x00],        // Normal size
  ALIGN_LEFT: [ESC, 0x61, 0x00],        // Left alignment
  ALIGN_CENTER: [ESC, 0x61, 0x01],      // Center alignment
  ALIGN_RIGHT: [ESC, 0x61, 0x02],       // Right alignment
  FEED_LINE: [ESC, 0x64, 0x01],         // Feed 1 line
  FEED_LINES: (n: number) => [ESC, 0x64, n], // Feed n lines
};

/**
 * Helper function to convert string to byte array
 */
function textToBytes(text: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text));
}

/**
 * Helper function to pad text for alignment
 */
function padText(text: string, width: number, align: 'left' | 'right' | 'center' = 'left'): string {
  const textLength = text.length;
  if (textLength >= width) return text.substring(0, width);
  
  const padding = width - textLength;
  
  if (align === 'center') {
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  } else if (align === 'right') {
    return ' '.repeat(padding) + text;
  } else {
    return text + ' '.repeat(padding);
  }
}

/**
 * Helper function to create a line with two columns
 */
function twoColumnLine(left: string, right: string, width: number): string {
  const availableWidth = width - 1; // Leave 1 space between columns
  const leftMaxWidth = Math.floor(availableWidth * 0.6);
  const rightMaxWidth = availableWidth - leftMaxWidth;
  
  const leftTrimmed = left.length > leftMaxWidth ? left.substring(0, leftMaxWidth) : left;
  const rightTrimmed = right.length > rightMaxWidth ? right.substring(0, rightMaxWidth) : right;
  
  const spacesNeeded = width - leftTrimmed.length - rightTrimmed.length;
  
  return leftTrimmed + ' '.repeat(spacesNeeded) + rightTrimmed;
}

/**
 * Generate ESC/POS bytes for a ticket
 */
function generateTicketBytes(data: TicketData): number[] {
  const bytes: number[] = [];
  const width = PRINTER_CONFIG.width;
  
  // Initialize printer
  bytes.push(...Commands.INIT);
  
  // Header - Logo/Restaurant Name
  bytes.push(...Commands.ALIGN_CENTER);
  bytes.push(...Commands.DOUBLE_HEIGHT);
  bytes.push(...Commands.BOLD_ON);
  bytes.push(...textToBytes('PIZZA STOP'));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.NORMAL_SIZE);
  bytes.push(...Commands.BOLD_OFF);
  
  bytes.push(...textToBytes('www.pizza-stop.bg'));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...textToBytes('тел: ' + data.restaurantPhone));
  bytes.push(...Commands.FEED_LINES(2));
  
  // Separator line
  bytes.push(...Commands.ALIGN_LEFT);
  bytes.push(...textToBytes('='.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  // Order info
  bytes.push(...Commands.BOLD_ON);
  bytes.push(...textToBytes(padText('ПОРЪЧКА #' + data.orderId, width, 'center')));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.BOLD_OFF);
  
  bytes.push(...textToBytes('='.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  // Date and time
  bytes.push(...textToBytes(twoColumnLine('Дата:', data.date, width)));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...textToBytes(twoColumnLine('Час:', data.time, width)));
  bytes.push(...Commands.FEED_LINE);
  
  // Order type
  bytes.push(...textToBytes(twoColumnLine('Тип:', data.orderType, width)));
  bytes.push(...Commands.FEED_LINE);
  
  bytes.push(...textToBytes('-'.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  // Customer info
  bytes.push(...Commands.BOLD_ON);
  bytes.push(...textToBytes('КЛИЕНТ:'));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.BOLD_OFF);
  
  bytes.push(...textToBytes('Име: ' + data.customerName));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...textToBytes('Тел: ' + data.customerPhone));
  bytes.push(...Commands.FEED_LINE);
  
  if (data.address) {
    // Word wrap long addresses
    const addressWords = data.address.split(' ');
    let currentLine = 'Адрес: ';
    
    for (const word of addressWords) {
      if (currentLine.length + word.length + 1 > width) {
        bytes.push(...textToBytes(currentLine));
        bytes.push(...Commands.FEED_LINE);
        currentLine = '       ' + word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    
    if (currentLine.trim().length > 0) {
      bytes.push(...textToBytes(currentLine));
      bytes.push(...Commands.FEED_LINE);
    }
  }
  
  bytes.push(...textToBytes('='.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  // Items
  bytes.push(...Commands.BOLD_ON);
  bytes.push(...textToBytes('АРТИКУЛИ:'));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.BOLD_OFF);
  
  bytes.push(...textToBytes('-'.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  data.items.forEach(item => {
    // Item name and price
    const itemLine = `${item.quantity}x ${item.name}`;
    const price = `${item.totalPrice.toFixed(2)} лв`;
    bytes.push(...textToBytes(twoColumnLine(itemLine, price, width)));
    bytes.push(...Commands.FEED_LINE);
    
    // Addons/customizations
    if (item.customizations && item.customizations.length > 0) {
      const addonsText = '  + ' + item.customizations.join(', ');
      
      // Word wrap addons
      if (addonsText.length > width) {
        const words = addonsText.split(' ');
        let line = '';
        
        for (const word of words) {
          if (line.length + word.length + 1 > width) {
            bytes.push(...textToBytes(line));
            bytes.push(...Commands.FEED_LINE);
            line = '    ' + word + ' ';
          } else {
            line += word + ' ';
          }
        }
        
        if (line.trim().length > 0) {
          bytes.push(...textToBytes(line));
          bytes.push(...Commands.FEED_LINE);
        }
      } else {
        bytes.push(...textToBytes(addonsText));
        bytes.push(...Commands.FEED_LINE);
      }
    }
    
    // Comment
    if (item.comment) {
      bytes.push(...textToBytes('  Забележка: ' + item.comment));
      bytes.push(...Commands.FEED_LINE);
    }
  });
  
  bytes.push(...textToBytes('='.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  // Special instructions
  if (data.specialInstructions) {
    bytes.push(...Commands.BOLD_ON);
    bytes.push(...textToBytes('СПЕЦИАЛНИ ИНСТРУКЦИИ:'));
    bytes.push(...Commands.FEED_LINE);
    bytes.push(...Commands.BOLD_OFF);
    bytes.push(...textToBytes(data.specialInstructions));
    bytes.push(...Commands.FEED_LINES(2));
  }
  
  // Totals
  bytes.push(...Commands.BOLD_ON);
  bytes.push(...textToBytes(twoColumnLine('Междинна сума:', data.subtotal.toFixed(2) + ' лв', width)));
  bytes.push(...Commands.FEED_LINE);
  
  if (data.deliveryFee > 0) {
    bytes.push(...textToBytes(twoColumnLine('Доставка:', data.deliveryFee.toFixed(2) + ' лв', width)));
    bytes.push(...Commands.FEED_LINE);
  }
  
  bytes.push(...textToBytes('='.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  bytes.push(...Commands.DOUBLE_HEIGHT);
  bytes.push(...textToBytes(twoColumnLine('ОБЩО:', data.totalPrice.toFixed(2) + ' лв', width)));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.NORMAL_SIZE);
  bytes.push(...Commands.BOLD_OFF);
  
  bytes.push(...textToBytes('='.repeat(width)));
  bytes.push(...Commands.FEED_LINE);
  
  // Payment info
  if (data.paymentMethod) {
    bytes.push(...textToBytes('Плащане: ' + data.paymentMethod));
    bytes.push(...Commands.FEED_LINE);
  }
  
  if (data.isPaid) {
    bytes.push(...Commands.BOLD_ON);
    bytes.push(...textToBytes(padText('*** ПЛАТЕНА ***', width, 'center')));
    bytes.push(...Commands.FEED_LINE);
    bytes.push(...Commands.BOLD_OFF);
  }
  
  // Footer
  bytes.push(...Commands.FEED_LINES(2));
  bytes.push(...Commands.ALIGN_CENTER);
  bytes.push(...textToBytes('Благодарим Ви!'));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...textToBytes('Приятен апетит!'));
  bytes.push(...Commands.FEED_LINES(3));
  
  // Cut paper
  bytes.push(...Commands.CUT);
  
  return bytes;
}

/**
 * Send print job to network printer
 */
export async function printToNetworkPrinter(data: TicketData): Promise<boolean> {
  try {
    console.log('🖨️ Preparing to print to network printer:', PRINTER_CONFIG.ip);
    
    // Generate ESC/POS bytes
    const bytes = generateTicketBytes(data);
    
    // Send to printer via API endpoint (this calls your backend)
    const response = await fetch('/api/printer/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerIp: PRINTER_CONFIG.ip,
        printerPort: PRINTER_CONFIG.port,
        data: Array.from(bytes), // Convert to array for JSON serialization
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to print');
    }
    
    const result = await response.json();
    console.log('✅ Print job sent successfully:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Error printing to network printer:', error);
    throw error;
  }
}

/**
 * Test printer connection
 */
export async function testPrinterConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/printer/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerIp: PRINTER_CONFIG.ip,
        printerPort: PRINTER_CONFIG.port,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.message || 'Connection failed' };
    }
    
    const result = await response.json();
    return { success: true, message: result.message || 'Connection successful' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Print test page
 */
export async function printTestPage(): Promise<boolean> {
  const testData: TicketData = {
    orderId: '999',
    date: new Date().toLocaleDateString('bg-BG'),
    time: new Date().toLocaleTimeString('bg-BG'),
    orderType: 'TEST',
    customerName: 'Test Customer',
    customerPhone: '0888 123 456',
    address: 'Test Address',
    items: [
      {
        name: 'Test Item',
        quantity: 1,
        unitPrice: 10.00,
        totalPrice: 10.00,
        customizations: ['Test Addon'],
        comment: 'This is a test print',
      },
    ],
    subtotal: 10.00,
    deliveryFee: 0,
    totalPrice: 10.00,
    paymentMethod: 'Cash',
    isPaid: false,
    restaurantPhone: '0888 123 456',
    specialInstructions: 'This is a test print from Pizza Stop',
  };
  
  return printToNetworkPrinter(testData);
}


