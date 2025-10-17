-- ===============================================================
-- PIZZA STOP - SUPABASE AUTHENTICATION SETUP SQL COMMANDS
-- ===============================================================
-- Run these commands in your Supabase SQL Editor after creating users
-- in the Supabase Dashboard → Authentication → Users
-- ===============================================================

-- STEP 1: Create users in Supabase Dashboard first
-- Go to: Dashboard → Authentication → Users → Add User
--
-- Create 4 users with these emails (and your chosen passwords):
-- 1. admin@pizzastop.bg
-- 2. kitchen@pizzastop.bg
-- 3. printer@pizzastop.bg
-- 4. delivery@pizzastop.bg
--
-- Make sure to mark them as "confirmed" (email confirmed)

-- ===============================================================
-- STEP 2: Add role metadata to users
-- ===============================================================

-- Update ADMIN user (full access to all areas)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'full_name', 'Administrator',
    'can_access', json_build_array('admin', 'kitchen', 'printer', 'delivery')
)
WHERE email = 'admin@pizzastop.bg';

-- Update KITCHEN user (access only to kitchen)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'kitchen',
    'full_name', 'Kitchen Staff',
    'can_access', json_build_array('kitchen')
)
WHERE email = 'kitchen@pizzastop.bg';

-- Update PRINTER user (access only to printer)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'printer',
    'full_name', 'Printer Account',
    'can_access', json_build_array('printer')
)
WHERE email = 'printer@pizzastop.bg';

-- Update DELIVERY user (access only to delivery)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
    'role', 'delivery',
    'full_name', 'Delivery Driver',
    'can_access', json_build_array('delivery')
)
WHERE email = 'delivery@pizzastop.bg';

-- ===============================================================
-- STEP 3: Verify users were created correctly
-- ===============================================================

SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'can_access' as can_access,
    created_at,
    confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email IN (
    'admin@pizzastop.bg',
    'kitchen@pizzastop.bg',
    'printer@pizzastop.bg',
    'delivery@pizzastop.bg'
)
ORDER BY email;

-- ===============================================================
-- EXPECTED RESULT:
-- You should see 4 rows with:
-- - admin@pizzastop.bg with role='admin' and can_access=['admin','kitchen','printer','delivery']
-- - kitchen@pizzastop.bg with role='kitchen' and can_access=['kitchen']
-- - printer@pizzastop.bg with role='printer' and can_access=['printer']
-- - delivery@pizzastop.bg with role='delivery' and can_access=['delivery']
-- ===============================================================

-- ===============================================================
-- OPTIONAL: Additional management commands
-- ===============================================================

-- View all authenticated users
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at,
    last_sign_in_at,
    confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Disable a user (ban)
-- UPDATE auth.users
-- SET banned_until = 'infinity'
-- WHERE email = 'user@example.com';

-- Re-enable a user (unban)
-- UPDATE auth.users
-- SET banned_until = NULL
-- WHERE email = 'user@example.com';

-- Change user role
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'new_role')
-- WHERE email = 'user@example.com';

-- ===============================================================
-- NOTES:
-- 1. Passwords are set when creating users in the Dashboard
-- 2. Use strong passwords (at least 16 characters recommended)
-- 3. Store credentials securely in a password manager
-- 4. The 'can_access' array determines which pages a user can access
-- 5. Admin can access all areas, other roles are restricted
-- ===============================================================


