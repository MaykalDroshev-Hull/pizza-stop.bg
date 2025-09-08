import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

// Client-side Supabase client (for browser use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes - bypasses RLS)
export function createServerClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for server operations')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types based on your structure
export interface ProductType {
  ProductTypeID: number
  ProductType: string
}

export interface Product {
  ProductID: number
  ProductTypeID: number
  Product: string
  Description: string | null
  ImageURL: string | null
  IsDisabled: number
  SmallPrice: number
  MediumPrice: number | null
  LargePrice: number | null
}
