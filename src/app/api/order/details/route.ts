import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { ValidationService } from '@/utils/validation'
import { ErrorResponseBuilder } from '@/utils/errorResponses'
import { Logger } from '@/utils/logger'
import { ResourceValidator } from '@/utils/resourceValidator'
import { handleValidationError, handleResourceNotFoundError, handleDatabaseError } from '@/utils/globalErrorHandler'
import { getAuthenticatedUser } from '@/utils/auth'

export async function GET(request: NextRequest) {
  const endpoint = '/api/order/details';
  
  try {
    Logger.logRequest('GET', endpoint);
    
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    // Validate orderId
    const orderIdValidation = ValidationService.validateOrderId(orderId);
    if (!orderIdValidation.isValid) {
      Logger.logValidationError(endpoint, orderIdValidation.errors);
      return handleValidationError(orderIdValidation.errors, endpoint);
    }

    const numericOrderId = parseInt(orderId!, 10);
    const supabase = createServerClient()

    // ✅ AUTHENTICATION CHECK (before resource validation to prevent enumeration)
    const authHeader = request.headers.get('authorization')
    
    if (authHeader) {
      // User is sending auth token - verify they own this order
      const { error: authError, status: authStatus, user: authUser } = await getAuthenticatedUser(request)
      
      if (authError || !authUser) {
        return NextResponse.json(
          { error: authError },
          { status: authStatus }
        )
      }

      // Fetch the order to check ownership
      const { data: orderOwnerCheck } = await supabase
        .from('Order')
        .select('LoginID')
        .eq('OrderID', numericOrderId)
        .single()

      if (orderOwnerCheck && orderOwnerCheck.LoginID !== authUser.LoginID) {
        return NextResponse.json(
          { error: 'Забранен достъп - това не е вашата поръчка' },
          { status: 403 }
        )
      }
    } else {
      // No auth header - require orderToken for unauthenticated access (order-success page)
      const orderToken = searchParams.get('orderToken')
      
      if (!orderToken) {
        return NextResponse.json(
          { error: 'Неоторизиран достъп - моля, влезте в акаунта си' },
          { status: 401 }
        )
      }

      // Verify the order token (base64 encoded orderId:timestamp:salt)
      try {
        const SALT = 'pizza-stop-2024'
        let base64 = orderToken.replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4) {
          base64 += '='
        }
        const decoded = atob(base64)
        const parts = decoded.split(':')
        
        if (parts.length !== 3) {
          return NextResponse.json(
            { error: 'Невалиден токен за поръчка' },
            { status: 401 }
          )
        }

        const [tokenOrderId, timestamp, salt] = parts

        if (salt !== SALT) {
          return NextResponse.json(
            { error: 'Невалиден токен за поръчка' },
            { status: 401 }
          )
        }

        // Check timestamp (24 hours validity)
        const orderTime = parseInt(timestamp)
        const maxAge = 24 * 60 * 60 * 1000
        if (Date.now() - orderTime > maxAge) {
          return NextResponse.json(
            { error: 'Токенът за поръчка е изтекъл' },
            { status: 401 }
          )
        }

        // Verify the token matches the requested orderId
        if (tokenOrderId !== orderId) {
          return NextResponse.json(
            { error: 'Невалиден токен за поръчка' },
            { status: 403 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Невалиден токен за поръчка' },
          { status: 401 }
        )
      }
    }

    // Pre-validate that order exists
    const validator = new ResourceValidator();
    const orderCheck = await validator.validateOrderExists(numericOrderId);
    
    if (!orderCheck.exists) {
      Logger.logResourceNotFound(endpoint, 'Order', orderId!);
      return handleResourceNotFoundError('Поръчка', orderId!, endpoint);
    }

    // 1) Base order without joins (avoid schema relationship assumptions)
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select('*')
      .eq('OrderID', numericOrderId)
      .single()

    if (orderError || !order) {
      Logger.logDatabaseError(endpoint, orderError, 'fetchOrder');
      return handleDatabaseError(orderError, 'fetchOrder', endpoint);
    }

    Logger.info('Order found successfully', { orderId: numericOrderId }, endpoint);

    // 2) Related data fetched separately and composed
    let login: any = null
    if (order.LoginID) {
      const { data: loginData } = await supabase
        .from('Login')
        .select('Name, email, phone, LocationText, LocationCoordinates, addressInstructions')
        .eq('LoginID', order.LoginID)
        .single()
      login = loginData || null
    }

    let orderStatus: any = null
    if (order.OrderStatusID) {
      const { data: statusData } = await supabase
        .from('RfOrderStatus')
        .select('OrderStatus')
        .eq('OrderStatusID', order.OrderStatusID)
        .single()
      orderStatus = statusData || null
    }

    let paymentMethod: any = null
    if (order.RfPaymentMethodID) {
      const { data: paymentData } = await supabase
        .from('RfPaymentMethod')
        .select('PaymentMethod')
        .eq('PaymentMethodID', order.RfPaymentMethodID)
        .single()
      paymentMethod = paymentData || null
    }

    // 3) Order items with CompositeProduct data
    const { data: orderItems, error: itemsError } = await supabase
      .from('LkOrderProduct')
      .select(`
        *,
        CompositeProduct (
          CompositeProductID,
          Size,
          PricingMethod,
          BaseUnitPrice,
          Parts,
          Addons,
          comment
        )
      `)
      .eq('OrderID', numericOrderId)

    if (itemsError) {
      Logger.logDatabaseError(endpoint, itemsError, 'fetchOrderItems');
      return handleDatabaseError(itemsError, 'fetchOrderItems', endpoint);
    }

    // 4) Parse coordinates and addons
    let coordinates = null
    if (order.OrderLocationCoordinates) {
      try {
        coordinates = JSON.parse(order.OrderLocationCoordinates)
      } catch {
        // Failed to parse coordinates
      }
    }

    let userCoordinates = null
    if (login?.LocationCoordinates) {
      try {
        userCoordinates = JSON.parse(login.LocationCoordinates)
      } catch {
        // Failed to parse coordinates
      }
    }

    const itemsWithParsedAddons = orderItems?.map((item) => {
      // Helper function to safely parse JSON (handles both strings and objects)
      const safeJSONParse = (data: any) => {
        if (!data) return null
        if (typeof data === 'string') {
          try {
            return JSON.parse(data)
          } catch {
            return null
          }
        }
        // If it's already an object (JSONB from Supabase), return as-is
        return data
      }

      const parsedItem = {
        ...item,
        Addons: safeJSONParse(item.Addons)
      }
      
      // If this is a composite product, parse the Parts data
      if (item.CompositeProduct) {
        parsedItem.CompositeProduct = {
          ...item.CompositeProduct,
          Parts: safeJSONParse(item.CompositeProduct.Parts),
          Addons: safeJSONParse(item.CompositeProduct.Addons)
        }
      }
      
      return parsedItem
    }) || []

    Logger.info('Order details retrieved successfully', { 
      orderId: numericOrderId, 
      itemsCount: orderItems?.length || 0 
    }, endpoint);

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        OrderLocationCoordinates: coordinates,
        Login: login ? { ...login, LocationCoordinates: userCoordinates } : null,
        OrderStatus: orderStatus ? { StatusName: orderStatus.OrderStatus } : null,
        PaymentMethod: paymentMethod ? { PaymentMethodName: paymentMethod.PaymentMethod } : null,
        items: itemsWithParsedAddons,
        ExpectedDT: order.ExpectedDT,
        OrderType: order.OrderType
      }
    })

  } catch (error) {
    Logger.error('Order details API error', { 
      error: error instanceof Error ? error.message : error 
    }, endpoint);
    return ErrorResponseBuilder.internalServerError('Грешка при извличане на детайлите на поръчката');
  }
}
