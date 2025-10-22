# Supabase Authentication Setup Guide

This guide will help you set up role-based authentication for Pizza Stop using Supabase Authentication instead of environment variables.

## Overview

We're migrating from environment variable-based authentication to Supabase Auth with role-based access control. Each role (admin, kitchen, printer, delivery) will have separate accounts that can only access their designated functionality.

## Step 1: Create Users in Supabase Authentication

Go to your Supabase Dashboard → Authentication → Users → Add User (or use SQL)

### SQL Commands to Create Users

Run these commands in Supabase SQL Editor:

```sql
-- Note: You'll need to use the Supabase Dashboard to create these users
-- as Supabase Auth requires additional security measures for user creation.
-- Use the SQL commands below AFTER creating users via the dashboard to add metadata.

-- First, create the users in Supabase Dashboard with these details:

-- 1. ADMIN USER
-- Email: admin@pizzastop.bg
-- Password: [Choose a strong password - at least 12 characters]
-- Confirm email: Yes

-- 2. KITCHEN USER
-- Email: kitchen@pizzastop.bg
-- Password: [Choose a strong password - at least 12 characters]
-- Confirm email: Yes

-- 3. PRINTER USER
-- Email: printer@pizzastop.bg
-- Password: [Choose a strong password - at least 12 characters]
-- Confirm email: Yes

-- 4. DELIVERY USER
-- Email: delivery@pizzastop.bg
-- Password: [Choose a strong password - at least 12 characters]
-- Confirm email: Yes

-- After creating users in the Dashboard, run this SQL to add role metadata:
-- Replace {user_id} with the actual UUID from auth.users table

-- Update ADMIN user
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'full_name', 'Administrator',
    'can_access', json_build_array('admin', 'kitchen', 'printer', 'delivery')
)
WHERE email = 'admin@pizzastop.bg';

-- Update KITCHEN user
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'kitchen',
    'full_name', 'Kitchen Staff',
    'can_access', json_build_array('kitchen')
)
WHERE email = 'kitchen@pizzastop.bg';

-- Update PRINTER user
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'printer',
    'full_name', 'Printer Account',
    'can_access', json_build_array('printer')
)
WHERE email = 'printer@pizzastop.bg';

-- Update DELIVERY user
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'delivery',
    'full_name', 'Delivery Driver',
    'can_access', json_build_array('delivery')
)
WHERE email = 'delivery@pizzastop.bg';
```

## Step 2: Verify User Creation

Run this query to verify all users were created correctly:

```sql
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'can_access' as can_access,
    created_at,
    confirmed_at
FROM auth.users
WHERE email IN (
    'admin@pizzastop.bg',
    'kitchen@pizzastop.bg',
    'printer@pizzastop.bg',
    'delivery@pizzastop.bg'
)
ORDER BY email;
```

Expected output should show 4 users with their respective roles.

## Step 3: Update Environment Variables

Remove these old environment variables from your `.env.local` file:

```
# OLD - Remove these
ADMIN_USERNAME=
ADMIN_PASSWORD=
KITCHEN_USERNAME=
KITCHEN_PASSWORD=
PRINTER_USERNAME=
PRINTER_PASSWORD=
DELIVERY_USERNAME=
DELIVERY_PASSWORD=
```

Make sure you have these Supabase credentials (keep these):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Test the Authentication

After deploying the updated code:

1. **Test Admin Login:**
   - Go to: `https://your-domain.com/login-admin`
   - Email: `admin@pizzastop.bg`
   - Password: [the password you set]
   - Should redirect to: `/admin`

2. **Test Kitchen Login:**
   - Go to: `https://your-domain.com/admin-kitchen-login`
   - Email: `kitchen@pizzastop.bg`
   - Password: [the password you set]
   - Should redirect to: `/kitchen`

3. **Test Printer Login:**
   - Go to: `https://your-domain.com/printer`
   - Email: `printer@pizzastop.bg`
   - Password: [the password you set]
   - Should show printer interface

4. **Test Delivery Login:**
   - Go to: `https://your-domain.com/admin-delivery-login`
   - Email: `delivery@pizzastop.bg`
   - Password: [the password you set]
   - Should redirect to: `/delivery`

5. **Test Role Isolation:**
   - Try logging in with kitchen credentials to `/login-admin`
   - Should be rejected with "Access denied" message
   - This confirms role-based access control is working

## Step 5: Security Recommendations

1. **Strong Passwords:** Use passwords with at least 16 characters, including uppercase, lowercase, numbers, and symbols.

2. **Password Manager:** Store these credentials in a secure password manager.

3. **2FA (Optional):** Consider enabling 2FA in Supabase for additional security.

4. **Regular Password Rotation:** Change passwords every 90 days.

5. **Audit Logs:** Monitor Supabase Auth logs regularly for suspicious activity.

## Troubleshooting

### Issue: "User not found" error
**Solution:** Verify the user exists in Supabase Dashboard → Authentication → Users

### Issue: "Invalid role" error
**Solution:** Run the metadata update SQL commands to add role information

### Issue: "Access denied" error when logging in
**Solution:** Check that the user's `can_access` array includes the correct role

### Issue: Still using old environment variable authentication
**Solution:** 
1. Verify the new code is deployed
2. Clear browser cache and cookies
3. Check that old environment variables are removed

## Migration Checklist

- [ ] Create all 4 users in Supabase Dashboard
- [ ] Run SQL commands to add role metadata
- [ ] Verify users with the verification query
- [ ] Remove old environment variables
- [ ] Deploy updated authentication code
- [ ] Test each login type
- [ ] Test role isolation (cross-role login should fail)
- [ ] Update documentation with new credentials
- [ ] Store credentials securely in password manager
- [ ] Set up monitoring for authentication failures

## Database Commands Reference

### Create a new role-based user (via dashboard, then run):

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'ROLE_NAME',
    'full_name', 'Display Name',
    'can_access', json_build_array('role1', 'role2')
)
WHERE email = 'user@example.com';
```

### View all authenticated users:

```sql
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

### Disable a user:

```sql
UPDATE auth.users
SET banned_until = 'infinity'
WHERE email = 'user@example.com';
```

### Re-enable a user:

```sql
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'user@example.com';
```

### Change user role:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'new_role')
WHERE email = 'user@example.com';
```

## Support

If you encounter issues, check:
1. Supabase Dashboard → Logs → Authentication
2. Browser Console for JavaScript errors
3. Network tab for API request failures


