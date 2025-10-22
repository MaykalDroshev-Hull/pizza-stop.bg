# 🚀 Secure Deployment Guide - Pizza Stop

## ⚠️ CRITICAL: Read This Before Deploying

Your application has been significantly hardened against security vulnerabilities, but requires proper configuration to function securely.

---

## 📋 Pre-Deployment Checklist

### ✅ MUST DO Before Going Live:

- [ ] **Set ALL environment variables** (see below)
- [ ] **Test price calculation** with real orders
- [ ] **Test admin authentication** with new credentials
- [ ] **Verify authorization checks** work on user endpoints
- [ ] **Monitor server logs** for security alerts
- [ ] **Remove or disable** test routes (`/api/test-*`)
- [ ] **Backup database** before deployment

---

## 🔐 Required Environment Variables

### Create `.env.local` (Development) and `.env.production` (Production)

```env
# ═══════════════════════════════════════════════════════
# SUPABASE CONFIGURATION (Existing)
# ═══════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ═══════════════════════════════════════════════════════
# EMAIL CONFIGURATION (Existing)
# ═══════════════════════════════════════════════════════
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_gmail_app_password

# ═══════════════════════════════════════════════════════
# NEW - AUTHENTICATION CREDENTIALS (CRITICAL!)
# ═══════════════════════════════════════════════════════

# Admin Panel (/login-admin → /admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD_32_CHARS_MIN

# Kitchen Dashboard (/admin-kitchen-login → /kitchen)
KITCHEN_USERNAME=kitchen
KITCHEN_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD_32_CHARS_MIN

# Delivery Dashboard (/admin-delivery-login → /delivery)
DELIVERY_USERNAME=delivery
DELIVERY_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD_32_CHARS_MIN

# Printer System (/printer)
PRINTER_USERNAME=printer
PRINTER_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD_32_CHARS_MIN

# Admin API Token (for protecting /api/admin/* endpoints)
ADMIN_API_TOKEN=GENERATE_RANDOM_TOKEN_HERE_32_CHARS_MIN

# Site URL
NEXT_PUBLIC_SITE_URL=https://pizza-stop.bg
```

---

## 🎲 Generating Secure Credentials

### Option 1: Using OpenSSL (Recommended)
```bash
# Generate secure password (32 characters)
openssl rand -base64 32

# Generate API token (64 characters)
openssl rand -base64 64

# Run this 5 times to get all passwords + token
```

### Option 2: Using Node.js
```javascript
// Run in Node console
require('crypto').randomBytes(32).toString('base64')
```

### Option 3: Using Password Manager
- Use 1Password, Bitwarden, or LastPass
- Generate 32+ character passwords
- Store securely

---

## 🔧 Configuration Steps

### Step 1: Create Environment File
```bash
# In your project root
touch .env.production
```

### Step 2: Add Variables
Copy the template above and fill in all values

### Step 3: Verify Variables Load
```bash
npm run build
# Check for any "missing environment variable" errors
```

### Step 4: Test Authentication
```bash
npm run dev

# Test each login:
# 1. Go to /login-admin → use ADMIN_USERNAME/ADMIN_PASSWORD
# 2. Go to /admin-kitchen-login → use KITCHEN_USERNAME/KITCHEN_PASSWORD
# 3. Go to /admin-delivery-login → use DELIVERY_USERNAME/DELIVERY_PASSWORD
# 4. Go to /printer → use PRINTER_USERNAME/PRINTER_PASSWORD
```

---

## 🧪 Testing Fixes

### Test A: Price Calculation
```javascript
// Place an order with:
// - 1 Pizza (15 лв)
// - 3 addons (2 лв each = 6 лв)
// - Delivery (5 лв)
// Expected total: 26 лв

// Check:
// 1. Email shows 26 лв ✓
// 2. Kitchen shows 26 лв ✓
// 3. Database Order.TotalAmount = 26 ✓
```

### Test B: Authorization
```javascript
// As logged-in user (ID=5):
// Try: fetch('/api/user/orders?userId=1', { headers: {'X-User-ID': '5'} })
// Expected: 401 Unauthorized ✓

// Try: fetch('/api/user/orders?userId=5', { headers: {'X-User-ID': '5'} })
// Expected: 200 OK with your orders ✓
```

### Test C: Admin Protection
```javascript
// Without auth:
// Try: fetch('/api/admin/products')
// Expected: 401 Unauthorized ✓

// With wrong token:
// Try: fetch('/api/admin/products', { headers: {'X-Admin-Auth': 'wrong'} })
// Expected: 401 Unauthorized ✓
```

---

## 📊 Security Monitoring

### What to Monitor After Deployment:

#### Server Logs to Watch:
```
🚨 PRICE MISMATCH DETECTED!
   → Potential price manipulation attempt
   → Action: Review customer email, check if legitimate
   
🚨 AUTHORIZATION VIOLATION ATTEMPT
   → Someone trying to access another user's data
   → Action: Check IP, consider blocking if repeated

⚠️ Price calculation warnings
   → Product not found or disabled
   → Action: Verify product availability
```

#### Daily Checks:
1. Review security logs for alerts
2. Check for price mismatches
3. Monitor failed authentication attempts
4. Verify order totals match across email/kitchen/database

#### Weekly Audits:
1. Review all orders for price anomalies
2. Check for patterns in failed auth attempts
3. Verify admin access logs
4. Compare revenue vs database totals

---

## 🚨 Incident Response

### If Price Mismatch Detected:
1. Check server logs for PRICE MISMATCH alert
2. Compare client total vs server total
3. Determine if legitimate (rounding) or attack
4. If attack:
   - Log customer email and IP
   - Flag order for review
   - Consider blocking user
   - Review other orders from same user

### If IDOR Attempt Detected:
1. Check authorization violation logs
2. Note requesting user ID and target user ID
3. Check IP address
4. If repeated:
   - Block IP at firewall level
   - Investigate if account compromised
   - Check for other suspicious activity

### If Admin API Abuse:
1. Review admin API access logs
2. Check if valid admin token used
3. If invalid token:
   - Attempted breach
   - Check IP and block
   - Rotate ADMIN_API_TOKEN immediately
4. If valid token:
   - Investigate which admin account
   - Review what actions were taken

---

## 🔄 Credential Rotation Schedule

### Rotate These Credentials:

**Monthly**:
- ADMIN_API_TOKEN

**Quarterly**:
- ADMIN_PASSWORD
- KITCHEN_PASSWORD
- DELIVERY_PASSWORD
- PRINTER_PASSWORD

**When Employee Leaves**:
- Immediately rotate ALL passwords
- Revoke all sessions
- Audit access logs

**After Security Incident**:
- Rotate EVERYTHING immediately
- Force all users to reset passwords
- Review all recent activity

---

## 🛠️ Client-Side Updates Needed

### Dashboard (src/app/dashboard/page.tsx)

Update all fetch calls to include authorization header:

```javascript
// BEFORE:
const response = await fetch(`/api/user/orders?userId=${user.id}`)

// AFTER:
import { fetchWithAuth } from '@/utils/fetchWithAuth'
const response = await fetchWithAuth(`/api/user/orders?userId=${user.id}`)
```

### Admin Panel

Update product service to include admin token:

```javascript
// In src/admin/services/productService.client.ts
const headers = {
  'Content-Type': 'application/json',
  'X-Admin-Auth': process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''
}

// Use in all admin API calls
```

---

## 📈 Measuring Success

### Week 1 After Deployment:
- Zero price manipulation attempts logged
- No unauthorized data access attempts
- Kitchen prices match email prices
- No customer complaints about wrong totals

### Month 1 After Deployment:
- Financial reports accurate
- No revenue discrepancies
- Addon revenue properly tracked
- Admin access logs clean

### Success Metrics:
- 🎯 Price accuracy: 100%
- 🎯 Authorization violations: 0
- 🎯 Revenue reconciliation: Perfect match
- 🎯 Security incidents: 0

---

## 🆘 Emergency Contacts

### If Security Incident Occurs:

**Immediate Actions**:
1. Take site offline (enable maintenance mode)
2. Review server logs for extent of breach
3. Rotate all credentials
4. Notify affected users if data exposed
5. File incident report

**Document Everything**:
- Timestamp of discovery
- Nature of incident
- Systems affected
- Data potentially compromised
- Actions taken
- Time to resolution

**GDPR Requirements** (If user data exposed):
- Notify users within 72 hours
- Report to Bulgarian Data Protection Commission
- Document breach and response

---

## 🎓 Security Best Practices Going Forward

### For Developers:
1. **Never trust client data** - Always validate on server
2. **Test security** - Try to break your own code
3. **Principle of least privilege** - Minimal access by default
4. **Defense in depth** - Multiple security layers
5. **Secure by default** - Opt-in to features, not opt-out

### For Operations:
1. **Monitor continuously** - Watch for security alerts
2. **Update regularly** - Keep dependencies current
3. **Backup frequently** - Daily database backups
4. **Rotate credentials** - Follow rotation schedule
5. **Audit periodically** - Monthly security reviews

### For Business:
1. **Security is not optional** - It's a business requirement
2. **Invest in monitoring** - Sentry, logging, alerts
3. **Have incident plan** - Know what to do when breach happens
4. **Legal compliance** - GDPR, data protection laws
5. **Insurance** - Consider cyber liability insurance

---

## 📚 Additional Resources

### Libraries to Consider:
- **next-auth**: Full authentication solution
- **iron-session**: Encrypted session cookies
- **@upstash/ratelimit**: Redis-based rate limiting
- **zod**: Type-safe input validation
- **DOMPurify**: HTML sanitization
- **helmet**: Additional security headers

### Documentation:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/advanced-features/security
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Final Verification

Before going live, verify:

- [ ] All environment variables set
- [ ] Can login to all dashboards (admin, kitchen, delivery, printer)
- [ ] Orders calculate correct prices
- [ ] Kitchen shows same price as email
- [ ] Cannot access other users' data
- [ ] Admin APIs return 401 without auth
- [ ] Security headers present in response
- [ ] Monitoring/logging working
- [ ] Backup system in place
- [ ] Incident response plan documented

---

**Last Updated**: Current Session
**Security Level**: 🟡 Moderate (Major fixes applied, needs session management)
**Production Ready**: ⚠️ Soft launch OK with monitoring, full launch needs httpOnly cookies








