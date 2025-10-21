# Pizza Stop - Printer Integration Guide

## 🖨️ Overview

This guide covers multiple approaches to integrate thermal receipt printers with your Pizza Stop web application.

## 📋 Prerequisites

**Your Printer:** Citizen ST-S2010 (or similar thermal printer)
- **Width:** 78mm (approximately 48-80 characters per line)
- **Connectivity:** USB, RS-232C (Serial), or LAN (Network)
- **Protocol:** ESC/POS (standard for thermal printers)

## 🔌 Connection Methods

### Method 1: Network Printer (RECOMMENDED) ✅

**Best for:** Printers with Ethernet/WiFi capability

**Advantages:**
- No PC required to be constantly connected
- Multiple devices can send print jobs
- Most flexible and reliable
- Easy to set up

**Requirements:**
- Printer with network capability
- Static IP address for the printer
- Both printer and web server on same network (or accessible via internet)

### Method 2: USB Printer with Local Print Server

**Best for:** USB-only printers

**Advantages:**
- Works with cheaper USB-only printers
- Good control over print jobs
- Can handle complex formatting

**Requirements:**
- PC/Raspberry Pi connected to printer via USB
- Local print server running on that PC
- PC must be on whenever printing is needed

### Method 3: Cloud Print Service (QZ Tray / PrintNode)

**Best for:** Multiple locations or remote printing

**Advantages:**
- Print from anywhere
- No port forwarding needed
- Professional solution
- Built-in retry logic

**Requirements:**
- QZ Tray or PrintNode subscription
- Small client app running on printer PC

## 🚀 Implementation Options

---

## Option 1: Network Printer (Direct ESC/POS)

### Step 1: Configure Printer

1. Connect printer to network via Ethernet or configure WiFi
2. Print network configuration page (usually via printer button)
3. Note the IP address (e.g., `192.168.1.100`)
4. Set static IP in printer settings to prevent IP changes

### Step 2: Test Connectivity

Open Command Prompt/Terminal:

```bash
# Test if printer is accessible
ping 192.168.1.100

# Test if printer port is open (usually port 9100 for raw printing)
# Windows PowerShell:
Test-NetConnection -ComputerName 192.168.1.100 -Port 9100

# Linux/Mac:
nc -zv 192.168.1.100 9100
```

### Step 3: Install Dependencies

```bash
npm install escpos escpos-network
```

### Step 4: Implementation

See `src/utils/printerService.ts` (created below)

---

## Option 2: USB Printer with Local Print Server

### Step 1: Set Up Print Server

You need a Node.js service running on the PC connected to the printer.

**Create a new folder on the PC:** `pizza-print-server`

```bash
cd pizza-print-server
npm init -y
npm install express escpos escpos-usb cors body-parser
```

### Step 2: Create Print Server

See `print-server/index.js` (created below)

### Step 3: Run Print Server

On the PC connected to the printer:

```bash
cd pizza-print-server
node index.js
```

Server will run on `http://localhost:3001`

### Step 4: Configure Your PC

1. Install Node.js on the PC connected to printer
2. Set up print server to run on startup
3. Open firewall port 3001 if needed

**Windows Startup:**
- Create a `.bat` file: `start-print-server.bat`
```batch
@echo off
cd C:\pizza-print-server
node index.js
```
- Place in: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp`

---

## Option 3: QZ Tray (Professional Solution)

### Step 1: Download QZ Tray

1. Download from: https://qz.io/download/
2. Install on PC connected to printer
3. QZ Tray runs in system tray

### Step 2: Install NPM Package

```bash
npm install qz-tray
```

### Step 3: Generate Certificate

QZ Tray requires HTTPS and signed certificates for security.

```bash
# Generate certificate (one-time setup)
openssl req -x509 -newkey rsa:4096 -keyout qz-private-key.pem -out qz-certificate.pem -days 3650 -nodes
```

### Step 4: Implementation

See `src/utils/qzTrayService.ts` (created below)

---

## 🔒 Security Considerations

### Network Printer
- ✅ Use VPN if printer is on separate network
- ✅ Firewall rules to restrict access
- ✅ Consider authentication if printer supports it

### USB Print Server
- ✅ Restrict access to print server port (localhost only)
- ✅ Use API key authentication
- ✅ HTTPS if accessing from outside local network

### QZ Tray
- ✅ Digital certificate signing required
- ✅ User must approve certificate first time
- ✅ HTTPS required

---

## 📝 ESC/POS Commands Reference

Common commands for thermal printers:

```javascript
// Initialize printer
ESC @ = [0x1B, 0x40]

// Cut paper
ESC i = [0x1B, 0x69]

// Bold text ON
ESC E 1 = [0x1B, 0x45, 0x01]

// Bold text OFF
ESC E 0 = [0x1B, 0x45, 0x00]

// Large text (2x height, 2x width)
GS ! n = [0x1D, 0x21, 0x11]

// Normal text
GS ! 0 = [0x1D, 0x21, 0x00]

// Center alignment
ESC a 1 = [0x1B, 0x61, 0x01]

// Left alignment
ESC a 0 = [0x1B, 0x61, 0x00]

// Print and feed n lines
ESC d n = [0x1B, 0x64, n]

// Print QR code
GS ( k = [0x1D, 0x28, 0x6B, ...]
```

---

## 🧪 Testing

### Test Network Printer

```bash
# Send test print via telnet
telnet 192.168.1.100 9100

# Type this and press Enter:
Hello from network printer!

# Then type: Ctrl + ] and then "quit"
```

### Test USB Printer

```bash
# Windows (find printer port in Device Manager)
echo "Test print" > COM3

# Linux
echo "Test print" > /dev/usb/lp0
```

---

## 🐛 Troubleshooting

### Printer Not Found
- Check IP address is correct
- Verify printer is on same network
- Check firewall isn't blocking port 9100

### USB Printer Not Detected
- Check USB cable connection
- Verify printer drivers are installed
- Try different USB port
- Check Device Manager (Windows) or `lsusb` (Linux)

### Garbled Output
- Wrong encoding (should be UTF-8 or CP437)
- Wrong ESC/POS command syntax
- Printer in wrong mode

### Connection Timeout
- Printer might be in sleep mode (send wake command)
- Network issues (check with ping)
- Port 9100 might be closed

---

## 📦 Recommended Hardware

### Budget-Friendly
- **Epson TM-T20III** (~$200)
  - USB + Ethernet
  - 80mm or 58mm width
  - ESC/POS compatible
  
### Mid-Range
- **Star TSP143IIIU** (~$300)
  - USB only
  - Fast printing
  - Very reliable

### Professional
- **Citizen ST-S2010** (Your current model)
  - Multiple connectivity options
  - QR code support
  - High durability

---

## 🎯 Which Method Should You Use?

| Scenario | Recommended Method |
|----------|-------------------|
| Printer has network port | **Network Printer (Option 1)** |
| USB printer, budget solution | **USB Print Server (Option 2)** |
| Multiple locations | **QZ Tray (Option 3)** |
| Need professional support | **PrintNode (Cloud Service)** |
| Restaurant kitchen setup | **Network Printer or USB Print Server** |

---

## 🔗 Next Steps

1. **Identify your printer's connectivity** (USB, Network, Serial)
2. **Choose implementation method** based on connectivity
3. **Follow the specific setup guide** for that method
4. **Implement the code** provided in the respective service files
5. **Test with sample order** before going live

All code implementations are provided in the accompanying files:
- `src/utils/printerService.ts` - Network printer
- `print-server/index.js` - USB print server
- `src/utils/qzTrayService.ts` - QZ Tray integration
- `src/app/api/printer/print/route.ts` - API endpoint


