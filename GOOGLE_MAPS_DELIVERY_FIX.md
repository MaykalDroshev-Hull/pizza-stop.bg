# Google Maps API Error Fix - Delivery Page

**Error:** "Google Maps Platform rejected your request. This API key is not authorized to use this service or API."

**Location:** `/delivery` page

---

## Root Cause

Your delivery page uses **Google Maps Embed API** (specifically `directions` and `view` modes), but this API is **NOT enabled** in your Google Cloud Console.

### What's Being Used

The delivery page code uses:
```javascript
// Lines 1304, 1308, 1321, 1323 in src/app/delivery/page.tsx
https://www.google.com/maps/embed/v1/directions?key=YOUR_KEY&...
https://www.google.com/maps/embed/v1/view?key=YOUR_KEY&...
```

### What Your Setup Doc Says to Enable

The `GOOGLE_MAPS_SETUP.md` file only mentions:
- ✅ Maps JavaScript API
- ✅ Geocoding API

But it's missing:
- ❌ **Maps Embed API** (required for your delivery page!)

---

## The Fix

You need to enable the **Maps Embed API** in Google Cloud Console.

### Step-by-Step Instructions

#### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

#### 2. Select Your Project
Click on the project dropdown at the top and select your Pizza Stop project

#### 3. Enable Maps Embed API
1. In the search bar at the top, type: **"Maps Embed API"**
2. Click on **"Maps Embed API"** in the results
3. Click the **"Enable"** button
4. Wait 1-2 minutes for it to activate

#### 4. Verify Your API Key Has Access
1. Go to **APIs & Services → Credentials**
2. Click on your API key
3. Under **"API restrictions"**, ensure it includes:
   - ✅ Maps Embed API (NEW!)
   - ✅ Maps JavaScript API
   - ✅ Geocoding API

#### 5. Check Your API Key is in Environment Variables

Make sure you have a `.env.local` file in your project root:

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important:** 
- The file should be named exactly `.env.local`
- Restart your Next.js dev server after adding it: `npm run dev`

---

## Alternative Solution: Check if API Key is Set

If you haven't set the API key yet, the delivery page will also fail. Check in your terminal:

**Windows PowerShell:**
```powershell
$env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

**Windows CMD:**
```cmd
echo %NEXT_PUBLIC_GOOGLE_MAPS_API_KEY%
```

If it returns empty or undefined, you need to:

1. Create `.env.local` file in project root
2. Add your API key:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. Restart dev server

---

## Complete API List for Pizza Stop

For full functionality, enable these in Google Cloud Console:

### Required APIs
| API Name | Used In | Purpose |
|----------|---------|---------|
| **Maps Embed API** | Delivery page | Show map with directions |
| Maps JavaScript API | Checkout, Dashboard | Interactive address selection |
| Geocoding API | Checkout | Convert addresses to coordinates |
| Places API (optional) | Checkout | Address autocomplete |

### How to Enable All At Once

1. Go to https://console.cloud.google.com/apis/library
2. Search for each API name above
3. Click **"Enable"** on each one
4. Wait 1-2 minutes for activation

---

## Verify It's Working

After enabling Maps Embed API:

1. **Clear browser cache** (or open incognito window)
2. Go to: http://localhost:3000/delivery
3. Login as delivery driver
4. You should now see the map with delivery routes!

### Expected Result

✅ Map loads showing:
- Driver location (default: Lovech center)
- Delivery destinations with pins
- Driving directions and routes
- Distance and time estimates

---

## API Key Security (Important!)

### Restrict Your API Key

To prevent unauthorized use and unexpected charges:

1. Go to **APIs & Services → Credentials**
2. Click your API key
3. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Add your domains:
     ```
     http://localhost:3000/*
     http://localhost:*/*
     https://your-production-domain.com/*
     ```

4. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check only the APIs you need:
     - Maps Embed API
     - Maps JavaScript API
     - Geocoding API

5. Click **"Save"**

---

## Cost Considerations

### Maps Embed API Pricing

Google provides **$200 free credit per month**, which covers:
- ~28,000 map loads per month (for Embed API)
- After that: $7 per 1,000 loads

### Tips to Minimize Costs

1. **Enable billing alerts** in Google Cloud Console
2. **Set daily quota limits** to prevent overuse
3. **Restrict API key** to only your domains
4. **Monitor usage** in Google Cloud Console

---

## Troubleshooting

### Issue 1: Still Getting the Error
**Solution:** Wait 2-3 minutes after enabling the API, then refresh the page

### Issue 2: Map Shows "For development purposes only"
**Solution:** You need to enable billing in Google Cloud Console (required for production use)

### Issue 3: Different Error Message
**Solution:** Check browser console (F12) for the specific error and share it

### Issue 4: Environment Variable Not Loading
**Solution:** 
1. Verify `.env.local` exists in project root (not in `src/`)
2. Restart Next.js dev server: `Ctrl+C` then `npm run dev`
3. Check the file has no typos: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## Updated GOOGLE_MAPS_SETUP.md

I recommend updating your setup documentation:

```markdown
### 3. Enable Required APIs

In Google Cloud Console, enable these APIs:
1. **Maps Embed API** ⭐ (For delivery page)
2. Maps JavaScript API (For interactive maps)
3. Geocoding API (For address validation)
4. Places API (Optional - for autocomplete)
```

---

## Quick Checklist

- [ ] Go to Google Cloud Console
- [ ] Enable **Maps Embed API**
- [ ] Verify API key has access to it
- [ ] Create `.env.local` with your API key
- [ ] Restart Next.js dev server
- [ ] Clear browser cache
- [ ] Test `/delivery` page
- [ ] Map should now load! 🎉

---

## Summary

**The Problem:** Maps Embed API not enabled  
**The Solution:** Enable it in Google Cloud Console  
**Time to Fix:** 2-3 minutes  
**Cost:** Free (within $200/month credit)  

After enabling Maps Embed API and restarting your server, the delivery page map will work perfectly!


