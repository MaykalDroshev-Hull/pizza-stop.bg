# 🔧 Ready-to-Implement Security Fixes
## Copy-Paste Code for Development Team

**Date:** February 17, 2026  
**Priority:** CRITICAL - Implement Today

---

## 📋 FILES TO MODIFY

1. `src/app/api/user/profile/route.ts` ✅ CRITICAL
2. `src/app/api/user/orders/route.ts` ✅ CRITICAL
3. `src/app/api/order/details/route.ts` ✅ CRITICAL
4. `src/app/api/auth/register/route.ts` ✅ HIGH
5. `src/app/api/auth/login/route.ts` ✅ HIGH (rate limit fix)

---

## 🔴 CRITICAL FIX #1: User Profile Endpoint

**File:** `src/app/api/user/profile/route.ts`

**Replace the ENTIRE file contents with this:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ✅ HELPER FUNCTION: Verify authentication and get user
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return { error: 'Unauthorized - Please login first', status: 401, user: null }
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token)
  
  if (sessionError || !sessionData.user) {
    return { error: 'Invalid or expired session', status: 401, user: null }
  }
  
  // Get LoginID from email
  const { data: loginUser, error: loginError } = await supabase
    .from('Login')
    .select('LoginID')
    .eq('email', sessionData.user.email)
    .single()
  
  if (loginError || !loginUser) {
    return { error: 'User not found', status: 404, user: null }
  }
  
  return { error: null, status: 200, user: { ...sessionData.user, LoginID: loginUser.LoginID } }
}

// ✅ SECURE GET METHOD
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER
    const { error: authError, status: authStatus, user: authUser } = await getAuthenticatedUser(request)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }
    
    // 2. GET REQUESTED USER ID
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')
    
    if (!requestedUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const userIdNum = parseInt(requestedUserId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }
    
    // 3. VERIFY USER CAN ONLY ACCESS THEIR OWN DATA
    if (authUser.LoginID !== userIdNum) {
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own profile' },
        { status: 403 }
      )
    }
    
    // 4. FETCH USER PROFILE
    const { data: user, error: userError } = await supabase
      .from('Login')
      .select(`
        LoginID,
        Name,
        email,
        phone,
        LocationText,
        LocationCoordinates,
        addressInstructions,
        created_at
      `)
      .eq('LoginID', userIdNum)
      .single()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Parse coordinates if available
    let coordinates = null
    if (user.LocationCoordinates) {
      try {
        coordinates = JSON.parse(user.LocationCoordinates)
      } catch (error) {
        console.warn('Failed to parse coordinates:', user.LocationCoordinates)
      }
    }
    
    // Return user profile
    return NextResponse.json({
      user: {
        id: user.LoginID,
        name: user.Name,
        email: user.email,
        phone: user.phone,
        LocationText: user.LocationText || '',
        LocationCoordinates: user.LocationCoordinates || '',
        addressInstructions: user.addressInstructions || '',
        created_at: user.created_at
      }
    })
    
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ✅ SECURE PUT METHOD
export async function PUT(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER
    const { error: authError, status: authStatus, user: authUser } = await getAuthenticatedUser(request)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }
    
    // 2. GET REQUEST BODY
    const body = await request.json()
    let { userId, name, email, phone } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const userIdNum = parseInt(userId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }
    
    // 3. VERIFY USER CAN ONLY UPDATE THEIR OWN DATA
    if (authUser.LoginID !== userIdNum) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own profile' },
        { status: 403 }
      )
    }
    
    // 4. VALIDATE REQUIRED FIELDS
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }
    
    // ✅ 5. INPUT SANITIZATION - REJECT MALICIOUS CONTENT
    // Remove leading/trailing whitespace
    name = name.trim()
    
    // Reject HTML tags
    if (/<[^>]*>/i.test(name)) {
      return NextResponse.json(
        { error: 'Name cannot contain HTML tags or script code' },
        { status: 400 }
      )
    }
    
    // Reject SQL-like patterns
    if (/drop|delete|insert|update|select|union|--|;/i.test(name)) {
      return NextResponse.json(
        { error: 'Name contains invalid characters' },
        { status: 400 }
      )
    }
    
    // Limit length
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Name is too long (maximum 100 characters)' },
        { status: 400 }
      )
    }
    
    // 6. VALIDATE EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // 7. VALIDATE PHONE FORMAT
    const phoneRegex = /^(\+359|0)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Please use Bulgarian phone number format (e.g., 0888123456 or +359888123456)' },
        { status: 400 }
      )
    }
    
    // 8. CHECK IF EMAIL IS TAKEN BY ANOTHER USER
    const { data: existingUser, error: checkError } = await supabase
      .from('Login')
      .select('LoginID, email')
      .eq('email', email)
      .neq('LoginID', userId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing email:', checkError)
      return NextResponse.json(
        { error: 'Error checking email availability' },
        { status: 500 }
      )
    }
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 400 }
      )
    }
    
    // 9. UPDATE USER PROFILE
    const { data: updatedUser, error: updateError } = await supabase
      .from('Login')
      .update({
        Name: name,
        email: email,
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq('LoginID', userIdNum)
      .select(`
        LoginID,
        Name,
        email,
        phone,
        LocationText,
        LocationCoordinates,
        addressInstructions,
        created_at
      `)
      .single()
    
    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Return updated user profile
    return NextResponse.json({
      user: {
        id: updatedUser.LoginID,
        name: updatedUser.Name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        LocationText: updatedUser.LocationText || '',
        LocationCoordinates: updatedUser.LocationCoordinates || '',
        addressInstructions: updatedUser.addressInstructions || '',
        created_at: updatedUser.created_at
      },
      message: 'Profile updated successfully'
    })
    
  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🔴 CRITICAL FIX #2: User Orders Endpoint

**File:** `src/app/api/user/orders/route.ts`

**Replace the ENTIRE file contents with this:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ✅ HELPER FUNCTION: Verify authentication
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return { error: 'Unauthorized - Please login first', status: 401, user: null }
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token)
  
  if (sessionError || !sessionData.user) {
    return { error: 'Invalid or expired session', status: 401, user: null }
  }
  
  // Get LoginID from email
  const { data: loginUser, error: loginError } = await supabase
    .from('Login')
    .select('LoginID')
    .eq('email', sessionData.user.email)
    .single()
  
  if (loginError || !loginUser) {
    return { error: 'User not found', status: 404, user: null }
  }
  
  return { error: null, status: 200, user: { ...sessionData.user, LoginID: loginUser.LoginID } }
}

export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER
    const { error: authError, status: authStatus, user: authUser } = await getAuthenticatedUser(request)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }
    
    // 2. GET REQUESTED USER ID
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')
    
    if (!requestedUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const userIdNum = parseInt(requestedUserId, 10)
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }
    
    // 3. VERIFY USER CAN ONLY ACCESS THEIR OWN ORDERS
    if (authUser.LoginID !== userIdNum) {
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own orders' },
        { status: 403 }
      )
    }
    
    // 4. FETCH USER ORDERS
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        OrderDT,
        ExpectedDT,
        DeliveredDT,
        TotalAmount,
        OrderStatusID,
        RfPaymentMethodID,
        IsPaid,
        OrderLocation,
        OrderType,
        DeliveryPrice
      `)
      .eq('LoginID', userIdNum)
      .order('OrderDT', { ascending: false })
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }
    
    // 5. FETCH ORDER ITEMS FOR EACH ORDER
    const ordersWithDetails = await Promise.all(
      (orders || []).map(async (order) => {
        // Fetch order items
        const { data: items } = await supabase
          .from('LkOrderProduct')
          .select(`
            LkOrderProductID,
            ProductID,
            ProductName,
            ProductSize,
            Quantity,
            UnitPrice,
            TotalPrice,
            Addons,
            Comment
          `)
          .eq('OrderID', order.OrderID)
        
        // Fetch status name
        const { data: status } = await supabase
          .from('OrderStatus')
          .select('StatusName')
          .eq('OrderStatusID', order.OrderStatusID)
          .single()
        
        // Fetch payment method
        const { data: paymentMethod } = await supabase
          .from('RfPaymentMethod')
          .select('PaymentMethodName')
          .eq('RfPaymentMethodID', order.RfPaymentMethodID)
          .single()
        
        return {
          OrderID: order.OrderID.toString(),
          OrderDate: order.OrderDT,
          ExpectedDT: order.ExpectedDT,
          DeliveredDT: order.DeliveredDT,
          TotalAmount: order.TotalAmount,
          Status: status?.StatusName || 'Unknown',
          StatusID: order.OrderStatusID,
          PaymentMethod: paymentMethod?.PaymentMethodName || 'Unknown',
          IsPaid: order.IsPaid,
          DeliveryAddress: order.OrderLocation,
          OrderType: order.OrderType,
          DeliveryPrice: order.DeliveryPrice,
          Products: items || []
        }
      })
    )
    
    return NextResponse.json({
      orders: ordersWithDetails,
      count: ordersWithDetails.length
    })
    
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🔴 CRITICAL FIX #3: Order Details Endpoint

**File:** `src/app/api/order/details/route.ts`

**Replace the ENTIRE file contents with this:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ✅ HELPER FUNCTION: Verify authentication
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return { error: 'Unauthorized - Please login first', status: 401, user: null }
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token)
  
  if (sessionError || !sessionData.user) {
    return { error: 'Invalid or expired session', status: 401, user: null }
  }
  
  // Get LoginID from email
  const { data: loginUser, error: loginError } = await supabase
    .from('Login')
    .select('LoginID')
    .eq('email', sessionData.user.email)
    .single()
  
  if (loginError || !loginUser) {
    return { error: 'User not found', status: 404, user: null }
  }
  
  return { error: null, status: 200, user: { ...sessionData.user, LoginID: loginUser.LoginID } }
}

export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER
    const { error: authError, status: authStatus, user: authUser } = await getAuthenticatedUser(request)
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }
    
    // 2. GET REQUESTED ORDER ID
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const orderIdNum = parseInt(orderId, 10)
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }
    
    // 3. FETCH ORDER
    const { data: order, error: orderError } = await supabase
      .from('Order')
      .select(`
        OrderID,
        LoginID,
        OrderDT,
        OrderLocation,
        OrderLocationCoordinates,
        OrderStatusID,
        RfPaymentMethodID,
        IsPaid,
        ExpectedDT,
        OrderType,
        DeliveryPrice,
        TotalAmount,
        ReadyTime,
        Comments
      `)
      .eq('OrderID', orderIdNum)
      .single()
    
    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Поръчка не е намерен', details: { id: orderId }, timestamp: new Date().toISOString(), type: 'not_found_error' },
        { status: 404 }
      )
    }
    
    // 4. VERIFY USER OWNS THIS ORDER
    if (order.LoginID !== authUser.LoginID) {
      return NextResponse.json(
        { error: 'Forbidden - This is not your order' },
        { status: 403 }
      )
    }
    
    // 5. FETCH RELATED DATA
    const [loginData, statusData, paymentData, itemsData] = await Promise.all([
      supabase
        .from('Login')
        .select('Name, email, phone, LocationText, LocationCoordinates, addressInstructions')
        .eq('LoginID', order.LoginID)
        .single(),
      supabase
        .from('OrderStatus')
        .select('StatusName')
        .eq('OrderStatusID', order.OrderStatusID)
        .single(),
      supabase
        .from('RfPaymentMethod')
        .select('PaymentMethodName')
        .eq('RfPaymentMethodID', order.RfPaymentMethodID)
        .single(),
      supabase
        .from('LkOrderProduct')
        .select('*')
        .eq('OrderID', orderIdNum)
    ])
    
    // 6. PARSE COORDINATES
    let orderCoords = null
    if (order.OrderLocationCoordinates) {
      try {
        orderCoords = JSON.parse(order.OrderLocationCoordinates)
      } catch (e) {
        orderCoords = order.OrderLocationCoordinates
      }
    }
    
    let loginCoords = null
    if (loginData.data?.LocationCoordinates) {
      try {
        loginCoords = JSON.parse(loginData.data.LocationCoordinates)
      } catch (e) {
        loginCoords = loginData.data.LocationCoordinates
      }
    }
    
    // 7. BUILD RESPONSE
    return NextResponse.json({
      success: true,
      order: {
        OrderID: order.OrderID,
        LoginID: order.LoginID,
        OrderDT: order.OrderDT,
        OrderLocation: order.OrderLocation,
        OrderLocationCoordinates: orderCoords,
        OrderStatusID: order.OrderStatusID,
        RfPaymentMethodID: order.RfPaymentMethodID,
        IsPaid: order.IsPaid,
        ExpectedDT: order.ExpectedDT,
        OrderType: order.OrderType,
        DeliveryPrice: order.DeliveryPrice,
        TotalAmount: order.TotalAmount,
        ReadyTime: order.ReadyTime,
        Comments: order.Comments,
        Login: {
          Name: loginData.data?.Name,
          email: loginData.data?.email,
          phone: loginData.data?.phone,
          LocationText: loginData.data?.LocationText,
          LocationCoordinates: loginCoords,
          addressInstructions: loginData.data?.addressInstructions
        },
        OrderStatus: {
          StatusName: statusData.data?.StatusName
        },
        PaymentMethod: {
          PaymentMethodName: paymentData.data?.PaymentMethodName
        },
        items: itemsData.data || []
      }
    })
    
  } catch (error) {
    console.error('Order details API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🟠 HIGH PRIORITY FIX #4: Add Rate Limiting to Registration

**File:** `src/app/api/auth/register/route.ts`

**Add this at the top of the file (after imports):**

```typescript
import { withRateLimit, createRateLimitResponse } from '@/utils/rateLimit'
```

**Then modify the POST function to add rate limiting at the beginning:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // ✅ ADD RATE LIMITING
    const rateLimit = await withRateLimit(request, 'register')
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.headers)
    }
    
    // ... rest of your existing registration code ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

---

## 🟠 HIGH PRIORITY FIX #5: Fix Rate Limiting Error Handling

**File:** `src/app/api/auth/login/route.ts`

**Wrap the rate limiting check in a try-catch:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // ✅ IMPROVED RATE LIMITING WITH ERROR HANDLING
    try {
      const rateLimit = await withRateLimit(request, 'login')
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit.headers)
      }
    } catch (rateLimitError) {
      // Log error but don't crash the endpoint
      console.error('Rate limit check failed:', rateLimitError)
      // Continue processing - fail open
      // Alternatively, you could return 503 Service Unavailable - fail closed
    }
    
    // ... rest of your existing login code ...
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 📋 TESTING CHECKLIST

After implementing these fixes, test the following:

### ✅ Test 1: Authentication Works
```bash
# Should return 401 Unauthorized
curl https://www.pizzastop.bg/api/user/profile?userId=1

# Should return 200 with user data (with valid token)
curl -H "Authorization: Bearer YOUR_VALID_TOKEN" \
  https://www.pizzastop.bg/api/user/profile?userId=1
```

### ✅ Test 2: Users Can't Access Other Users' Data
```bash
# User 1's token trying to access User 2's data
# Should return 403 Forbidden
curl -H "Authorization: Bearer USER1_TOKEN" \
  https://www.pizzastop.bg/api/user/profile?userId=2
```

### ✅ Test 3: Input Sanitization Works
```bash
# Should return 400 error
curl -X PUT https://www.pizzastop.bg/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"name":"<script>alert(\"XSS\")</script>","email":"test@test.com","phone":"0888123456"}'
```

### ✅ Test 4: Rate Limiting Works
```bash
# Send 15 rapid requests
# Should get 429 after 5-10 requests
for i in {1..15}; do
  curl -X POST https://www.pizzastop.bg/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\nRequest $i done"
done
```

---

## 🔧 FRONTEND CHANGES NEEDED

### Update API Calls to Include Authorization

**Before (INSECURE):**
```typescript
// ❌ No authentication
fetch('/api/user/profile?userId=1')
  .then(res => res.json())
```

**After (SECURE):**
```typescript
// ✅ With authentication
const { data } = await supabase.auth.getSession()
const token = data.session?.access_token

if (!token) {
  // Redirect to login
  router.push('/login')
  return
}

fetch('/api/user/profile?userId=1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => {
    if (res.status === 401) {
      // Session expired, redirect to login
      router.push('/login')
      return
    }
    return res.json()
  })
```

### Handle 401 and 403 Errors

```typescript
async function fetchUserProfile(userId: number) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  
  if (!token) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch(`/api/user/profile?userId=${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  if (response.status === 401) {
    // Session expired
    await supabase.auth.signOut()
    window.location.href = '/login'
    throw new Error('Session expired')
  }
  
  if (response.status === 403) {
    // Trying to access other user's data
    throw new Error('Access denied')
  }
  
  return response.json()
}
```

---

## ⚠️ IMPORTANT DEPLOYMENT NOTES

### 1. Environment Variables
Make sure these are set in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL` (for rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` (for rate limiting)

### 2. Test in Staging First
- Deploy to staging environment
- Run all security tests
- Verify existing features still work
- Then deploy to production

### 3. Monitor After Deployment
- Watch for 401/403 errors in logs
- Check if legitimate users are blocked
- Monitor rate limiting effectiveness
- Track any error spikes

### 4. Rollback Plan
Keep the old code backed up in case you need to rollback:
```bash
# Before deploying
git branch backup-before-security-fixes
git push origin backup-before-security-fixes

# If needed to rollback
git checkout backup-before-security-fixes
git push origin main --force
```

---

## 📞 SUPPORT

If you encounter issues during implementation:

1. **Authentication not working?**
   - Check if Supabase Auth is properly configured
   - Verify JWT tokens are being sent from frontend
   - Check token format (should be "Bearer TOKEN")

2. **Users getting 403 errors on their own data?**
   - Verify email matches between session and database
   - Check LoginID mapping logic
   - Add logging to debug authentication flow

3. **Rate limiting still crashing?**
   - Check Upstash Redis credentials
   - Try the "fail open" approach (continue on error)
   - Consider alternative rate limiting library

---

**All code is ready to copy-paste. Just replace the files and test!**

**Questions?** Contact: Hristo Kalchev (cibos38595@arqsis.com / 0879191128)
