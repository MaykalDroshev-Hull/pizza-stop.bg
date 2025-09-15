# Environment Setup Required

## 🚨 CRITICAL: Missing Environment Variables

The 500 Internal Server Error you're experiencing is caused by missing Supabase environment variables.

## 🔧 Quick Fix

Create a file named `.env.local` in the `pizza-stop.bg` directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (for password reset and notifications)
NEXT_PUBLIC_EMAIL=your_gmail_address@gmail.com
NEXT_PUBLIC_EMAIL_PASS=your_gmail_app_password
```

## 📋 How to Get Supabase Credentials

1. **Go to your Supabase project dashboard**
2. **Navigate to Settings → API**
3. **Copy the following values:**
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## 🔄 After Creating .env.local

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the order functionality again**

## 🎯 What This Fixes

- ✅ Order confirmation API will work
- ✅ Database operations will succeed
- ✅ User registration/login will work
- ✅ Email notifications will work

## ⚠️ Security Note

- Never commit `.env.local` to version control
- Keep your service role key secure
- The `.env.local` file is already in `.gitignore`

