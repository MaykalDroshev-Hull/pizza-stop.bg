# Supabase Setup for Pizza Stop

## 🔑 Environment Variables

Make sure you have these environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_EMAIL=your_gmail_address@gmail.com
NEXT_PUBLIC_EMAIL_PASS=your_gmail_app_password
```

## 🗄️ Database Schema

You'll need to create a `users` table in your Supabase database with the following structure:

```sql

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Addon (
  AddonID integer NOT NULL DEFAULT nextval('"ProductAddons_AddonID_seq"'::regclass),
  Name character varying NOT NULL,
  Price numeric NOT NULL DEFAULT 0,
  ProductTypeID integer NOT NULL,
  CONSTRAINT Addon_pkey PRIMARY KEY (AddonID),
  CONSTRAINT ProductAddons_ProductTypeID_fkey FOREIGN KEY (ProductTypeID) REFERENCES public.ProductType(ProductTypeID)
);
CREATE TABLE public.LkOrderProduct (
  LkOrderProductID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  OrderID bigint NOT NULL,
  ProductID bigint,
  CONSTRAINT LkOrderProduct_pkey PRIMARY KEY (LkOrderProductID),
  CONSTRAINT fk_lkorderproduct_product FOREIGN KEY (ProductID) REFERENCES public.Product(ProductID),
  CONSTRAINT fk_lkorderproduct_order FOREIGN KEY (OrderID) REFERENCES public.Order(OrderID)
);
CREATE TABLE public.LkProductTypeAddons (
  ProductTypeID integer NOT NULL,
  AddonID integer NOT NULL,
  CONSTRAINT LkProductTypeAddons_pkey PRIMARY KEY (ProductTypeID, AddonID),
  CONSTRAINT LkProductTypeAddons_ProductTypeID_fkey FOREIGN KEY (ProductTypeID) REFERENCES public.ProductType(ProductTypeID),
  CONSTRAINT LkProductTypeAddons_AddonID_fkey FOREIGN KEY (AddonID) REFERENCES public.Addon(AddonID)
);
CREATE TABLE public.Login (
  LoginID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  email text NOT NULL UNIQUE,
  Password text NOT NULL,
  Name text NOT NULL,
  Email text,
  phone text,
  LocationText text,
  LocationCoordinates text,
  NumberOfOrders integer NOT NULL DEFAULT 0,
  PreferedPaymentMethodID bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reset_token text,
  reset_token_expiry timestamp with time zone,
  CONSTRAINT Login_pkey PRIMARY KEY (LoginID),
  CONSTRAINT Login_PreferedPaymentMethodID_fkey FOREIGN KEY (PreferedPaymentMethodID) REFERENCES public.RfPaymentMethod(PaymentMethodID)
);
CREATE TABLE public.Order (
  OrderID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  LoginID bigint NOT NULL,
  OrderDT timestamp without time zone NOT NULL,
  OrderLocation text NOT NULL,
  OrderLocationCoordinates text NOT NULL,
  OrderStatusID smallint NOT NULL,
  RfPaymentMethodID smallint NOT NULL,
  IsPaid boolean NOT NULL DEFAULT false,
  CONSTRAINT Order_pkey PRIMARY KEY (OrderID),
  CONSTRAINT fk_order_login FOREIGN KEY (LoginID) REFERENCES public.Login(LoginID),
  CONSTRAINT fk_order_orderstatus FOREIGN KEY (OrderStatusID) REFERENCES public.RfOrderStatus(OrderStatusID)
);
CREATE TABLE public.Product (
  ProductID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  ProductTypeID bigint NOT NULL,
  Product text NOT NULL,
  Description text,
  ImageURL text,
  IsDisabled smallint NOT NULL DEFAULT '0'::smallint,
  SmallPrice double precision DEFAULT '0'::double precision,
  LargePrice double precision DEFAULT '0'::double precision,
  MediumPrice double precision,
  CONSTRAINT Product_pkey PRIMARY KEY (ProductID),
  CONSTRAINT Product_ProductTypeID_fkey FOREIGN KEY (ProductTypeID) REFERENCES public.ProductType(ProductTypeID),
  CONSTRAINT fk_product_producttype FOREIGN KEY (ProductTypeID) REFERENCES public.ProductType(ProductTypeID)
);
CREATE TABLE public.ProductType (
  ProductTypeID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  ProductType text NOT NULL,
  CONSTRAINT ProductType_pkey PRIMARY KEY (ProductTypeID)
);
CREATE TABLE public.RestaurantSettings (
  WorkingHours text,
  IsClosed smallint
);
CREATE TABLE public.RfOrderStatus (
  OrderStatusID smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  OrderStatus text NOT NULL UNIQUE,
  CONSTRAINT RfOrderStatus_pkey PRIMARY KEY (OrderStatusID)
);
CREATE TABLE public.RfPaymentMethod (
  PaymentMethodID bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  PaymentMethod text NOT NULL,
  CONSTRAINT RfPaymentMethod_pkey PRIMARY KEY (PaymentMethodID)
);
```

## 🔐 Password Security

- **Password field type**: Changed from `text` to `text` (bcrypt hashes are always text)
- **Encryption**: Using bcrypt with 12 salt rounds for secure password hashing
- **Storage**: Only encrypted passwords are stored in the database

## 📱 Features Implemented

### Registration
- ✅ Form validation (required fields, email format, password length)
- ✅ Duplicate email checking
- ✅ Password encryption with bcrypt
- ✅ Welcome email sent automatically
- ✅ Success/error messaging
- ✅ Loading states
- ✅ Form clearing after successful registration

### Login
- ✅ Email/password validation
- ✅ Secure password comparison
- ✅ User data retrieval
- ✅ Success/error messaging
- ✅ Loading states

### Security Features
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Service role authentication for API routes
- ✅ No password exposure in responses
- ✅ Autofill prevention

## 🚀 API Endpoints

### POST `/api/auth/register`
- Registers new users
- Validates input data
- Encrypts passwords
- Checks for duplicate emails
- Sends welcome email automatically

### POST `/api/auth/login`
- Authenticates existing users
- Verifies password hashes
- Returns user data (without password)

### POST `/api/test-email`
- Test endpoint for email functionality
- Sends welcome email to specified address

### POST `/api/auth/forgot-password`
- Handles password reset requests
- Generates secure reset tokens
- Sends password reset emails

### POST `/api/auth/reset-password`
- Resets user password with reset token
- Validates token expiration
- Updates password securely

## 🔧 Dependencies Added

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "bcryptjs": "^2.4.x",
  "@types/bcryptjs": "^2.4.x",
  "nodemailer": "^6.x.x",
  "@types/nodemailer": "^6.x.x"
}
```

## 📝 Notes

- The `password` field in Supabase should remain as `text` type (bcrypt hashes are always text)
- Service role key is used for admin operations (registration/login)
- Anon key is used for client-side operations
- All passwords are encrypted before storage
- Forms include loading states and proper error handling

## 🗄️ Database Schema Updates Needed

For password reset functionality, you'll need to add these fields to your `Login` table:

```sql
-- Add password reset fields to existing Login table
ALTER TABLE Login
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index on reset token for faster lookups
CREATE INDEX idx_login_reset_token ON Login(reset_token);
```

## 📧 Email Setup

### Gmail Configuration
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use App Password** in `NEXT_PUBLIC_EMAIL_PASS` (not your regular password)

### Email Features
- **Automatic welcome emails** sent on registration
- **Password reset emails** with secure tokens
- **Bulgarian language** with proper localization
- **Pizza Stop branding** with logo
- **Order button** linking to order page
- **Responsive design** for all email clients
- **Professional styling** with your brand colors

### User Experience
- **Integrated password reset** within the main user page
- **Smooth left-sliding animation** for password reset form
- **Seamless transitions** between login, registration, and password reset
- **Mobile-optimized** responsive design
