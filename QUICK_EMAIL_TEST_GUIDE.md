# 📧 Quick Email Testing Reference

## 🌐 Browser Method (Recommended)

**URL:** `http://localhost:3000/admin/test-emails`

1. Enter email(s) in the input field
2. Enter recipient name
3. Click "Send All Test Emails"

**Multiple emails?** Separate with commas:
```
test1@gmail.com, test2@gmail.com, test3@gmail.com
```

---

## 💻 Terminal Methods

### Default Email (Quick)
```bash
npm run test:emails
```
Sends to: `hm.websiteprovisioning@gmail.com`

### Custom Single Email
```bash
node test-all-emails.js "your-email@test.com"
```

### Multiple Emails
```bash
node test-all-emails.js "email1@test.com,email2@test.com,email3@test.com"
```

### With Custom Name
```bash
node test-all-emails.js "your-email@test.com" "John Doe"
```

### Multiple Emails + Name
```bash
node test-all-emails.js "email1@test.com,email2@test.com" "Test User"
```

---

## 📋 What Gets Tested

Each recipient receives **4 emails**:
1. ✅ Registration/Welcome Email
2. ✅ Order Confirmation Email
3. ✅ Password Reset Email
4. ✅ Order Ready Time Email

---

## ⚡ Quick Examples

### Example 1: Test Your Own Email
```bash
node test-all-emails.js "myemail@gmail.com" "My Name"
```

### Example 2: Test Multiple Team Members
```bash
node test-all-emails.js "alice@test.com,bob@test.com,charlie@test.com" "Team Member"
```

### Example 3: Browser with Multiple Emails
1. Go to: `http://localhost:3000/admin/test-emails`
2. Enter: `dev1@company.com, dev2@company.com, qa@company.com`
3. Name: `QA Team`
4. Click "Send All Test Emails"

---

## ⚠️ Before Testing

Make sure dev server is running:
```bash
npm run dev
```

---

## 🆘 Troubleshooting

**"Connection failed"**
- Start dev server: `npm run dev`

**"No emails received"**
- Check spam folder
- Verify `.env.local` has correct SMTP settings

**"Invalid email address"**
- Check for typos
- Ensure proper comma separation
- No spaces in email addresses (spaces after commas are OK)

---

## 💡 Pro Tips

- **Browser UI** is easiest for ad-hoc testing
- **Terminal** is great for automated testing or scripts
- Test with your own email first before sending to others
- Multiple emails = emails sent to ALL recipients (use wisely!)

