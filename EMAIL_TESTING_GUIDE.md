# 📧 Pizza Stop - Email Testing Guide

## Quick Start

### Method 1: Browser (Easiest) 🌐
1. Make sure your dev server is running: `npm run dev`
2. Visit: **http://localhost:3000/admin/test-emails**
3. Enter email address(es) in the input field
4. Enter recipient name (optional)
5. Click "Send All Test Emails" button
6. Check the results on the page

**✨ Multiple Emails:**
- Separate with commas: `email1@test.com, email2@test.com, email3@test.com`
- All recipients will receive all test emails

### Method 2: Terminal Commands 💻

#### Test All Emails (Default Email)
```bash
npm run test:emails
```
Uses default: `hm.websiteprovisioning@gmail.com`

#### Test with Custom Email
```bash
node test-all-emails.js "your-email@test.com" "Your Name"
```

#### Test with Multiple Emails
```bash
node test-all-emails.js "email1@test.com,email2@test.com" "Your Name"
```

#### Quick Test (Single Email)
```bash
npm run test:email:quick
```
Sends just the registration email (faster for quick tests)

---

## What Gets Sent

Every test sends **3 email types** per recipient:
- Registration/Welcome Email
- Order Confirmation Email
- Password Reset Email
- Order Ready Time Email

**Example:** 
- 1 recipient = 4 emails sent
- 3 recipients = 12 emails sent (4 per person)

---

## Dynamic Email Configuration

### Browser UI
Simply type the email(s) in the input field - no coding required!

### Terminal Script
Pass as command line arguments:
```bash
# Single email
node test-all-emails.js "test@example.com"

# Multiple emails
node test-all-emails.js "test1@example.com,test2@example.com"

# With custom name
node test-all-emails.js "test@example.com" "John Doe"
```

---

## Email Types Being Tested

### 1. Registration Email
- **Endpoint:** `/api/test-email`
- **Purpose:** Welcome message for new users
- **Triggers:** User registration

### 2. Order Confirmation Email
- **Endpoint:** `/api/test-emails`
- **Purpose:** Receipt and order details
- **Triggers:** Order placement
- **Includes:** Items, prices, delivery info

### 3. Password Reset Email
- **Endpoint:** `/api/test-emails`
- **Purpose:** Password reset link
- **Triggers:** User requests password reset

### 4. Order Ready Time Email
- **Endpoint:** `/api/send-ready-time-email`
- **Purpose:** Estimated preparation time
- **Triggers:** Kitchen confirms order
- **Includes:** Ready time in minutes

---

## Troubleshooting

### ❌ Connection Failed
**Problem:** Can't connect to localhost:3000
**Solution:** 
```bash
# Make sure dev server is running
npm run dev
```

### ❌ Email Not Received
**Problem:** Tests pass but no email arrives
**Possible Causes:**
1. Check spam/junk folder
2. Verify SMTP credentials in `.env.local`
3. Check email service provider limits

### ❌ 500 Server Error
**Problem:** API returns 500 error
**Solution:**
1. Check `.env.local` has all required variables:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
2. Check server logs in terminal

---

## File Structure

```
pizza-stop/
├── test-all-emails.js              # Complete test script
├── test-email-send.js              # Quick test script
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── test-emails/
│   │   │       └── page.tsx        # Browser UI
│   │   └── api/
│   │       └── admin/
│   │           └── test-all-emails/
│   │               └── route.ts     # API endpoint
│   └── ...
└── package.json                     # NPM scripts
```

---

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run test:emails` | Test all email types |
| `npm run test:email:quick` | Quick single email test |
| `npm run dev` | Start dev server (required) |

---

## Production Testing

⚠️ **Important:** These test scripts are for development only.

For production testing:
1. Use a staging environment
2. Test with real user flows
3. Monitor email delivery rates
4. Check spam score of emails

---

## Need Help?

- Check the console output for detailed error messages
- Verify `.env.local` configuration
- Make sure dev server is running
- Check email service provider dashboard for delivery logs

