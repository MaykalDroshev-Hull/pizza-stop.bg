import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
