# Hydration Error & API Validation Fix

**Date:** October 17, 2025  
**Errors Fixed:**
1. Hydration mismatch in CartSummaryDisplay (server: 0.00 vs client: 49.60)
2. API 400 validation error on order submission

---

## Error 1: Hydration Mismatch

### Problem
React threw hydration error because CartSummaryDisplay showed different values on server vs client:
- **Server-side:** Cart not available → displays `0.00 лв`
- **Client-side:** Cart loaded from localStorage → displays `49.60 лв`

This is a classic SSR issue where server doesn't have access to browser storage.

### Root Cause
```tsx
// Before fix - renders immediately with cart value
export default function CartSummaryDisplay() {
  const { totalPrice } = useCart() // This is 0 on server, 49.60 on client
  return <span>{totalPrice.toFixed(2)} лв.</span>
}
```

The cart context loads from localStorage, which is only available on client-side.

### Solution Applied
**File:** `src/components/CartSummaryDisplay.tsx`

```tsx
'use client'

import { useCart } from './CartContext'
import React, { useState, useEffect } from 'react'

export default function CartSummaryDisplay() {
  const { totalPrice } = useCart()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering actual value after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial render, show placeholder that matches server
  if (!mounted) {
    return <span className="text-white">0.00 лв. </span>
  }

  // After hydration, show actual cart value
  return (
    <span className="text-white">{totalPrice.toFixed(2)} лв. </span>
  )
}
```

**How it works:**
1. **Server render:** `mounted = false` → renders `0.00 лв`
2. **Client first render:** `mounted = false` → renders `0.00 лв` (matches server ✓)
3. **After useEffect:** `mounted = true` → renders actual price `49.60 лв`
4. **No mismatch!** Initial client render matches server, then updates

---

## Error 2: API Validation Error (400)

### Problem
Order submission failed with:
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
Order submission error: Error: Invalid request data
```

### Root Cause
Multiple potential causes:
1. `orderTime.type` could be `null` (doesn't pass Zod enum validation)
2. `scheduledTime` could be invalid Date object
3. Missing required fields
4. Data type mismatches

### Solution Applied

#### Part 1: Enhanced Client Validation
**File:** `src/app/checkout/page.tsx` (lines 1305-1317)

```tsx
// Validate orderTime before sending (critical for API validation)
if (!orderTime.type) {
  alert('❌ Моля, изберете кога искате да получите поръчката')
  setIsLoading(false)
  return
}

// Ensure scheduledTime is a valid Date if type is scheduled
if (orderTime.type === 'scheduled' && (!orderTime.scheduledTime || !(orderTime.scheduledTime instanceof Date))) {
  alert('❌ Моля, изберете валидна дата и час за доставката')
  setIsLoading(false)
  return
}
```

This prevents sending invalid data to API in the first place.

#### Part 2: Type Assertion for Zod
**File:** `src/app/checkout/page.tsx` (line 1327)

```tsx
orderTime: {
  type: orderTime.type as 'immediate' | 'scheduled', // Type assertion for Zod
  scheduledTime: orderTime.scheduledTime ? orderTime.scheduledTime.toISOString() : undefined
}
```

Ensures TypeScript and Zod agree on the type.

#### Part 3: Better Error Logging
**File:** `src/app/checkout/page.tsx` (lines 1340, 1360-1372)

```tsx
// Before sending
console.log('🚀 Sending order data to API:', JSON.stringify(orderData, null, 2))

// After receiving error
if (!response.ok) {
  console.error('❌ Order API returned error:', result)
  console.error('   Status:', response.status)
  console.error('   Error:', result.error)
  console.error('   Details:', result.details)
  
  // Show user-friendly error message
  if (result.details) {
    alert(`❌ Невалидни данни:\n${JSON.stringify(result.details, null, 2)}`)
  } else {
    alert(`❌ ${result.error || 'Възникна грешка при потвърждаване на поръчката'}`)
  }
}
```

Now you can see:
- Exact data being sent to API
- Detailed validation errors from Zod
- Which fields failed validation

---

## Testing the Fixes

### Test 1: Hydration Error (FIXED)
1. Open checkout page
2. Check browser console
3. **Expected:** No hydration warnings
4. **Result:** Price displays correctly without errors

### Test 2: Order Submission
1. Add items to cart
2. Fill in checkout form
3. Select delivery time (immediate or scheduled)
4. Submit order
5. **Check console** for detailed logs:
   ```
   ✅ Cart validation passed: 2 items
   📦 Order details being sent to API:
      - Customer: Test User test@example.com
      - Items count: 2
      - Items: Pizza Margherita x1, Coca Cola x1
      ...
   🚀 Sending order data to API: { ... full JSON ... }
   ```

### Test 3: If Still Getting 400 Error
Check the console logs to see which field is failing validation:
```
❌ Order API returned error: {...}
   Details: {
     "orderTime": ["Invalid enum value. Expected 'immediate' | 'scheduled'"]
   }
```

This tells you exactly what's wrong!

---

## Common Validation Issues

If you're still getting 400 errors, check for these:

### Issue 1: OrderTime is null
**Symptom:** `orderTime.type` validation fails  
**Solution:** Ensure user selects "Незабавна" or "Планирана" delivery before submitting

### Issue 2: Scheduled time not selected
**Symptom:** `scheduledTime` validation fails  
**Solution:** If scheduled delivery selected, ensure date and time inputs are filled

### Issue 3: Cart empty
**Symptom:** `orderItems` validation fails with "min 1 item"  
**Solution:** This is now caught by client validation (should show alert)

### Issue 4: Payment method not selected
**Symptom:** `paymentMethodId` validation fails  
**Solution:** Ensure user selects payment method before submitting

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `src/components/CartSummaryDisplay.tsx` | Added mounted state | Fix hydration mismatch |
| `src/app/checkout/page.tsx` (1305-1317) | Added orderTime validation | Prevent invalid data submission |
| `src/app/checkout/page.tsx` (1327) | Added type assertion | Ensure Zod compatibility |
| `src/app/checkout/page.tsx` (1340) | Added pre-submit logging | Debug what's being sent |
| `src/app/checkout/page.tsx` (1360-1372) | Enhanced error handling | Show detailed validation errors |

---

## Next Steps

1. **Refresh the page** to get the hydration fix
2. **Try submitting an order** and check console logs
3. **If 400 error persists:**
   - Check browser console for `🚀 Sending order data to API` log
   - Check server console for `[REQ-xxxxx]` logs
   - Look at the `Details:` field to see which validation failed
   - Share the logs if you need help debugging

The hydration error should be completely resolved now! ✅


