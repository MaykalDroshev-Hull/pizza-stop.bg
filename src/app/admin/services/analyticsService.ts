import { supabase } from '@/lib/supabase';

/**
 * Test Endpoints for Verification:
 *
 * Status options:
 * GET /rest/v1/RfOrderStatus?select=OrderStatusID,OrderStatus&order=OrderStatus.asc
 *
 * Payment methods:
 * GET /rest/v1/RfPaymentMethod?select=PaymentMethodID,PaymentMethod&order=PaymentMethod.asc
 *
 * Product types:
 * GET /rest/v1/ProductType?select=ProductTypeID,ProductType&order=ProductType.asc
 *
 * Most ordered products (via view):
 * GET /rest/v1/v_order_lines?select=ProductName,sum_quantity:sum(Quantity)&group=ProductName&order=sum_quantity.desc&limit=10
 *
 * Payment breakdown:
 * GET /rest/v1/v_order_lines?select=PaymentMethod,sum_quantity:sum(Quantity),sum_revenue:sum(TotalPrice)&group=PaymentMethod&order=sum_revenue.desc
 *
 * Orders with filters:
 * GET /rest/v1/Order?select=OrderID,OrderDT,OrderStatusID,RfPaymentMethodID&OrderDT=gte.2025-01-01T00:00:00Z&OrderDT=lt.2025-01-08T00:00:00Z&OrderStatusID=eq.1
 */

export interface ProductAnalytics {
  productId: number;
  productName: string;
  productType: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface PaymentMethodBreakdown {
  paymentMethodId: number;
  paymentMethod: string;
  products: {
    productId: number;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
  totalQuantity: number;
  totalRevenue: number;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averageRating: number;
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  orderStatus: number;
  paymentMethod: number | null;
  productCategory: number | null;
}

/**
 * Get dashboard KPI metrics
 */
export async function getDashboardMetrics(filters: FilterState): Promise<DashboardMetrics> {
  try {
    const client = supabase;

    // Build date filter
    let dateFilter = '';
    if (filters.dateRange.start && filters.dateRange.end) {
      dateFilter = `and OrderDT >= '${filters.dateRange.start}' and OrderDT <= '${filters.dateRange.end}'`;
    }

    // Build status filter
    const statusFilter = filters.orderStatus ? `and "OrderStatusID" = ${filters.orderStatus}` : '';

    // Build payment method filter
    const paymentFilter = filters.paymentMethod ? `and "RfPaymentMethodID" = ${filters.paymentMethod}` : '';

    // Build filters for orders query
    let ordersQuery = client
      .from('Order')
      .select('OrderID, OrderDT, OrderStatusID, RfPaymentMethodID');

    if (filters.dateRange.start && filters.dateRange.end) {
      ordersQuery = ordersQuery
        .gte('OrderDT', filters.dateRange.start)
        .lte('OrderDT', filters.dateRange.end);
    }

    if (filters.orderStatus) {
      ordersQuery = ordersQuery.eq('OrderStatusID', filters.orderStatus);
    }

    if (filters.paymentMethod) {
      ordersQuery = ordersQuery.eq('RfPaymentMethodID', filters.paymentMethod);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, averageRating: 0 };
    }

    const totalOrders = ordersData?.length || 0;

    // Get order IDs for revenue calculation
    const orderIds = ordersData?.map(order => order.OrderID) || [];

    // Query for total revenue from LkOrderProduct
    let revenueQuery = client
      .from('LkOrderProduct')
      .select('TotalPrice');

    if (orderIds.length > 0) {
      revenueQuery = revenueQuery.in('OrderID', orderIds);
    } else {
      // If no orders match filters, return 0
      return { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, averageRating: 4.8 };
    }

    const { data: revenueData, error: revenueError } = await revenueQuery;

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
    }

    // Calculate total revenue
    const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.TotalPrice || 0), 0) || 0;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // For now, return mock rating - in real implementation, you'd have a ratings table
    const averageRating = 4.8;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      averageRating
    };
  } catch (error) {
    console.error('Error in getDashboardMetrics:', error);
    return { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, averageRating: 0 };
  }
}

/**
 * Get most ordered products
 */
export async function getMostOrderedProducts(
  filters: FilterState,
  limit: number = 10
): Promise<ProductAnalytics[]> {
  try {
    const client = supabase;

    // Build filters
    let dateFilter = '';
    if (filters.dateRange.start && filters.dateRange.end) {
      dateFilter = `AND o."OrderDT" >= '${filters.dateRange.start}' AND o."OrderDT" <= '${filters.dateRange.end}'`;
    }

    const statusFilter = filters.orderStatus ? `AND o."OrderStatusID" = ${filters.orderStatus}` : '';
    const paymentFilter = filters.paymentMethod ? `AND o."RfPaymentMethodID" = ${filters.paymentMethod}` : '';
    const categoryFilter = filters.productCategory ? `AND p."ProductTypeID" = ${filters.productCategory}` : '';

    // Build filters for the query
    let ordersQuery = client
      .from('Order')
      .select(`
        "OrderID",
        "OrderDT",
        "OrderStatusID",
        "RfPaymentMethodID"
      `);

    if (filters.dateRange.start && filters.dateRange.end) {
      ordersQuery = ordersQuery
        .gte('OrderDT', filters.dateRange.start)
        .lte('OrderDT', filters.dateRange.end);
    }

    if (filters.orderStatus) {
      ordersQuery = ordersQuery.eq('OrderStatusID', filters.orderStatus);
    }

    if (filters.paymentMethod) {
      ordersQuery = ordersQuery.eq('RfPaymentMethodID', filters.paymentMethod);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders for products:', ordersError);
      return [];
    }

    const orderIds = ordersData?.map(order => order.OrderID) || [];

    if (orderIds.length === 0) {
      return [];
    }

    // Get products data with relationships
    const { data, error } = await client
      .from('LkOrderProduct')
      .select(`
        "ProductID",
        "ProductName",
        "Quantity",
        "TotalPrice",
        "Product" (
          "ProductTypeID",
          "ProductType" (
            "ProductType"
          )
        )
      `)
      .in('OrderID', orderIds)
      .eq('ProductID', null) // Only get actual products, not composite products
      .not('ProductID', 'is', null);

    if (error) {
      console.error('Error fetching most ordered products:', error);
      return [];
    }

    // Process the data to aggregate by product
    const productMap = new Map<number, ProductAnalytics>();

    data?.forEach((item: any) => {
      const productId = item.ProductID;
      const productName = item.ProductName;
      const productType = item.Product?.ProductType?.ProductType || 'Неизвестен';
      const quantity = item.Quantity || 0;
      const revenue = item.TotalPrice || 0;

      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!;
        existing.totalQuantity += quantity;
        existing.totalRevenue += revenue;
        existing.orderCount += 1;
      } else {
        productMap.set(productId, {
          productId,
          productName,
          productType,
          totalQuantity: quantity,
          totalRevenue: revenue,
          orderCount: 1
        });
      }
    });

    // Convert to array and sort by quantity (descending)
    const products = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return products;
  } catch (error) {
    console.error('Error in getMostOrderedProducts:', error);
    return [];
  }
}

/**
 * Get least ordered products (including zero-sales)
 */
export async function getLeastOrderedProducts(
  filters: FilterState,
  limit: number = 10
): Promise<ProductAnalytics[]> {
  try {
    const client = supabase;

    // Get all active products from the Product table
    const { data: allProducts, error: productsError } = await client
      .from('Product')
      .select(`
        ProductID,
        Product,
        ProductTypeID,
        ProductType (
          ProductType
        )
      `)
      .eq('isDeleted', false);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return [];
    }

    if (!allProducts || allProducts.length === 0) {
      return [];
    }

    // Get order data for the filtered period
    const mostOrdered = await getMostOrderedProducts(filters, 1000);

    // Create a map of products that have orders
    const orderedProductsMap = new Map(mostOrdered.map(p => [p.productId, p]));

    // Get products with low or zero sales
    const leastOrdered = allProducts
      .map((product: any) => {
        const orderedProduct = orderedProductsMap.get(product.ProductID);
        return {
          productId: product.ProductID,
          productName: product.Product,
          productType: product.ProductType?.ProductType || 'Неизвестен',
          totalQuantity: orderedProduct?.totalQuantity || 0,
          totalRevenue: orderedProduct?.totalRevenue || 0,
          orderCount: orderedProduct?.orderCount || 0
        };
      })
      // Sort by quantity ascending (least ordered first)
      .sort((a, b) => a.totalQuantity - b.totalQuantity)
      .slice(0, limit);

    return leastOrdered;
  } catch (error) {
    console.error('Error in getLeastOrderedProducts:', error);
    return [];
  }
}

/**
 * Get payment method breakdown
 */
export async function getPaymentMethodBreakdown(
  filters: FilterState
): Promise<PaymentMethodBreakdown[]> {
  try {
    const client = supabase;

    // Build filters
    let dateFilter = '';
    if (filters.dateRange.start && filters.dateRange.end) {
      dateFilter = `AND o."OrderDT" >= '${filters.dateRange.start}' AND o."OrderDT" <= '${filters.dateRange.end}'`;
    }

    const statusFilter = filters.orderStatus ? `AND o."OrderStatusID" = ${filters.orderStatus}` : '';

    // Build filters for orders
    let ordersQuery = client
      .from('Order')
      .select(`
        "OrderID",
        "OrderDT",
        "OrderStatusID",
        "RfPaymentMethodID"
      `);

    if (filters.dateRange.start && filters.dateRange.end) {
      ordersQuery = ordersQuery
        .gte('OrderDT', filters.dateRange.start)
        .lte('OrderDT', filters.dateRange.end);
    }

    if (filters.orderStatus) {
      ordersQuery = ordersQuery.eq('OrderStatusID', filters.orderStatus);
    }

    if (filters.paymentMethod) {
      ordersQuery = ordersQuery.eq('RfPaymentMethodID', filters.paymentMethod);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders for payment breakdown:', ordersError);
      return [];
    }

    const orderIds = ordersData?.map(order => order.OrderID) || [];

    if (orderIds.length === 0) {
      return [];
    }

    // Get products data for these orders
    const { data, error } = await client
      .from('LkOrderProduct')
      .select(`
        "ProductID",
        "ProductName",
        "Quantity",
        "TotalPrice",
        "OrderID"
      `)
      .in('OrderID', orderIds)
      .not('ProductID', 'is', null);

    if (error) {
      console.error('Error fetching payment method breakdown:', error);
      return [];
    }

    // Group by payment method
    const paymentMap = new Map<number, PaymentMethodBreakdown>();

    // Get payment method names for all payment method IDs
    const paymentMethodIds = [...new Set(ordersData?.map(order => order.RfPaymentMethodID).filter(Boolean) || [])];
    const { data: paymentMethods, error: paymentError } = await client
      .from('RfPaymentMethod')
      .select('PaymentMethodID, PaymentMethod')
      .in('PaymentMethodID', paymentMethodIds);

    if (paymentError) {
      console.error('Error fetching payment methods:', paymentError);
    }

    const paymentMethodMap = new Map((paymentMethods || []).map(pm => [pm.PaymentMethodID, pm.PaymentMethod]));

    // First, create a map of order payment methods for quick lookup
    const orderPaymentMap = new Map(ordersData?.map(order => [order.OrderID, {
      paymentMethodId: order.RfPaymentMethodID,
      paymentMethod: paymentMethodMap.get(order.RfPaymentMethodID) || 'Неизвестен'
    }]) || []);

    data?.forEach((item: any) => {
      const orderPayment = orderPaymentMap.get(item.OrderID);
      if (!orderPayment) return;

      const paymentMethodId = orderPayment.paymentMethodId;
      const paymentMethod = orderPayment.paymentMethod;
      const productId = item.ProductID;
      const productName = item.ProductName;
      const quantity = item.Quantity || 0;
      const revenue = item.TotalPrice || 0;

      if (!paymentMap.has(paymentMethodId)) {
        paymentMap.set(paymentMethodId, {
          paymentMethodId,
          paymentMethod,
          products: [],
          totalQuantity: 0,
          totalRevenue: 0
        });
      }

      const paymentMethodData = paymentMap.get(paymentMethodId)!;
      paymentMethodData.totalQuantity += quantity;
      paymentMethodData.totalRevenue += revenue;

      // Add product to the list if not already present
      const existingProduct = paymentMethodData.products.find(p => p.productId === productId);
      if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.revenue += revenue;
      } else {
        paymentMethodData.products.push({
          productId,
          productName,
          quantity,
          revenue
        });
      }
    });

    // Convert to array and sort by total revenue
    const paymentBreakdowns = Array.from(paymentMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return paymentBreakdowns;
  } catch (error) {
    console.error('Error in getPaymentMethodBreakdown:', error);
    return [];
  }
}

/**
 * Get chart data for sales over time
 */
export async function getSalesChartData(
  filters: FilterState,
  period: 'day' | 'week' | 'month' = 'day'
): Promise<Array<{ date: string; orders: number; revenue: number }>> {
  try {
    const client = supabase;

    // Build filters
    let dateFilter = '';
    if (filters.dateRange.start && filters.dateRange.end) {
      dateFilter = `AND "OrderDT" >= '${filters.dateRange.start}' AND "OrderDT" <= '${filters.dateRange.end}'`;
    }

    const statusFilter = filters.orderStatus ? `AND "OrderStatusID" = ${filters.orderStatus}` : '';
    const paymentFilter = filters.paymentMethod ? `AND "RfPaymentMethodID" = ${filters.paymentMethod}` : '';

    const { data, error } = await client
      .from('Order')
      .select(`
        "OrderDT",
        "OrderID",
        "LkOrderProduct" (
          "TotalPrice"
        )
      `)
      .not('OrderID', 'is', null);

    if (error) {
      console.error('Error fetching chart data:', error);
      return [];
    }

    // Group by date
    const dateMap = new Map<string, { orders: number; revenue: number }>();

    data?.forEach((order: any) => {
      const orderDate = new Date(order.OrderDT).toISOString().split('T')[0];
      const revenue = order.LkOrderProduct?.reduce((sum: number, product: any) =>
        sum + (product.TotalPrice || 0), 0) || 0;

      if (dateMap.has(orderDate)) {
        const existing = dateMap.get(orderDate)!;
        existing.orders += 1;
        existing.revenue += revenue;
      } else {
        dateMap.set(orderDate, {
          orders: 1,
          revenue
        });
      }
    });

    // Convert to array and sort by date
    const chartData = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  } catch (error) {
    console.error('Error in getSalesChartData:', error);
    return [];
  }
}

/**
 * Get filter options from database
 */
export async function getFilterOptions() {
  try {
    const client = supabase;

    // Get order statuses
    const { data: orderStatuses, error: statusError } = await client
      .from('RfOrderStatus')
      .select('*')
      .order('OrderStatusID');

    // Get payment methods
    const { data: paymentMethods, error: paymentError } = await client
      .from('RfPaymentMethod')
      .select('*')
      .order('PaymentMethodID');

    // Get product types
    const { data: productTypes, error: typeError } = await client
      .from('ProductType')
      .select('*')
      .order('ProductTypeID');

    return {
      orderStatuses: orderStatuses || [],
      paymentMethods: paymentMethods || [],
      productTypes: productTypes || []
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      orderStatuses: [],
      paymentMethods: [],
      productTypes: []
    };
  }
}
