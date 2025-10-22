# 📧 Gmail Diagnostic Checklist

## 🔍 Check These Gmail Settings:

### **1. Gmail Inbox Check**
**Link:** https://mail.google.com

**Steps:**
1. Log into `hm.websiteprovisioning@gmail.com`
2. Check **Sent Mail** folder
3. Look for recent test emails

**What to Look For:**
- ✅ If emails are in Sent → They were sent successfully
- ❌ If no emails in Sent → Gmail is blocking them

---

### **2. Gmail Security Activity**
**Link:** https://myaccount.google.com/notifications

**What to Check:**
- Recent security alerts
- Suspicious activity warnings
- Sign-in attempts

**Red Flags:**
- "Suspicious sign-in prevented"
- "Less secure app blocked"
- "App password disabled"

---

### **3. App Passwords**
**Link:** https://myaccount.google.com/apppasswords

**Verify:**
- App password still exists
- Not revoked or expired
- Shows "Last used" date

**Action if Needed:**
1. Delete old app password
2. Generate new app password
3. Update `.env.local` with new password
4. Restart dev server

---

### **4. "Less Secure App Access"** (Legacy Gmail)
**Link:** https://myaccount.google.com/lesssecureapps

**Note:** This is deprecated. Use App Passwords instead.

**Status Should Be:**
- App Passwords: ✅ Enabled (recommended)
- Less Secure Apps: ❌ Disabled (deprecated)

---

### **5. Gmail Filters & Blocked Addresses**
**Link:** https://mail.google.com/mail/u/0/#settings/filters

**Check:**
- No filters blocking outgoing mail
- No blocked addresses

---

### **6. Gmail Storage**
**Link:** https://one.google.com/storage

**Verify:**
- Storage not full
- Gmail has space to send

**If Full:**
- Delete old emails
- Clear trash
- Free up space

---

### **7. Recent Security Events**
**Link:** https://myaccount.google.com/device-activity

**Check:**
- Recent logins from your dev server
- Any blocked connections
- Unrecognized devices

---

### **8. Gmail Rate Limit Status**

**How to Check:**
1. Try sending a regular email from Gmail web interface
2. If you can send → Rate limit is only for SMTP (API)
3. If you can't send → Account is temporarily locked

**If Locked:**
- Wait 30-60 minutes
- Gmail will auto-unlock
- Try again later

---

## 🛠️ **Common Issues & Fixes:**

### **Issue 1: App Password Revoked**
**Symptoms:** All emails fail immediately

**Fix:**
1. Go to https://myaccount.google.com/apppasswords
2. Generate new app password
3. Update `.env.local`:
   ```env
   EMAIL_PASS=new-app-password-here
   ```
4. Restart server

---

### **Issue 2: 2-Step Verification Disabled**
**Symptoms:** Can't create app passwords

**Fix:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Then create app password

---

### **Issue 3: Rate Limit (450 Error)**
**Symptoms:** 
```
Error: 450-4.2.1 The user you are trying to contact is receiving 
mail at a rate that prevents additional messages
```

**Fix:**
- Wait 30-60 minutes
- Use different recipient email
- Send fewer emails per test

---

### **Issue 4: Authentication Failed**
**Symptoms:** 
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Fix:**
1. Verify EMAIL and EMAIL_PASS in `.env.local`
2. Regenerate app password
3. Make sure no extra spaces in password

---

## ✅ **Quick Test:**

### **Send Test Email from Gmail Web:**
1. Go to https://mail.google.com
2. Log in as `hm.websiteprovisioning@gmail.com`
3. Compose new email
4. Send to yourself

**Result:**
- ✅ If it sends → Gmail account is working fine
- ❌ If it fails → Account has bigger issues

---

## 📊 **Diagnostic Summary:**

| Check | Link | Status |
|-------|------|--------|
| Sent Mail | https://mail.google.com | Check manually |
| Security Activity | https://myaccount.google.com/notifications | Check for alerts |
| App Passwords | https://myaccount.google.com/apppasswords | Verify active |
| Storage | https://one.google.com/storage | Must have space |
| Manual Send Test | Gmail Compose | Try sending |

---

## 🎯 **Most Likely Issues:**

1. **Rate Limiting** (temporary) → Wait 30-60 min
2. **App Password** revoked → Regenerate
3. **2-Step Verification** disabled → Re-enable
4. **SMTP blocked** → Check security settings

---

## 💡 **Pro Tip:**

If Gmail web interface can send emails but your app can't:
- The issue is with SMTP/App Password
- Not with the Gmail account itself
- Regenerate app password and try again

---

**Check these links and let me know what you find!** 🔍

