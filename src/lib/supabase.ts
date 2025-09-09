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

// Test database connection
export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Using placeholder URL:', supabaseUrl === 'https://placeholder.supabase.co');
    console.log('Using placeholder key:', supabaseAnonKey === 'placeholder_key');
    
    const { data, error } = await supabase
      .from('Order')
      .select('OrderID')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test exception:', error);
    return false;
  }
}

// Kitchen board query functions
export async function getKitchenOrders(): Promise<KitchenOrder[]> {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        LoginID,
        OrderDT,
        OrderLocation,
        OrderLocationCoordinates,
        OrderStatusID,
        RfPaymentMethodID,
        IsPaid
      `)
      .in('OrderStatusID', [ORDER_STATUS.PAID, ORDER_STATUS.ACCEPTED, ORDER_STATUS.COOKING, ORDER_STATUS.READY])
      .order('OrderDT', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Get customer data for all orders
    const loginIds = [...new Set(orders.map(order => order.LoginID))];
    const { data: customers, error: customersError } = await supabase
      .from('Login')
      .select('LoginID, Name, phone, Email, LocationText, addressInstructions')
      .in('LoginID', loginIds);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return [];
    }

    // Get products for each order
    const orderIds = orders.map(order => order.OrderID);
    const { data: orderProducts, error: productsError } = await supabase
      .from('LkOrderProduct')
      .select('*')
      .in('OrderID', orderIds);

    if (productsError) {
      console.error('Error fetching order products:', productsError);
      return [];
    }

    // Combine the data
    const kitchenOrders: KitchenOrder[] = orders.map(order => {
      const customer = customers?.find(c => c.LoginID === order.LoginID);
      const products = orderProducts?.filter(p => p.OrderID === order.OrderID) || [];
      const totalPrice = products.reduce((sum, product) => sum + product.TotalPrice, 0);
      
      return {
        OrderID: order.OrderID,
        OrderDT: order.OrderDT,
        OrderLocation: order.OrderLocation,
        OrderStatusID: order.OrderStatusID,
        IsPaid: order.IsPaid,
        CustomerName: customer?.Name || 'Unknown',
        CustomerPhone: customer?.phone || '',
        CustomerEmail: customer?.Email || '',
        CustomerLocation: order.OrderLocation || customer?.LocationText || '',
        Products: products,
        TotalOrderPrice: totalPrice,
        SpecialInstructions: customer?.addressInstructions || null
      };
    });

    return kitchenOrders;
  } catch (error) {
    console.error('Error in getKitchenOrders:', error);
    return [];
  }
}

export async function updateOrderStatusInDB(orderId: number, statusId: number) {
  try {
    console.log(`Attempting to update order ${orderId} to status ${statusId}`);
    
    // Use API route to update order status (server-side with service role key)
    const response = await fetch('/api/kitchen-and-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        statusId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error updating order status:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Successfully updated order status via API:', result);
    return true;
  } catch (error) {
    console.error('Exception in updateOrderStatus:', error);
    console.error('Exception details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Order status mapping based on your RfOrderStatus table
export const ORDER_STATUS = {
  PAID: 1,        // Платена - New order, paid
  ACCEPTED: 2,    // Приета - Accepted, appears on dashboard
  COOKING: 3,     // Готвене - Cooking, in "работи се" field
  WITH_DRIVER: 4, // Със Шофьора - With driver
  DELIVERED: 5,   // Доставена - Delivered
  CANCELED: 6,    // Отказана - Canceled
  READY: 7,       // Приготвена - Ready/Finished
  ON_WAY: 8       // На път - On way to customer
} as const;

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

// Your database tables
export interface Login {
  LoginID: number
  email: string
  Password: string
  Name: string
  Email: string
  phone: string
  LocationText: string | null
  LocationCoordinates: string | null
  NumberOfOrders: number
  PreferedPaymentMethodID: number | null
  created_at: string
  updated_at: string
  reset_token: string | null
  reset_token_expiry: string | null
  addressInstructions: string | null
  isGuest: boolean
}

export interface Order {
  OrderID: number
  LoginID: number
  OrderDT: string
  OrderLocation: string | null
  OrderLocationCoordinates: string | null
  OrderStatusID: number
  RfPaymentMethodID: number | null
  IsPaid: boolean
}

export interface LkOrderProducts {
  LkOrderProductID: number
  OrderID: number
  ProductID: number
  ProductName: string
  ProductSize: string | null
  Quantity: number
  UnitPrice: number
  TotalPrice: number
  Addons: string | null
  Comment: string | null
}

// Combined order data for kitchen board
export interface KitchenOrder {
  OrderID: number
  OrderDT: string
  OrderLocation: string | null
  OrderStatusID: number
  IsPaid: boolean
  CustomerName: string
  CustomerPhone: string
  CustomerEmail: string
  CustomerLocation: string | null
  Products: LkOrderProducts[]
  TotalOrderPrice: number
  SpecialInstructions: string | null
}
