# Product ID Foreign Key Constraint Fix

**Date:** October 17, 2025  
**Error:** Foreign key constraint violation when inserting order items

```
Key (ProductID)=(431760707652438) is not present in table "Product"
insert or update on table "LkOrderProduct" violates foreign key constraint "fk_lkorderproduct_product"
```

---

## Root Cause

The cart was using **composite IDs** for uniqueness:
```typescript
id: `${item.id}_${Date.now()}` // e.g., "123_1760707652438"
```

But the API was inserting this entire string as the `ProductID` into the database, which failed foreign key validation.

### Why Composite IDs?

The cart uses composite IDs to treat each "Add to Cart" action as a unique item, preventing quantity incrementing. This allows:
- Multiple same pizzas with different toppings
- Multiple sauces as separate items
- Better order customization tracking

---

## The Fix

### 1. Updated CartItem Interface
**File:** `src/components/CartContext.tsx`

Added `productId` field to preserve original database ID:

```typescript
interface CartItem {
  id: number | string      // Unique cart item ID (for UI)
  productId?: number       // Original database ProductID (for orders)
  name: string
  price: number
  // ... rest of fields
}
```

### 2. Updated Cart Item Creation
**Files:** `src/app/order/page.tsx`, `src/components/CartModal.tsx`

Now stores both the composite ID and original ProductID:

```typescript
const cartItem = {
  ...item,
  id: `${item.id}_${Date.now()}`,  // Unique ID for cart management
  productId: item.id,                // Original ID for database
  // ... rest of fields
}
```

### 3. Updated API to Extract ProductID
**File:** `src/app/api/order/confirm/route.ts` (lines 451-476)

Added intelligent ProductID extraction:

```typescript
// Extract ProductID: handle both simple IDs and composite IDs
let productId = null

if (item.productId) {
  // Use explicit productId if available (NEW!)
  productId = item.productId
} else if (typeof item.id === 'number') {
  // If id is a number, use it directly
  productId = item.id
} else if (typeof item.id === 'string' && item.id.includes('_')) {
  // If id is "123_timestamp", extract "123"
  const idParts = item.id.split('_')
  productId = parseInt(idParts[0], 10)
} else {
  // Try to parse string id as number
  productId = parseInt(item.id as string, 10)
}

console.log(`Item "${item.name}": id=${item.id}, productId=${item.productId}, extracted=${productId}`)

orderItemsData.push({
  OrderID: order.OrderID,
  ProductID: productId,  // Now uses correct database ID!
  // ... rest of fields
})
```

---

## How It Works Now

### Before Fix
```
Cart Item: { id: "123_1760707652438" }
  ↓
API inserts: ProductID = "123_1760707652438"
  ↓
Database: ❌ Foreign key violation (not a valid ProductID)
  ↓
Order rollback (good!) but user frustrated
```

### After Fix
```
Cart Item: { id: "123_1760707652438", productId: 123 }
  ↓
API extracts: ProductID = 123
  ↓
Database: ✅ Valid ProductID, order saved!
  ↓
Kitchen page shows items correctly
```

---

## Backward Compatibility

The fix is backward compatible with old cart data:

1. **New cart items:** Include `productId` field → uses it directly
2. **Old cart items:** No `productId` field → extracts from composite ID
3. **Simple numeric IDs:** Still work as before

---

## Testing

### Test 1: Add New Item to Cart
1. Go to `/order` page
2. Add a pizza with toppings
3. **Expected:** Cart item has both `id` and `productId`
4. **Verify:** Check browser console for cart item structure

### Test 2: Place Order
1. Add items to cart
2. Complete checkout
3. **Expected:** Order created successfully
4. **Verify:** Check server logs for "Item extracted ProductID" messages

### Test 3: Check Kitchen Page
1. After placing order
2. Go to `/kitchen` page
3. **Expected:** All order items displayed correctly
4. **Result:** No missing items issue

---

## Server Log Output

Now you'll see detailed ProductID extraction logs:

```
💾 Inserting 3 items into LkOrderProduct for order 132
   Item "Pizza Margherita": id=123_1760708001768, productId=123, extracted=123
   Item "Coca Cola": id=456_1760708002345, productId=456, extracted=456
   Item "Порция картофи": id=789_1760708003912, productId=789, extracted=789
✅ Order items saved successfully: 3 items
```

---

## What Changed

| File | Lines | Change |
|------|-------|--------|
| `src/components/CartContext.tsx` | 6-17 | Added `productId` field to CartItem interface |
| `src/app/order/page.tsx` | 295, 322 | Store `productId` when adding items |
| `src/components/CartModal.tsx` | 151 | Store `productId` in personalized items |
| `src/app/api/order/confirm/route.ts` | 451-490 | Extract ProductID intelligently |

---

## Future Improvements

1. **Validate ProductID exists:** Query database before inserting
2. **Better error messages:** Show which product failed
3. **Admin notification:** Alert if invalid ProductID detected
4. **Cart migration:** Convert old cart items on load

---

## Summary

✅ Cart now stores original ProductID  
✅ API extracts correct ProductID for database  
✅ Backward compatible with existing carts  
✅ Order rollback still works if errors occur  
✅ Kitchen page will show all items correctly  

The foreign key constraint error is now **permanently fixed**!


