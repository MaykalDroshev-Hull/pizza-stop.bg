# 📧 Selective Email Testing Guide

## ✨ New Feature: Choose Which Emails to Send

You can now select exactly which email types to test, avoiding Gmail rate limits!

## 🎯 How to Use:

### **Step 1: Visit the Testing Page**
```
http://localhost:3002/admin/test-emails
```

### **Step 2: Enter Email & Name**
- Email: `your-email@gmail.com`
- Name: `Your Name`

### **Step 3: Select Email Types**

**Default:** Nothing is selected (prevents accidental sends)

**Options:**
- ☐ **Registration Email** - Welcome message
- ☐ **Order Confirmation & Password Reset** - Receipt + Reset link
- ☐ **Order Ready Time** - Preparation time notification

**Quick Actions:**
- `Select All` - Check all boxes
- `Clear All` - Uncheck all boxes

### **Step 4: Send!**
Click "Send All Test Emails" - only selected types will be sent.

---

## 💡 Best Practices to Avoid Rate Limiting:

### **Test One at a Time:**
```
✅ Select: Registration Email only
   Send → Wait 30 seconds
   
✅ Select: Order Confirmation only
   Send → Wait 30 seconds
   
✅ Select: Order Ready Time only
   Send → Done!
```

### **When Testing Multiple Recipients:**
```
✅ Select: Registration Email only
   Enter: email1@test.com, email2@test.com
   Send → Sends 1 email type to 2 people = 2 emails total
```

### **Avoid This:**
```
❌ Select: All 3 email types
   Enter: 5 email addresses
   Send → Sends 3 × 5 = 15 emails at once
   Result: Gmail rate limit! 🚫
```

---

## 📊 Email Count Calculator:

| Selected Types | Recipients | Total Emails |
|---------------|------------|--------------|
| 1 type | 1 person | 1 email ✅ |
| 1 type | 3 people | 3 emails ✅ |
| 3 types | 1 person | 3 emails ⚠️ |
| 3 types | 3 people | 9 emails ❌ |

**Rule of Thumb:** Keep total under 5 emails per test to avoid rate limits.

---

## 🎨 UI Features:

### **Visual Feedback:**
- ✅ Green checkmark when email sent successfully
- ❌ Red X when email failed
- Shows exactly which types succeeded/failed

### **Validation:**
- Can't send without selecting at least one type
- Can't send without entering an email
- Shows error if no selection made

### **Checkbox States:**
- **Unchecked** (default) - Won't send
- **Checked** - Will send
- Hover effect - Orange highlight

---

## 🚀 Example Workflow:

### **Testing All Email Types (Safe Method):**

```bash
1. Visit: http://localhost:3002/admin/test-emails
2. Enter email: your-email@gmail.com

Test 1:
  ☑ Registration Email
  ☐ Order Confirmation & Password Reset
  ☐ Order Ready Time
  → Click Send → Wait 30s ✅

Test 2:
  ☐ Registration Email
  ☑ Order Confirmation & Password Reset
  ☐ Order Ready Time
  → Click Send → Wait 30s ✅

Test 3:
  ☐ Registration Email
  ☐ Order Confirmation & Password Reset
  ☑ Order Ready Time
  → Click Send → Done! ✅
```

**Result:** All 3 emails received, no rate limiting! 🎉

---

## ⚡ Quick Test (Single Email):

```
1. Check: Registration Email
2. Enter: your-email@gmail.com
3. Send
4. Check inbox - 1 email arrives instantly!
```

---

## 🔍 Troubleshooting:

### **"No email types selected" Error**
- ✅ Check at least one checkbox before sending

### **Still Getting Rate Limited?**
- ⏰ Wait 15-20 minutes between large batches
- 📧 Use different email addresses
- 🎯 Send fewer emails per test (1-2 types max)

### **Checkboxes Not Working?**
- 🔄 Refresh the page
- ✅ Click directly on the checkbox or label

---

## 📝 Summary:

**Before:** Sent all 3 email types every time → 3+ emails → rate limit

**Now:** Choose exactly what to send → 1 email at a time → no rate limit! ✨

**Perfect for:**
- Testing specific email templates
- Debugging one email type
- Avoiding Gmail rate limits
- Multiple recipients (send 1 type to many people)

---

Happy Testing! 🍕✨

