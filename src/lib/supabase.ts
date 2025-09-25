import { createClient } from '@supabase/supabase-js'

// Debug environment variables
console.log('Environment check:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'FOUND' : 'NOT FOUND',
  urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
  keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'FOUND' : 'MISSING',
    key: supabaseAnonKey ? 'FOUND' : 'MISSING'
  });
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Client-side Supabase client (for browser use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes - bypasses RLS)
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables for server operations')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Test database connection (client-side version)
export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Using placeholder URL:', supabaseUrl === 'https://placeholder.supabase.co');
    console.log('Using placeholder key:', supabaseAnonKey === 'placeholder_key');
    
    // Use API endpoint for testing from client-side
    const response = await fetch('/api/test-db');
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Database connection test failed:', result);
      return false;
    }
    
    console.log('Database connection test successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection test exception:', error);
    return false;
  }
}

// Kitchen board query functions
export async function getDeliveryOrders(): Promise<KitchenOrder[]> {
  const supabase = createServerClient();
  
  const { data: orders, error: ordersError } = await supabase
    .from('Order')
    .select(`
      OrderID,
      LoginID,
      OrderDT,
      ExpectedDT,
      ReadyTime,
      OrderLocation,
      OrderLocationCoordinates,
      OrderStatusID,
      RfPaymentMethodID,
      IsPaid
    `)
    .in('OrderStatusID', [ORDER_STATUS.WITH_DRIVER, ORDER_STATUS.IN_DELIVERY])
    .order('OrderDT', { ascending: false })
    .limit(50);

  if (ordersError) {
    console.error('Error fetching delivery orders:', ordersError);
    return [];
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  // Get customer details for each order
  const ordersWithCustomers = await Promise.all(
    orders.map(async (order) => {
      let customer: { Name: string; phone: string; email: string } | null = null;
      if (order.LoginID) {
        const { data: customerData } = await supabase
          .from('Login')
          .select('Name, phone, email')
          .eq('LoginID', order.LoginID)
          .single();
        customer = customerData || null;
      }

      // Get products for this order
      const { data: products, error: productsError } = await supabase
        .from('LkOrderProduct')
        .select(`
          LkOrderProductID,
          OrderID,
          ProductID,
          ProductName,
          ProductSize,
          Quantity,
          UnitPrice,
          TotalPrice,
          Addons,
          Comment
        `)
        .eq('OrderID', order.OrderID);

      if (productsError) {
        console.error('Error fetching products for order', order.OrderID, ':', productsError);
      }

      return {
        OrderID: order.OrderID,
        OrderDT: order.OrderDT,
        ExpectedDT: order.ExpectedDT,
        ReadyTime: order.ReadyTime,
        OrderLocation: order.OrderLocation,
        OrderLocationCoordinates: order.OrderLocationCoordinates,
        OrderStatusID: order.OrderStatusID,
        IsPaid: order.IsPaid,
        CustomerName: customer?.Name || 'Unknown',
        CustomerPhone: customer?.phone || '',
        CustomerEmail: customer?.email || '',
        CustomerLocation: order.OrderLocation,
        Products: (products as LkOrderProducts[]) || [],
        TotalOrderPrice: (products as LkOrderProducts[])?.reduce((sum, product) => sum + product.TotalPrice, 0) || 0,
        SpecialInstructions: '' // Add this field if needed
      };
    })
  );

  return ordersWithCustomers;
}

export async function getKitchenOrders(): Promise<KitchenOrder[]> {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        LoginID,
        OrderDT,
        ExpectedDT,
        ReadyTime,
        OrderLocation,
        OrderLocationCoordinates,
        OrderStatusID,
        RfPaymentMethodID,
        IsPaid
      `)
      .in('OrderStatusID', [ORDER_STATUS.ACCEPTED, ORDER_STATUS.IN_PREPARATION, ORDER_STATUS.READY])
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
      .select('LoginID, Name, phone, email, LocationText, addressInstructions')
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
        ExpectedDT: order.ExpectedDT,
        ReadyTime: order.ReadyTime,
        OrderLocation: order.OrderLocation,
        OrderLocationCoordinates: order.OrderLocationCoordinates,
        OrderStatusID: order.OrderStatusID,
        IsPaid: order.IsPaid,
        CustomerName: customer?.Name || 'Unknown',
        CustomerPhone: customer?.phone || '',
        CustomerEmail: customer?.email || '',
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

export async function updateOrderReadyTime(orderId: number, readyTime: Date): Promise<boolean> {
  try {
    console.log(`Attempting to update order ${orderId} ready time to ${readyTime.toISOString()}`);
    
    // Use API route to update order ready time (server-side with service role key)
    const response = await fetch('/api/kitchen-and-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        readyTime: readyTime.toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error updating order ready time:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Successfully updated order ready time via API:', result);
    return true;
  } catch (error) {
    console.error('Exception in updateOrderReadyTime:', error);
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
  ACCEPTED: 1,           // Приета - Accepted, appears on dashboard
  IN_PREPARATION: 2,     // В процес на приготвяне - In preparation
  READY: 3,              // Приготвена - Ready/Finished
  WITH_DRIVER: 4,        // При шофьора - With driver
  IN_DELIVERY: 5,        // В процес на доставка - In delivery
  DELIVERED: 6           // Доставена - Delivered
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
  ExpectedDT: string | null
  ReadyTime: string | null
  OrderLocation: string | null
  OrderLocationCoordinates: string | null
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
