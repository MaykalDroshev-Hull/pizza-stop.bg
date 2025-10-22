# Environment Variables Setup Instructions

## 📋 Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# ============================================
# EXISTING VARIABLES (Keep these)
# ============================================

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Email Configuration (Nodemailer)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-specific-password
EMAIL_FROM=Pizza Stop <noreply@pizza-stop.bg>
EMAIL_TO=orders@pizza-stop.bg

# ============================================
# NEW VARIABLES (Required for security features)
# ============================================

# Upstash Redis (for rate limiting and caching)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# CSRF Protection Secret (generate a random 32+ character string)
CSRF_SECRET=your-random-secret-key-minimum-32-characters-long

# ============================================
# OPTIONAL VARIABLES
# ============================================

# Application Environment
NODE_ENV=production

# Feature Flags (optional)
ENABLE_ONLINE_PAYMENTS=false
ENABLE_PROMO_CODES=false
```

---

## 🔧 Setup Instructions

### 1. Supabase (Existing - Already Configured)
✅ You should already have these configured.

If not:
1. Go to https://supabase.com
2. Create/select your project
3. Get URL and keys from Settings → API

---

### 2. Google Maps API (Existing - Already Configured)
✅ You should already have this configured.

If not:
1. Go to https://console.cloud.google.com
2. Enable Maps JavaScript API
3. Create API key
4. Restrict to your domain

---

### 3. Email Configuration (Existing - Already Configured)
✅ You should already have this configured.

If not (Gmail example):
1. Use your Gmail account
2. Enable 2FA
3. Generate App-Specific Password
4. Use app password in `EMAIL_PASSWORD`

---

### 4. ⭐ NEW: Upstash Redis (Required)

**What it's for:** Rate limiting to prevent abuse

**Setup Steps:**

1. **Sign up at Upstash**
   - Go to https://upstash.com
   - Sign up (free tier available)

2. **Create a Redis Database**
   - Click "Create Database"
   - Name: `pizza-stop-ratelimit`
   - Region: Choose closest to your users (Europe)
   - Type: Regional (free tier)

3. **Get Credentials**
   - After creation, click on your database
   - Scroll to "REST API" section
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`

4. **Add to .env.local**
   ```bash
   UPSTASH_REDIS_REST_URL=https://eu1-glowing-marlin-12345.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AYQgASQgN2E5OTExMjYt...
   ```

**Free Tier Limits:**
- 10,000 commands per day
- 256 MB storage
- More than enough for a small to medium restaurant

**Alternative (if not using rate limiting):**
If you can't set up Upstash right now, the rate limiting will gracefully degrade and log warnings but won't block requests. However, **this is NOT recommended for production**.

---

### 5. ⭐ NEW: CSRF Secret (Required)

**What it's for:** Protect against Cross-Site Request Forgery attacks

**Setup Steps:**

1. **Generate a Random Secret**
   
   **Option A - Using Node.js (Recommended):**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   **Option B - Using OpenSSL:**
   ```bash
   openssl rand -hex 32
   ```
   
   **Option C - Online Generator:**
   - Go to https://randomkeygen.com/
   - Copy a "CodeIgniter Encryption Key" or similar 32+ character key

2. **Add to .env.local**
   ```bash
   CSRF_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
   ```

**Requirements:**
- Minimum 32 characters
- Should be random and unguessable
- Keep it secret (never commit to git)
- Use different secret for dev/staging/prod

---

## 🔍 Verification

After setting up all environment variables:

### 1. Test Rate Limiting
```bash
# Start dev server
npm run dev

# Try logging in with wrong password 6 times
# Should get rate limited after 5 attempts
```

### 2. Test Environment Loading
```bash
# Create a test file: test-env.js
console.log('Redis URL:', process.env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Missing')
console.log('Redis Token:', process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Set' : '❌ Missing')
console.log('CSRF Secret:', process.env.CSRF_SECRET ? '✅ Set' : '❌ Missing')

# Run it
node test-env.js

# Expected output:
# Redis URL: ✅ Set
# Redis Token: ✅ Set
# CSRF Secret: ✅ Set
```

### 3. Production Build Test
```bash
npm run build
```
Should build without errors.

---

## 🚨 Security Best Practices

### DO:
- ✅ Use different secrets for dev/staging/production
- ✅ Keep `.env.local` in `.gitignore` (already done)
- ✅ Use strong, random secrets (32+ characters)
- ✅ Rotate secrets periodically (every 6 months)
- ✅ Store production secrets in your hosting platform (Vercel, etc.)

### DON'T:
- ❌ Never commit `.env.local` to git
- ❌ Never share secrets in screenshots or logs
- ❌ Never use simple/guessable secrets
- ❌ Never reuse secrets across different apps

---

## 🎯 Quick Setup Checklist

- [ ] Upstash account created
- [ ] Redis database created
- [ ] `UPSTASH_REDIS_REST_URL` added to `.env.local`
- [ ] `UPSTASH_REDIS_REST_TOKEN` added to `.env.local`
- [ ] CSRF secret generated (32+ chars)
- [ ] `CSRF_SECRET` added to `.env.local`
- [ ] Tested `npm run build` (no errors)
- [ ] Tested rate limiting (login attempts)
- [ ] All existing env vars still working

---

## 📝 Example .env.local File

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrst

# Email
EMAIL_USER=pizzastop@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=Pizza Stop <noreply@pizza-stop.bg>
EMAIL_TO=orders@pizza-stop.bg

# NEW - Upstash Redis
UPSTASH_REDIS_REST_URL=https://eu1-glowing-marlin-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYQgASQgN2E5OTExMjYtMGI3OC00YmE1LTk...

# NEW - CSRF Secret
CSRF_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Optional
NODE_ENV=production
```

---

## 🆘 Troubleshooting

### Rate Limiting Not Working
**Symptom:** Can make unlimited requests  
**Solution:**
1. Check Redis credentials are correct
2. Check console for warnings: "Rate limiting disabled"
3. Verify Redis database is active in Upstash dashboard

### Build Fails
**Symptom:** `npm run build` fails with env errors  
**Solution:**
1. Ensure `.env.local` exists in root directory
2. Check all required vars are set
3. No spaces around `=` in env file
4. Restart dev server

### CSRF Errors
**Symptom:** 403 errors on POST requests  
**Solution:**
1. Check `CSRF_SECRET` is set
2. Minimum 32 characters
3. No special characters that need escaping
4. Restart server after adding

---

## 📞 Need Help?

If you encounter issues:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed documentation
2. Review `SECURITY_IMPROVEMENTS.md` for security context
3. Check console logs for specific error messages
4. Verify all environment variables are set correctly

---

## ✅ Ready for Production

Once all environment variables are set up and verified:
1. ✅ Build succeeds (`npm run build`)
2. ✅ Rate limiting works (test login attempts)
3. ✅ Orders go through successfully
4. ✅ No console errors

**You're ready to deploy!** 🚀






