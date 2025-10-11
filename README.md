# 🍕 Pizza Stop - Complete Food Delivery Platform

A modern, full-stack food delivery platform built with Next.js 15, React 19, and Supabase. Pizza Stop is a comprehensive solution for managing online orders, kitchen operations, delivery logistics, and customer experience.

## 🌟 Overview

Pizza Stop is a professional food delivery platform inspired by JustEat and UberEats, specifically designed for Pizza Stop restaurant in Lovech, Bulgaria. The platform features a conversion-optimized landing page, real-time order management, multiple admin dashboards, and thermal printer integration.

## 🎯 Key Features

### Customer-Facing Features
- 🍕 **Dynamic Menu System**: Browse pizzas, burgers, beverages, and addons with real-time pricing
- 🛒 **Smart Shopping Cart**: Advanced cart with customization options, addon selection, and real-time pricing
- 📍 **Google Maps Integration**: Precise address selection with delivery area validation
- 💳 **Multiple Payment Options**: Online payment, card at delivery, cash at delivery, card at restaurant, cash at restaurant
- 🎨 **Dark Theme UI**: Modern neon-accented design with pizza red (#dc2626) and green CTAs
- 📱 **Fully Responsive**: Mobile-first design optimized for all screen sizes
- 🔐 **User Authentication**: Secure registration, login, and profile management
- 📧 **Email Notifications**: Automated emails for order confirmation, preparation status, and delivery updates
- 🕒 **Real-Time Order Tracking**: Live updates on order status and estimated delivery time
- 🥤 **Smart Drink Suggestions**: AI-powered beverage recommendations based on order content
- 🔄 **Order History**: Complete order history with reorder functionality
- 🎫 **Guest Checkout**: Order without registration option

### Admin & Management Features
- 👨‍💼 **Admin Dashboard**: Complete product management, analytics, and system controls
- 👨‍🍳 **Kitchen Dashboard**: Real-time order queue, preparation tracking, and status updates
- 🚗 **Delivery Dashboard**: Route optimization, driver assignment, and delivery tracking
- 📊 **Analytics & Reporting**: Daily statistics, revenue tracking, and order trends
- 🖨️ **Thermal Printer Integration**: Automatic ticket printing for kitchen orders
- ⏰ **Operating Hours Management**: Dynamic opening hours with holiday schedule
- 🔄 **Auto-Accept Orders**: Configurable automatic order acceptance
- 📦 **Product Management**: Add, edit, delete, and restore products with image upload
- 🏷️ **Addon System**: Flexible addon management by product type
- 💰 **Dynamic Pricing**: Size-based pricing (small, medium, large) with weight information
- 🔍 **Review Management**: Customer feedback monitoring and moderation
- 📈 **Revenue Analytics**: Real-time financial tracking and reports

### Technical Features
- ⚡ **Next.js 15 App Router**: Server-side rendering with React Server Components
- 🎭 **TypeScript**: Full type safety across the entire codebase
- 🗄️ **Supabase Backend**: PostgreSQL database with real-time subscriptions
- 🔒 **Secure Authentication**: bcrypt password hashing with JWT tokens
- 📧 **Email Service**: Nodemailer with Gmail integration for transactional emails
- 🗺️ **Google Maps API**: Address geocoding and delivery area visualization
- 🖼️ **Image Upload**: Supabase Storage integration for product images
- 🎫 **Ticket Generation**: HTML to thermal printer format conversion
- 🛡️ **Input Validation**: Server-side validation and sanitization
- 🚨 **Error Handling**: Global error handling with logging
- 🔐 **Environment Validation**: Runtime validation of required environment variables
- 📝 **Order Encryption**: Secure order ID encryption for public URLs

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.2 (App Router)
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 3.4.17 + CSS Modules
- **Component Library**: Radix UI (Dialog, Select, Tabs, Toast)
- **Icons**: Lucide React 0.541.0
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Carousel**: React Slick
- **Maps**: Google Maps JavaScript API

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: bcryptjs + Supabase Auth
- **Email**: Nodemailer 7.0.6 (Gmail)
- **API Routes**: Next.js API Routes
- **File Storage**: Supabase Storage

### Development
- **Language**: TypeScript 5.9.2
- **Package Manager**: npm
- **Linting**: ESLint 9.34.0
- **Type Checking**: TypeScript strict mode

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Gmail account (for transactional emails)
- Google Cloud account (for Maps API)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pizza-stop.bg.git
cd pizza-stop.bg
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration (Gmail)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional: Base URL for production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 4. Supabase Setup

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete database schema and setup instructions.

**Quick Schema Overview:**
- `Login` - User accounts and authentication
- `Order` - Order records with status and payment info
- `Product` - Menu items with pricing and images
- `ProductType` - Product categories (Pizza, Burger, Beverage, etc.)
- `Addon` - Additional options (toppings, extras)
- `LkOrderProduct` - Order line items
- `CompositeProduct` - Complex products (e.g., half-half pizzas)
- `RfPaymentMethod` - Payment method reference data
- `RfOrderStatus` - Order status reference data
- `RestaurantSettings` - Operating hours and closure status

### 5. Google Maps Setup

See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for detailed instructions.

**Required APIs:**
- Maps JavaScript API
- Geocoding API

### 6. Email Setup

**Gmail Configuration:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `EMAIL_PASS` environment variable

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
pizza-stop.bg/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout with context providers
│   │   ├── globals.css               # Global styles and CSS variables
│   │   ├── admin/                    # Admin dashboard
│   │   │   ├── page.tsx              # Main admin panel
│   │   │   ├── components/           # Admin UI components
│   │   │   │   ├── ProductsTab.tsx   # Product management
│   │   │   │   ├── BeverageTab.tsx   # Beverage management
│   │   │   │   ├── AddonsTab.tsx     # Addon management
│   │   │   │   ├── AnalysisTab.tsx   # Analytics dashboard
│   │   │   │   └── ReviewManagement.tsx
│   │   │   ├── mixin/                # Shared admin components
│   │   │   │   ├── ProductListManager.tsx
│   │   │   │   └── EditProductModal.tsx
│   │   │   └── services/             # Admin services
│   │   │       └── productService.client.ts
│   │   ├── kitchen/                  # Kitchen dashboard
│   │   │   └── page.tsx              # Order preparation interface
│   │   ├── delivery/                 # Delivery dashboard
│   │   │   └── page.tsx              # Delivery tracking and management
│   │   ├── order/                    # Menu/ordering page
│   │   │   └── page.tsx              # Product catalog and ordering
│   │   ├── checkout/                 # Checkout flow
│   │   │   ├── page.tsx              # Checkout form
│   │   │   └── checkout.module.css
│   │   ├── order-success/            # Order confirmation
│   │   │   └── page.tsx
│   │   ├── user/                     # User dashboard
│   │   │   ├── page.tsx              # Profile and order history
│   │   │   └── user.module.css
│   │   ├── login-admin/              # Admin login
│   │   │   └── page.tsx
│   │   ├── admin-kitchen-login/      # Kitchen staff login
│   │   │   └── page.tsx
│   │   ├── admin-delivery-login/     # Delivery staff login
│   │   │   └── page.tsx
│   │   ├── dashboard/                # User dashboard
│   │   │   ├── page.tsx
│   │   │   └── dashboard.module.css
│   │   ├── forgot-password/          # Password reset request
│   │   │   ├── page.tsx
│   │   │   └── forgot-password.module.css
│   │   ├── reset-password/           # Password reset form
│   │   │   ├── page.tsx
│   │   │   └── reset-password.module.css
│   │   ├── printer/                  # Thermal printer page
│   │   │   └── page.tsx
│   │   └── api/                      # API Routes
│   │       ├── auth/                 # Authentication endpoints
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── admin-login/route.ts
│   │       │   ├── forgot-password/route.ts
│   │       │   └── reset-password/route.ts
│   │       ├── user/                 # User management
│   │       │   ├── profile/route.ts
│   │       │   ├── orders/route.ts
│   │       │   ├── update-address/route.ts
│   │       │   └── change-password/route.ts
│   │       ├── order/                # Order management
│   │       │   ├── confirm/route.ts
│   │       │   └── details/route.ts
│   │       ├── admin/                # Admin operations
│   │       │   └── products/
│   │       │       ├── route.ts
│   │       │       ├── soft-delete/route.ts
│   │       │       └── restore/route.ts
│   │       ├── kitchen-and-delivery/ # Kitchen & delivery ops
│   │       │   └── route.ts
│   │       ├── delivery/
│   │       │   └── update-eta/route.ts
│   │       ├── printer/              # Printer integration
│   │       │   └── order/route.ts
│   │       ├── auto-accept-orders/   # Auto-accept configuration
│   │       │   └── route.ts
│   │       ├── send-ready-time-email/
│   │       │   └── route.ts
│   │       ├── health/route.ts       # Health check
│   │       └── test-*.ts             # Test endpoints
│   ├── components/                   # React Components
│   │   ├── CartContext.tsx           # Global cart state management
│   │   ├── CartIcon.tsx              # Cart preview in header
│   │   ├── CartModal.tsx             # Item customization modal
│   │   ├── CartSummaryDisplay.tsx    # Cart summary component
│   │   ├── AddressSelectionModal.tsx # Google Maps address selector
│   │   ├── DeliveryAreaMap.tsx       # Delivery coverage map
│   │   ├── NavBar.tsx                # Main navigation
│   │   ├── Footer.tsx                # Site footer
│   │   ├── ConditionalNavBar.tsx     # Conditional nav rendering
│   │   ├── ConditionalFooter.tsx     # Conditional footer rendering
│   │   ├── LayoutContent.tsx         # Layout wrapper
│   │   ├── PaymentForm.tsx           # Payment method selector
│   │   ├── AdminLogin.tsx            # Admin login form
│   │   ├── ProtectedRoute.tsx        # Route protection HOC
│   │   ├── LoadingOverlay.tsx        # Loading state UI
│   │   ├── LoadingContext.tsx        # Loading state context
│   │   ├── LoginIDContext.tsx        # User session context
│   │   ├── AddonSelector.tsx         # Addon selection UI
│   │   ├── DrinksSuggestionBox.tsx   # Beverage suggestions
│   │   ├── DrinksSuggestionModal.tsx # Beverage modal
│   │   ├── ETASelectionModal.tsx     # Delivery time selector
│   │   ├── ImageCarousel.tsx         # Image slider
│   │   ├── TeamCarousel.tsx          # Team member carousel
│   │   └── ImageUpload.tsx           # Image upload component
│   ├── lib/                          # Core libraries
│   │   ├── supabase.ts               # Supabase client
│   │   ├── supabaseAdmin.ts          # Supabase admin client
│   │   └── menuData.ts               # Static menu data
│   ├── server/                       # Server-side services
│   │   └── productService.server.ts  # Product data fetching
│   ├── utils/                        # Utility functions
│   │   ├── auth.ts                   # Authentication helpers
│   │   ├── emailService.ts           # Email sending service
│   │   ├── validation.ts             # Input validation
│   │   ├── errorResponses.ts         # Error response helpers
│   │   ├── globalErrorHandler.ts     # Global error handling
│   │   ├── logger.ts                 # Logging utility
│   │   ├── imageUpload.ts            # Image upload handling
│   │   ├── openingHours.ts           # Operating hours logic
│   │   ├── orderEncryption.ts        # Order ID encryption
│   │   ├── resourceValidator.ts      # Resource validation
│   │   ├── setupSupabaseStorage.ts   # Storage initialization
│   │   ├── ticketGenerator.ts        # Ticket generation
│   │   ├── ticketTemplate.ts         # Thermal printer template
│   │   └── envValidator.ts           # Environment validation
│   ├── styles/                       # CSS Modules
│   │   ├── home.module.css           # Landing page styles
│   │   ├── Footer.module.css         # Footer styles
│   │   └── DeliveryArea.module.css   # Delivery area styles
│   └── types/                        # TypeScript definitions
│       └── google-maps.d.ts          # Google Maps type definitions
├── public/                           # Static assets
│   ├── images/                       # Image files
│   │   └── home/                     # Landing page images
│   │       ├── logo.png
│   │       ├── map-marker.png
│   │       └── right.png
│   ├── favicon.ico
│   └── site.webmanifest
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── next.config.js                    # Next.js configuration
├── postcss.config.js                 # PostCSS configuration
├── README.md                         # This file
├── SUPABASE_SETUP.md                 # Database setup guide
├── GOOGLE_MAPS_SETUP.md              # Maps API setup guide
├── ENVIRONMENT_SETUP.md              # Environment variables guide
└── design-and-colors.txt             # Design system documentation
```

## 🎨 Design System

### Color Palette
- **Primary Red**: `#e11d48` - Urgency, appetite stimulation, CTAs
- **Primary Orange**: `#ff7f11` - Warmth, excitement, highlights
- **Primary Yellow**: `#ffd166` - Happiness, attention-grabbing
- **Primary Blue**: `#1e3a8a` - Trust, professionalism
- **Deep Background**: `#0b1020` - High contrast base
- **Card Background**: `#0f172a` - Content elevation
- **Text Primary**: `#f8fafc` - High readability
- **Text Muted**: `#cbd5e1` - Secondary info

### Design Principles
- **Dopamine-Driven Design**: High contrast, gradient CTAs, visual hierarchy
- **Mobile-First**: Sticky CTAs, touch-friendly, optimized for mobile networks
- **Food Photography Focus**: Real images, hover effects, visual storytelling
- **Pattern Interrupts**: Bold sections, animated elements

### Typography
- **Font Family**: Inter (system fallbacks)
- **Weights**: 400 (normal), 600 (semibold), 700 (bold), 800 (extrabold)
- **Hierarchy**: Clear size progression for optimal readability

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔐 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Server-side validation and sanitization
- **SQL Injection Protection**: Supabase parameterized queries
- **XSS Prevention**: Input sanitization and output encoding
- **CSRF Protection**: Next.js built-in CSRF protection
- **Environment Variables**: Secure storage of sensitive data
- **Service Role Authentication**: Admin operations require service role key
- **Token-Based Auth**: Secure password reset with expiring tokens
- **Guest Order Protection**: Encrypted order IDs for guest access

## 📧 Email System

### Automated Emails
- **Welcome Email**: Sent on user registration
- **Order Confirmation**: Detailed order summary with items and total
- **Order Preparing**: Kitchen started preparing notification
- **Order Ready**: Pickup orders ready for collection
- **Order On The Way**: Delivery orders dispatched
- **Delivery ETA**: Estimated arrival time updates
- **Password Reset**: Secure token-based password recovery

### Email Features
- Bulgarian language localization
- Pizza Stop branding
- Responsive HTML templates
- Order button linking to tracking page
- Professional styling with brand colors

## 🖨️ Thermal Printer Integration

### Printer Specifications
- **Model Support**: Citizen ST-S2010 (and compatible thermal printers)
- **Print Width**: 78mm (approximately 576 pixels)
- **Format**: HTML to thermal format conversion

### Ticket Features
- Order type indicator (ДОСТАВКА/ВЗЕМАНЕ)
- Customer details (name, phone, address)
- Complete item list with customizations
- Addons and special instructions
- Pricing breakdown (subtotal, delivery, service charge, total)
- Payment status and method
- Delivery time and order ID
- Restaurant branding

### Integration
- Automatic ticket generation on order confirmation
- Web-based printer page for easy printing
- Support for custom printer commands
- Error handling and fallback options

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin authentication
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Management
- `GET /api/user/profile` - Fetch user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/change-password` - Change password
- `PUT /api/user/update-address` - Update delivery address
- `GET /api/user/orders` - Fetch order history

### Order Management
- `POST /api/order/confirm` - Confirm and place order
- `GET /api/order/details` - Fetch order details

### Admin Operations
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products` - Update product
- `DELETE /api/admin/products` - Delete product
- `POST /api/admin/products/soft-delete` - Soft delete product
- `POST /api/admin/products/restore` - Restore deleted product

### Kitchen & Delivery
- `GET /api/kitchen-and-delivery` - Fetch orders for kitchen/delivery
- `PUT /api/delivery/update-eta` - Update delivery ETA
- `POST /api/send-ready-time-email` - Send ready notification

### System
- `GET /api/health` - Health check endpoint
- `GET /api/test-db` - Database connection test
- `POST /api/test-email` - Email service test
- `POST /api/auto-accept-orders` - Configure auto-accept

### Printer
- `GET /api/printer/order` - Generate printer ticket

## 🧪 Testing

### Test Scripts
```bash
# Test database connection
node test-db.js

# Test authentication flow
node test-auth.js

# Simple functionality test
node test-simple.js

# Check database columns
node check-columns.js
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Guest checkout flow
- [ ] Product browsing and filtering
- [ ] Cart management (add, remove, update)
- [ ] Address selection with Google Maps
- [ ] Payment method selection
- [ ] Order placement and confirmation
- [ ] Email delivery (all types)
- [ ] Admin product management
- [ ] Kitchen order processing
- [ ] Delivery tracking and updates
- [ ] Thermal printer ticket generation
- [ ] Password reset flow
- [ ] Responsive design on mobile/tablet/desktop

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Supabase database schema deployed
- [ ] Supabase Storage buckets created
- [ ] Google Maps API key with domain restrictions
- [ ] Gmail app password generated
- [ ] Build passes without errors
- [ ] All test endpoints removed or secured
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] SEO meta tags added
- [ ] Analytics integrated (optional)
- [ ] Error monitoring configured (optional)

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Recommended Hosting
- **Vercel** - Optimal for Next.js (recommended)
- **Netlify** - Good alternative
- **Self-hosted** - Node.js server required

## 🎯 Business Features

### Conversion Optimization
- Clear, action-oriented CTAs throughout
- Mobile-optimized sticky order button
- One-click phone call functionality
- Fast loading times (< 3 seconds)
- Simplified checkout flow
- Guest checkout option
- Smart drink suggestions to increase order value

### Customer Experience
- Real-time order tracking
- Multiple payment options
- Flexible delivery and pickup options
- Order history and reordering
- Address saving for faster checkout
- Email notifications at each order stage
- Special instructions field for customization

### Restaurant Operations
- **Kitchen Dashboard**: Clear order queue with preparation status
- **Delivery Dashboard**: Route optimization and driver management
- **Admin Panel**: Complete control over menu, pricing, and operations
- **Analytics**: Track daily revenue, order counts, and trends
- **Auto-Accept**: Automatically confirm orders during busy periods
- **Operating Hours**: Dynamic hours with holiday schedule
- **Thermal Printing**: Instant kitchen ticket printing

## 🔧 Configuration

### Opening Hours
Configured in `src/utils/openingHours.ts`:
- Set weekly operating hours
- Define holiday schedules
- Configure closure dates
- Customize time zones

### Delivery Area
Configured in `src/components/DeliveryAreaMap.tsx`:
- Define delivery polygon coordinates
- Set restaurant location marker
- Customize map styling

### Product Types
Database reference values:
- 1: Pizza
- 2: Burger
- 3: Beverage
- 4: Addon

### Order Statuses
- 1: Нова поръчка (New Order)
- 2: Потвърдена (Confirmed)
- 3: Приготвя се (Preparing)
- 4: Готова за вземане (Ready for Pickup)
- 5: В доставка (Out for Delivery)
- 6: Доставена (Delivered)
- 7: Завършена (Completed)
- 8: Отказана (Cancelled)

### Order Types
- 1: Restaurant Collection (Pickup)
- 2: Delivery

## 🐛 Troubleshooting

### Common Issues

**500 Internal Server Error**
- Check `.env.local` file exists
- Verify Supabase credentials are correct
- Ensure database schema is deployed
- Check server logs for detailed errors

**Google Maps Not Loading**
- Verify API key is correct
- Check Maps JavaScript API is enabled
- Confirm Geocoding API is enabled
- Review API key restrictions

**Emails Not Sending**
- Verify Gmail app password (not regular password)
- Check 2FA is enabled on Gmail account
- Confirm EMAIL_USER and EMAIL_PASS are set
- Test with `/api/test-email` endpoint

**Images Not Uploading**
- Check Supabase Storage bucket exists
- Verify bucket permissions (public access)
- Confirm SUPABASE_SERVICE_ROLE_KEY is set
- Check file size limits

**Thermal Printer Not Working**
- Verify printer is connected and powered on
- Check printer page URL is accessible
- Test with sample order
- Review printer specifications match template

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributors

Pizza Stop Development Team

## 📧 Support

For issues, questions, or support:
- Open an issue on GitHub
- Email: support@pizza-stop.bg (if applicable)

## 🎉 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Vercel** - Excellent hosting platform
- **Supabase** - Backend-as-a-Service platform
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautiful icon library

---

**Built with ❤️ and 🍕 in Lovech, Bulgaria**
