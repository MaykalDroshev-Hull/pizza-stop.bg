# Google Maps Setup for Pizza Stop

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
4. Go to Credentials → Create Credentials → API Key
5. Copy your API key

### 2. Environment Configuration

Create a `.env.local` file in your project root and add:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. API Key Restrictions (Recommended)

For security, restrict your API key:
- HTTP referrers: Only allow your domain
- API restrictions: Only Maps JavaScript API and Geocoding API

### 4. Features Implemented

The delivery area map includes:
- Interactive Google Map centered on Lovech, Bulgaria
- Custom delivery area polygon overlay
- Restaurant location marker
- Delivery information cards
- Responsive design for all devices

### 5. Customization

You can modify the delivery area by updating the coordinates in `src/components/DeliveryAreaMap.tsx`:

```javascript
const deliveryArea = [
  { lat: 43.1500, lng: 24.6800 }, // North
  { lat: 43.1550, lng: 24.7200 }, // Northeast
  // ... add more coordinates as needed
]
```

### 6. Styling

The component uses the existing design system:
- Dark theme with neon accents
- Pizza red (#dc2626) for the delivery area
- Responsive grid layout
- Hover effects and animations

### 7. Troubleshooting

If the map doesn't load:
- Check your API key is correct
- Verify the API is enabled in Google Cloud Console
- Check browser console for errors
- Ensure your domain is allowed in API key restrictions
