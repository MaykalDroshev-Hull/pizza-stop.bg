# Authentication Migration Summary

## What Changed

Your Pizza Stop application has been updated to use **Supabase Authentication** instead of environment variables for login credentials.

## Quick Setup Guide

### 1. Create Users in Supabase Dashboard

Go to: **Supabase Dashboard → Authentication → Users → Add User**

Create these 4 users:

| Role | Email | Access Level |
|------|-------|--------------|
| Admin | `admin@pizzastop.bg` | Full access (admin, kitchen, printer, delivery) |
| Kitchen | `kitchen@pizzastop.bg` | Kitchen dashboard only |
| Printer | `printer@pizzastop.bg` | Printer interface only |
| Delivery | `delivery@pizzastop.bg` | Delivery dashboard only |

**Important:** Choose strong passwords (at least 16 characters) and mark each user as "confirmed".

### 2. Run SQL Commands

Open: **Supabase Dashboard → SQL Editor**

Copy and run all commands from: **`SUPABASE_SQL_COMMANDS.sql`**

This will add role metadata to each user account.

### 3. Verify Setup

Run this query in SQL Editor:

```sql
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'can_access' as can_access
FROM auth.users
WHERE email LIKE '%@pizzastop.bg'
ORDER BY email;
```

You should see all 4 users with their correct roles and access permissions.

### 4. Remove Old Environment Variables

Remove these from your `.env.local` file:

```
ADMIN_USERNAME
ADMIN_PASSWORD
KITCHEN_USERNAME
KITCHEN_PASSWORD
PRINTER_USERNAME
PRINTER_PASSWORD
DELIVERY_USERNAME
DELIVERY_PASSWORD
```

**Keep these (you need them):**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 5. Test Login

Test each role at their respective login pages:

- **Admin:** `/login-admin` → `admin@pizzastop.bg`
- **Kitchen:** `/admin-kitchen-login` → `kitchen@pizzastop.bg`
- **Printer:** `/printer` → `printer@pizzastop.bg`
- **Delivery:** `/admin-delivery-login` → `delivery@pizzastop.bg`

### 6. Verify Role Isolation

Try logging in with kitchen credentials at `/login-admin` - it should be **rejected** with an "Access denied" message. This confirms role-based access control is working.

## What's Protected Now

✅ Each account can only access its designated area  
✅ Credentials stored securely in Supabase  
✅ No hardcoded passwords in environment variables  
✅ Role-based access control enforced at API level  
✅ Admin can access all areas if needed  

## Files Changed

- `src/app/api/auth/admin-login/route.ts` - Updated to use Supabase Auth
- `src/app/login-admin/page.tsx` - Changed to email-based login
- `src/app/printer/page.tsx` - Changed to email-based login
- `src/components/AdminLogin.tsx` - Changed to email-based login

## Login Credentials Format

**OLD (environment variables):**
```
Username: admin
Password: secretpassword
```

**NEW (Supabase Auth):**
```
Email: admin@pizzastop.bg
Password: [your chosen password]
```

## Security Best Practices

1. **Strong Passwords:** Minimum 16 characters with mix of uppercase, lowercase, numbers, symbols
2. **Password Manager:** Store credentials securely
3. **Regular Rotation:** Change passwords every 90 days
4. **Monitor Access:** Check Supabase Auth logs regularly
5. **2FA (Optional):** Enable in Supabase for extra security

## Troubleshooting

**"Invalid email or password"**
- Verify user exists in Supabase Dashboard → Authentication → Users
- Check that user is confirmed (confirmed_at is not null)
- Verify password is correct

**"Access denied"**
- User is authenticated but doesn't have permission
- Check user's `can_access` array includes the role you're trying to access
- Run the metadata update SQL commands again

**Still using old login**
- Clear browser cache and cookies
- Verify old environment variables are removed
- Check that new code is deployed

## Quick Reference

| Page | Email | Role | Can Access |
|------|-------|------|------------|
| `/login-admin` | admin@pizzastop.bg | admin | All areas |
| `/admin-kitchen-login` | kitchen@pizzastop.bg | kitchen | Kitchen only |
| `/printer` | printer@pizzastop.bg | printer | Printer only |
| `/admin-delivery-login` | delivery@pizzastop.bg | delivery | Delivery only |

## Support

For detailed setup instructions, see: **`SUPABASE_AUTH_SETUP.md`**

For SQL commands only, see: **`SUPABASE_SQL_COMMANDS.sql`**


