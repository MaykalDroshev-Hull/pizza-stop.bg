import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for user data
export interface UserRegistrationData {
  name: string
  email: string
  phone: string
  password: string
}

export interface UserLoginData {
  email: string
  password: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  updated_at: string
}

// Interface for the actual Login table structure
export interface LoginTableUser {
  LoginID: number
  Name: string
  email: string
  phone: string
  Password: string
  created_at: string
  updated_at: string
  NumberOfOrders: number
  LocationText?: string
  LocationCoordinates?: string
  PreferedPaymentMethodID?: number
}
