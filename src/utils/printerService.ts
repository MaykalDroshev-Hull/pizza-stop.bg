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
  CUT: [GS, 0x56, 0x42, 40],            // Cut paper (GS V, mode 66, 40 steps = 5mm feed)
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
  FONT_A: [ESC, 0x4D, 0x00],            // Font A (standard)
  FONT_B: [ESC, 0x4D, 0x01],            // Font B (compact)
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
  
  // Header - Order Type (ДОСТАВКА/ВЗИМАНЕ)
  bytes.push(...Commands.ALIGN_CENTER);
  bytes.push(...Commands.DOUBLE_HEIGHT);
  bytes.push(...Commands.BOLD_ON);
  bytes.push(...textToBytes(data.orderType));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.NORMAL_SIZE);
  bytes.push(...Commands.BOLD_OFF);
  bytes.push(...Commands.FEED_LINE);
  
  // Restaurant Name
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
  bytes.push(...textToBytes(twoColumnLine('Дата:', data.placedTime.split(' ')[0], width)));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...textToBytes(twoColumnLine('Час:', data.placedTime.split(' ')[1] || data.placedTime, width)));
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
  bytes.push(...textToBytes('Тел: ' + data.phone));
  bytes.push(...Commands.FEED_LINE);
  
  if (data.address) {
    // Switch to Font B for address (compact font)
    bytes.push(...Commands.FONT_B);
    
    // Word wrap long addresses (Font B allows more characters per line)
    const fontBWidth = Math.floor(width * 1.3); // Font B is more compact
    const addressWords = data.address.split(' ');
    let currentLine = 'Адрес: ';
    
    for (const word of addressWords) {
      if (currentLine.length + word.length + 1 > fontBWidth) {
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
    
    // Switch back to Font A (standard)
    bytes.push(...Commands.FONT_A);
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
    // Item name only (no price)
    const itemLine = `${item.quantity}x ${item.name}`;
    bytes.push(...textToBytes(itemLine));
    bytes.push(...Commands.FEED_LINE);
    
    // Addons/customizations
    if (item.addons && item.addons.length > 0) {
      const addonsText = '  + ' + item.addons.join(', ');
      
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
  
  // No payment required message
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.ALIGN_CENTER);
  bytes.push(...Commands.BOLD_ON);
  bytes.push(...Commands.DOUBLE_HEIGHT);
  bytes.push(...textToBytes('НЕ СЕ ИЗИСКВА ПЛАЩАНЕ'));
  bytes.push(...Commands.FEED_LINE);
  bytes.push(...Commands.NORMAL_SIZE);
  bytes.push(...Commands.BOLD_OFF);
  bytes.push(...Commands.ALIGN_LEFT);
  bytes.push(...Commands.FEED_LINE);
  
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
    orderId: 999,
    orderType: 'ДОСТАВКА',
    customerName: 'Test Customer',
    address: 'Test Address',
    phone: '0888 123 456',
    items: [
      {
        name: 'Test Item',
        quantity: 1,
        price: 10.00,
        addons: ['Test Addon'],
        comment: 'This is a test print',
      },
    ],
    subtotal: 10.00,
    serviceCharge: 0,
    deliveryCharge: 0,
    total: 10.00,
    isPaid: false,
    paymentMethod: 'Cash',
    placedTime: new Date().toLocaleString('bg-BG'),
    deliveryTime: new Date().toLocaleString('bg-BG'),
    restaurantName: 'Pizza Stop',
    restaurantAddress: 'Test Address',
    restaurantPhone: '0888 123 456',
  };

  return printToNetworkPrinter(testData);
}


