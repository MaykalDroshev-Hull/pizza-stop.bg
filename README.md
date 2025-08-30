# Pizza Stop - Food Ordering Website

A modern food ordering website built with Next.js, React, and Tailwind CSS.

## Features

- 🍕 **Menu Display**: Browse pizzas, burgers, and drinks
- 🛒 **Shopping Cart**: Add items with customization options
- 📍 **Address Selection**: Google Maps integration for precise delivery location
- 💳 **Payment Options**: Online, card at delivery, or cash at delivery
- 🌙 **Theme Support**: Dark theme Only
- 📱 **Mobile Responsive**: Optimized for all device sizes

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd pizza-stop.bg
```

2. Install dependencies
```bash
npm install
```

3. Set up Google Maps API key
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select existing one
   - Enable Maps JavaScript API and Geocoding API
   - Create credentials (API Key)
   - Create `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── checkout/       # Checkout page
│   ├── order/          # Menu/order page
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── CartContext.tsx # Shopping cart state management
│   ├── CartIcon.tsx    # Cart icon with preview
│   ├── CartModal.tsx   # Item customization modal
│   ├── AddressSelectionModal.tsx # Google Maps address selection
│   └── ...
└── styles/            # CSS and styling
    └── globals.css    # Global styles and theme variables
```

## Key Components

### CartContext
Manages global shopping cart state with React Context API.

### AddressSelectionModal
Google Maps integration for selecting exact delivery location:
- Geocodes entered address
- Shows map with address marker
- Allows customer to select exact door location
- Waze-like simple interface

### Checkout Page
Complete checkout flow:
- Customer information (name, phone)
- Address input with map selection
- Payment method selection
- Order summary

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS Variables**: Theme-aware color system
- **Responsive Design**: Mobile-first approach
- **Dark/Light Themes**: Dark theme only

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT License
