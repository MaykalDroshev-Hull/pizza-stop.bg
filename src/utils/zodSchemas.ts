/**
 * Zod validation schemas for API endpoints
 * Ensures all input is properly validated
 */

import { z } from 'zod'

// Customer info schema
export const customerInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  // LocationText and address: Allow empty string for collection orders, but validate if provided
  LocationText: z.string().max(500).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  LocationCoordinates: z.union([
    z.string(),
    z.object({
      lat: z.number(),
      lng: z.number()
    })
  ]).optional().or(z.literal('')),
  coordinates: z.union([
    z.string(),
    z.object({
      lat: z.number(),
      lng: z.number()
    })
  ]).optional().or(z.literal('')),
  deliveryInstructions: z.string().max(500).optional().or(z.literal(''))
})

// Addon schema
export const addonSchema = z.object({
  AddonID: z.number().int().positive().optional(),
  addonId: z.number().int().positive().optional(),
  id: z.number().int().positive().optional(),
  Name: z.string().optional(),
  name: z.string().optional(),
  Price: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  AddonType: z.string().optional(),
  addonType: z.string().optional()
})

// Order item schema
export const orderItemSchema = z.object({
  id: z.union([z.number().int().positive(), z.string()]), // Allow string for unique cart item IDs
  name: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  size: z.string().max(50).optional(),
  quantity: z.number().int().positive().max(100),
  category: z.string().max(50).optional(),
  addons: z.array(addonSchema).optional(),
  comment: z.string().max(500).optional()
})

// Order time schema
export const orderTimeSchema = z.object({
  type: z.enum(['immediate', 'scheduled']),
  scheduledTime: z.string().datetime().optional()
})

// Order confirmation request schema
export const orderConfirmationSchema = z.object({
  customerInfo: customerInfoSchema,
  orderItems: z.array(orderItemSchema).min(1, 'Order must contain at least one item').max(50),
  orderTime: orderTimeSchema,
  orderType: z.string(),
  deliveryCost: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  isCollection: z.boolean().default(false),
  paymentMethodId: z.number().int().min(1).max(5),
  loginId: z.number().int().positive().nullable().optional()
})

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
})

// Register schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  LocationText: z.string().min(5).max(500).optional(),
  LocationCoordinates: z.string().optional()
})

// Update profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  LocationText: z.string().min(5).max(500).optional(),
  LocationCoordinates: z.string().optional(),
  addressInstructions: z.string().max(500).optional()
})

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6).max(100)
})

// Product schema
export const productSchema = z.object({
  ProductID: z.number().int().positive().optional(),
  Product: z.string().min(1).max(200),
  SmallPrice: z.number().nonnegative().optional(),
  MediumPrice: z.number().nonnegative().optional(),
  LargePrice: z.number().nonnegative().optional(),
  Category: z.string().max(50),
  IsDisabled: z.number().int().min(0).max(1).optional()
})

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(2000)
})

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address').max(255)
})

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100)
})

// Delivery coordinates validation
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
})

