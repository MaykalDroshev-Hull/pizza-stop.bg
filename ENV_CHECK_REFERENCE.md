# ⚠️ REQUIRED .env.local Configuration

Your `.env.local` file **MUST** have these three variables:

```env
EMAIL=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_USER=your-email@gmail.com
```

## ✅ Checklist:

- [ ] EMAIL is set to your Gmail address
- [ ] EMAIL_PASS is set to your Gmail App Password (16 characters)
- [ ] EMAIL_USER is set to your Gmail address (same as EMAIL)

## 🔧 How to Get Gmail App Password:

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (required!)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select app: **Mail**
5. Select device: **Other** (type "Pizza Stop")
6. Click **Generate**
7. Copy the 16-character password (remove spaces)
8. Paste it as `EMAIL_PASS` in `.env.local`

---

**AFTER** you add EMAIL_USER to `.env.local`:
1. Save the file
2. Restart dev server
3. Test at: http://localhost:3002/admin/test-emails

