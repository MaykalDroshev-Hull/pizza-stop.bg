# 🖨️ Pizza Stop - Printer Integration Quick Start

## Choose Your Setup Method

### ✅ Option 1: Network Printer (EASIEST - RECOMMENDED)

**For printers with Ethernet or WiFi**

**What you need:**
- Thermal printer with network port (Ethernet or WiFi)
- Printer and server on same network

**Setup Steps:**

1. **Connect printer to network:**
   - Plug Ethernet cable into printer OR configure WiFi
   - Print network config page (button on printer)
   - Note the IP address (e.g., `192.168.1.100`)

2. **Configure in your app:**
   
   Add to `.env.local`:
   ```env
   NEXT_PUBLIC_PRINTER_IP=192.168.1.100
   NEXT_PUBLIC_PRINTER_PORT=9100
   ```

3. **Test connection:**
   ```bash
   # Open browser
   http://your-site.com/kitchen
   
   # Click print button on any order
   # Should print directly to thermal printer!
   ```

**That's it!** ✅ No additional software needed.

---

### 🔌 Option 2: USB Printer with Print Server

**For USB-only printers**

**What you need:**
- Thermal printer with USB connection
- PC/Laptop connected to printer (must stay on)
- Node.js installed on that PC

**Setup Steps:**

1. **Copy print server to PC:**
   ```bash
   # Copy the "print-server" folder to: C:\pizza-stop\print-server
   ```

2. **Install on PC connected to printer:**
   ```bash
   cd C:\pizza-stop\print-server
   npm install
   ```

3. **Start print server:**
   ```bash
   npm start
   ```
   
   You should see:
   ```
   ✅ Server running on http://localhost:3001
   ✅ Found 1 USB printer(s)
   ```

4. **Test print:**
   ```bash
   # Open browser on same PC
   http://localhost:3001/test
   ```

5. **Configure auto-start (Windows):**
   
   Create `C:\pizza-stop\start-print-server.bat`:
   ```batch
   @echo off
   cd C:\pizza-stop\print-server
   node index.js
   ```
   
   Place in: `%AppData%\Microsoft\Windows\Start Menu\Programs\Startup`

**Done!** ✅ Your web app will now print to USB printer automatically.

---

## 🧪 Testing Your Printer

### Test Network Printer:

```bash
# Windows Command Prompt:
ping 192.168.1.100

# Test if port is open:
telnet 192.168.1.100 9100
# (type "hello" and press Enter - should print)
```

### Test USB Printer:

```bash
# Open browser:
http://localhost:3001/test

# Should print a test page!
```

---

## 🔧 Troubleshooting

### Network Printer Issues:

**"Cannot connect to printer"**
- ✅ Verify printer IP is correct (print config page from printer)
- ✅ Ping the IP address: `ping 192.168.1.100`
- ✅ Check both devices on same network
- ✅ Check firewall isn't blocking port 9100

**"Printer prints garbage"**
- ✅ Wrong printer model/protocol
- ✅ Try port 9101 or 9102 instead of 9100

### USB Printer Issues:

**"No printer found"**
- ✅ Check USB cable is connected
- ✅ Check printer is powered on
- ✅ Install printer drivers
- ✅ Try different USB port
- ✅ Restart print server

**"Print server won't start"**
- ✅ Port 3001 already in use (close other apps)
- ✅ Node.js not installed (download from nodejs.org)
- ✅ Missing dependencies (run `npm install` again)

---

## 📝 How It Works

### Network Printer Flow:
```
Web App → API → Network → Printer
  (browser)  (server)  (ethernet)  (prints!)
```

### USB Printer Flow:
```
Web App → Print Server → USB → Printer
  (browser)  (localhost:3001)  (usb)  (prints!)
```

---

## 🎯 Which Method Should I Use?

| Your Situation | Use This Method |
|----------------|-----------------|
| Printer has Ethernet port | ✅ **Network Printer** |
| Printer has WiFi | ✅ **Network Printer** |
| Printer only has USB | ✅ **USB Print Server** |
| Budget solution | ✅ **USB Print Server** |
| Don't want PC always on | ✅ **Network Printer** |
| Multiple locations | ✅ **Network Printer** |

---

## 🚀 Next Steps After Setup

1. **Test with real order** from kitchen page
2. **Verify print quality** (adjust printer settings if needed)
3. **Configure auto-start** (if using USB print server)
4. **Train staff** on how to use the system
5. **Monitor for issues** for first few days

---

## 💡 Pro Tips

1. **Network Printers:**
   - Set **static IP** on printer (prevent IP changes)
   - Use **Ethernet** instead of WiFi (more reliable)
   - Keep printer **near router** for strong signal

2. **USB Printers:**
   - Use **dedicated PC** (old laptop works great)
   - Keep PC **always on** and connected
   - Set **power settings** to never sleep
   - Use **UPS** (uninterruptible power supply) to prevent crashes

3. **Both Methods:**
   - Keep **backup paper rolls** nearby
   - **Clean print head** monthly (thermal printer maintenance)
   - Test prints **daily** to catch issues early
   - Have **backup** browser print option

---

## 📞 Need Help?

### Quick Diagnostics:

```bash
# Check if printer is online
ping YOUR_PRINTER_IP

# Check if print server is running
curl http://localhost:3001/health

# Test print
curl -X POST http://localhost:3001/test
```

### Common Error Solutions:

| Error | Solution |
|-------|----------|
| "ECONNREFUSED" | Printer is off or wrong IP/port |
| "ETIMEDOUT" | Network issue or firewall blocking |
| "No printer found" | USB not connected or drivers missing |
| "Port 3001 in use" | Another app using port, restart PC |

---

## 📚 Full Documentation

For detailed information, see:
- **`PRINTER_INTEGRATION_GUIDE.md`** - Complete technical guide
- **`print-server/README.md`** - USB print server details

---

## ✅ Success Checklist

Network Printer Setup:
- [ ] Printer connected to network
- [ ] IP address noted
- [ ] Added to `.env.local`
- [ ] Test print successful
- [ ] Web app prints correctly

USB Printer Setup:
- [ ] Node.js installed on PC
- [ ] Print server installed
- [ ] Print server running
- [ ] Test print successful
- [ ] Auto-start configured
- [ ] Web app prints correctly

---

**That's it! Your printer integration is complete! 🎉**

Your kitchen and printer pages will now automatically print to your thermal printer when you click the print button!


