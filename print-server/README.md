# Pizza Stop - USB Print Server

This is a local print server that runs on the PC connected to your USB thermal printer. It receives print jobs from your Pizza Stop web application and prints them.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed on your PC
- USB thermal printer connected to your PC
- Printer drivers installed

### Installation

1. **Copy this folder** to the PC connected to the printer

2. **Install dependencies:**
```bash
cd print-server
npm install
```

3. **Configure the server:**
```bash
# Copy example config
copy .env.example .env

# Edit .env if needed (optional)
notepad .env
```

4. **Test printer connection:**
```bash
npm start
```

You should see:
```
✅ Server running on http://localhost:3001
✅ Found 1 USB printer(s):
   1. VendorID: 1234, ProductID: 5678
```

5. **Test print:**

Open browser and go to: `http://localhost:3001/health`

Or use curl:
```bash
curl http://localhost:3001/test -X POST
```

## 🔧 Configuration

### Finding Your Printer

If printer is not detected automatically:

```bash
node -e "const escpos = require('escpos'); escpos.USB = require('escpos-usb'); console.log(escpos.USB.findPrinter())"
```

This will show all USB devices. Find your printer's VendorID and ProductID, then add to `.env`:

```env
PRINTER_VENDOR_ID=0x04b8
PRINTER_PRODUCT_ID=0x0e03
```

### Common Printer IDs

| Brand | Model | Vendor ID | Product ID |
|-------|-------|-----------|------------|
| Epson | TM-T20II | 0x04b8 | 0x0e03 |
| Star | TSP143III | 0x0519 | 0x0003 |
| Citizen | CT-S310 | 0x1CBE | 0x0003 |

## 🖥️ Running on Startup (Windows)

### Method 1: Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: When computer starts
4. Action: Start a program
5. Program: `C:\Program Files\nodejs\node.exe`
6. Arguments: `index.js`
7. Start in: `C:\path\to\print-server\`

### Method 2: Startup Folder

1. Create `start-print-server.bat`:
```batch
@echo off
cd C:\pizza-stop\print-server
node index.js
```

2. Save to: `%AppData%\Microsoft\Windows\Start Menu\Programs\Startup`

### Method 3: Windows Service (Advanced)

```bash
npm install -g node-windows
npm link node-windows

# Then create service script
node create-service.js
```

## 🖥️ Running on Startup (Linux)

### Using systemd

1. Create service file: `/etc/systemd/system/pizza-print-server.service`

```ini
[Unit]
Description=Pizza Stop Print Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/print-server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Enable and start:
```bash
sudo systemctl enable pizza-print-server
sudo systemctl start pizza-print-server
sudo systemctl status pizza-print-server
```

## 🧪 Testing

### Test endpoints:

```bash
# Health check
curl http://localhost:3001/health

# List printers
curl http://localhost:3001/printers

# Test print
curl -X POST http://localhost:3001/test

# Print order (example)
curl -X POST http://localhost:3001/print \
  -H "Content-Type: application/json" \
  -d '{
    "ticketData": {
      "orderId": "123",
      "date": "2024-01-15",
      "time": "12:30",
      "customerName": "Test Customer",
      "customerPhone": "0888123456",
      "restaurantPhone": "0888123456",
      "items": [{
        "name": "Test Pizza",
        "quantity": 1,
        "totalPrice": 10.00
      }],
      "subtotal": 10.00,
      "deliveryFee": 3.00,
      "totalPrice": 13.00,
      "orderType": "Delivery"
    }
  }'
```

## 🔒 Security

### Local Network Only (Recommended)

By default, the server binds to `localhost` only. To accept connections from your web server:

1. Edit `index.js`, change:
```javascript
app.listen(PORT, () => {
```

To:
```javascript
app.listen(PORT, '0.0.0.0', () => {
```

2. Update firewall to allow port 3001

3. Add your web server's IP to CORS in `.env`:
```env
ALLOWED_ORIGINS=http://your-web-server-ip:3000
```

### Authentication (Optional)

Add API key authentication:

```javascript
// In index.js, add middleware:
const API_KEY = process.env.API_KEY || 'your-secret-key';

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

Then in your web app, add header:
```javascript
fetch('http://localhost:3001/print', {
  headers: {
    'X-API-Key': 'your-secret-key'
  }
})
```

## 🐛 Troubleshooting

### Printer not detected

**Windows:**
1. Check Device Manager → Ports (COM & LPT)
2. Verify driver is installed
3. Try different USB port
4. Restart print server

**Linux:**
1. Check permissions:
```bash
ls -l /dev/usb/lp*
sudo chmod 666 /dev/usb/lp0
```

2. Add user to lp group:
```bash
sudo usermod -a -G lp $USER
```

3. Install libusb:
```bash
sudo apt-get install libusb-1.0-0-dev
```

### Port already in use

```bash
# Windows - find and kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux
lsof -i :3001
kill <PID>
```

### Permission denied errors

**Linux:** USB devices require special permissions

```bash
# Create udev rule
sudo nano /etc/udev/rules.d/99-escpos.rules

# Add line (replace vendor and product IDs):
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0e03", MODE="0666"

# Reload rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## 📚 API Reference

### GET /health
Returns server status

**Response:**
```json
{
  "status": "ok",
  "message": "Print server is running",
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

### GET /printers
List all connected USB printers

**Response:**
```json
{
  "success": true,
  "count": 1,
  "printers": [{
    "id": 0,
    "vendorId": 1208,
    "productId": 3587
  }]
}
```

### POST /test
Print test page

**Response:**
```json
{
  "success": true,
  "message": "Test print sent to printer"
}
```

### POST /print
Print order ticket

**Request:**
```json
{
  "ticketData": {
    "orderId": "123",
    "date": "15/01/2024",
    "time": "12:30",
    "customerName": "John Doe",
    "customerPhone": "0888123456",
    "address": "Sofia, Bulgaria",
    "restaurantPhone": "0888123456",
    "orderType": "Delivery",
    "items": [{
      "name": "Margherita Pizza",
      "quantity": 2,
      "totalPrice": 20.00,
      "customizations": ["Extra cheese"],
      "comment": "Well done"
    }],
    "subtotal": 20.00,
    "deliveryFee": 3.00,
    "totalPrice": 23.00,
    "paymentMethod": "Cash",
    "isPaid": false,
    "specialInstructions": "Ring doorbell twice"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order printed successfully",
  "orderId": "123"
}
```

## 📞 Support

If you encounter issues:

1. Check logs in terminal where server is running
2. Test printer manually (print test page from printer)
3. Verify USB connection
4. Check printer is not in error state (paper jam, out of paper, etc.)
5. Restart print server
6. Restart printer

## 📄 License

MIT License - Free to use and modify


