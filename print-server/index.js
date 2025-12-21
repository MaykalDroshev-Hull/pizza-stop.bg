/**
 * Pizza Stop - Local Print Server
 * 
 * This server runs on the PC connected to the USB printer
 * It receives print jobs from your web application and prints them
 * 
 * Setup:
 * 1. Install Node.js on the PC connected to printer
 * 2. Run: npm install
 * 3. Configure printer in .env file
 * 4. Run: npm start
 * 5. Server will run on http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const escpos = require('escpos');
require('dotenv').config();

// USB Adapter
escpos.USB = require('escpos-usb');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow requests from web app
app.use(bodyParser.json({ limit: '10mb' }));

// Logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  next();
});

/**
 * Find USB printer
 */
function findPrinter() {
  try {
    const devices = escpos.USB.findPrinter();
    
    if (devices.length === 0) {
      return null;
    }
    
    // Return first printer (you can add logic to select specific printer)
    return new escpos.USB(
      devices[0].deviceDescriptor.idVendor,
      devices[0].deviceDescriptor.idProduct
    );
  } catch (error) {
    console.error('❌ Error finding printer:', error.message);
    return null;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Print server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * List available printers
 */
app.get('/printers', (req, res) => {
  try {
    const devices = escpos.USB.findPrinter();
    
    const printerList = devices.map((device, index) => ({
      id: index,
      vendorId: device.deviceDescriptor.idVendor,
      productId: device.deviceDescriptor.idProduct,
      manufacturer: device.deviceDescriptor.iManufacturer,
      product: device.deviceDescriptor.iProduct
    }));
    
    res.json({
      success: true,
      count: printerList.length,
      printers: printerList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Test printer endpoint
 */
app.post('/test', (req, res) => {
  const device = findPrinter();
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'No USB printer found. Please check connection.'
    });
  }
  
  const printer = new escpos.Printer(device);
  
  device.open((error) => {
    if (error) {
      console.error('❌ Failed to open printer:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to open printer: ${error.message}`
      });
    }
    
    try {
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(2, 2)
        .text('PIZZA STOP')
        .size(1, 1)
        .text('Test Print')
        .text('------------------')
        .text('Print server is working!')
        .text(new Date().toLocaleString())
        .text('------------------')
        .feed(2)
        .cut()
        .close();
      
      res.json({
        success: true,
        message: 'Test print sent to printer'
      });
    } catch (error) {
      console.error('❌ Print error:', error);
      res.status(500).json({
        success: false,
        message: `Print error: ${error.message}`
      });
    }
  });
});

/**
 * Print order endpoint
 */
app.post('/print', (req, res) => {
  const { ticketData } = req.body;
  
  if (!ticketData) {
    return res.status(400).json({
      success: false,
      message: 'Missing ticket data'
    });
  }
  
  const device = findPrinter();
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'No USB printer found. Please check connection.'
    });
  }
  
  const printer = new escpos.Printer(device);
  
  device.open((error) => {
    if (error) {
      console.error('❌ Failed to open printer:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to open printer: ${error.message}`
      });
    }
    
    try {
      // Print header
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(2, 2)
        .text('PIZZA STOP')
        .size(1, 1)
        .text('www.pizza-stop.bg')
        .text('тел: ' + ticketData.restaurantPhone)
        .feed(1)
        .text('='.repeat(48))
        .feed(1);
      
      // Order info
      printer
        .align('ct')
        .style('b')
        .text('ПОРЪЧКА #' + ticketData.orderId)
        .style('normal')
        .text('='.repeat(48))
        .align('lt')
        .text('Дата: ' + ticketData.date)
        .text('Час: ' + ticketData.time)
        .text('Тип: ' + ticketData.orderType)
        .text('-'.repeat(48));
      
      // Customer info
      printer
        .style('b')
        .text('КЛИЕНТ:')
        .style('normal')
        .text('Име: ' + ticketData.customerName)
        .text('Тел: ' + ticketData.customerPhone);
      
      if (ticketData.address) {
        printer.text('Адрес: ' + ticketData.address);
      }
      
      printer.text('='.repeat(48));
      
      // Items
      printer
        .style('b')
        .text('АРТИКУЛИ:')
        .style('normal')
        .text('-'.repeat(48));
      
      ticketData.items.forEach(item => {
        const itemLine = `${item.quantity}x ${item.name}`;
        const price = `${item.totalPrice.toFixed(2)} €`;
        const spaces = 48 - itemLine.length - price.length;
        
        printer.text(itemLine + ' '.repeat(spaces) + price);
        
        if (item.customizations && item.customizations.length > 0) {
          printer.text('  + ' + item.customizations.join(', '));
        }
        
        if (item.comment) {
          printer.text('  Забележка: ' + item.comment);
        }
      });
      
      printer.text('='.repeat(48));
      
      // Special instructions
      if (ticketData.specialInstructions) {
        printer
          .style('b')
          .text('СПЕЦИАЛНИ ИНСТРУКЦИИ:')
          .style('normal')
          .text(ticketData.specialInstructions)
          .feed(1);
      }
      
      // Totals
      printer
        .style('b')
        .text('Междинна сума:' + ' '.repeat(20) + ticketData.subtotal.toFixed(2) + ' €');
      
      if (ticketData.deliveryFee > 0) {
        printer.text('Доставка:' + ' '.repeat(26) + ticketData.deliveryFee.toFixed(2) + ' €');
      }
      
      printer
        .text('='.repeat(48))
        .size(1, 2)
        .text('ОБЩО:' + ' '.repeat(20) + ticketData.totalPrice.toFixed(2) + ' €')
        .size(1, 1)
        .style('normal')
        .text('='.repeat(48));
      
      // Payment info
      if (ticketData.paymentMethod) {
        printer.text('Плащане: ' + ticketData.paymentMethod);
      }
      
      if (ticketData.isPaid) {
        printer
          .align('ct')
          .style('b')
          .text('*** ПЛАТЕНА ***')
          .style('normal');
      }
      
      // Footer
      printer
        .feed(2)
        .align('ct')
        .text('Благодарим Ви!')
        .text('Приятен апетит!')
        .feed(3)
        .cut()
        .close();
            
      res.json({
        success: true,
        message: 'Order printed successfully',
        orderId: ticketData.orderId
      });
    } catch (error) {
      console.error('❌ Print error:', error);
      res.status(500).json({
        success: false,
        message: `Print error: ${error.message}`
      });
    }
  });
});

/**
 * Print raw bytes endpoint (for custom ESC/POS commands)
 */
app.post('/print-raw', (req, res) => {
  const { data } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid data array'
    });
  }
  
  const device = findPrinter();
  
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'No USB printer found'
    });
  }
  
  device.open((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to open printer: ${error.message}`
      });
    }
    
    try {
      const buffer = Buffer.from(data);
      device.write(buffer);
      device.close();
            
      res.json({
        success: true,
        message: 'Raw data sent to printer',
        bytesSent: data.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Print error: ${error.message}`
      });
    }
  });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

/**
 * Start server
 */
app.listen(PORT, () => { 
  // Check for printers on startup
  const device = findPrinter();
  if (!device) {
    console.error('⚠️  WARNING: No USB printers detected!');
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});


