'use client'

import { useState, useEffect, useRef } from 'react'

// Extend the global Event interface to include InputEvent
declare global {
  interface Event {
    inputType?: string
  }
}
import { ArrowLeft, MapPin, User, Phone, CreditCard, Banknote, Clock, Calendar, LogIn, UserCheck, MessageSquare, RotateCcw, Database, Navigation, FileText, Map, CheckCircle, XCircle, Info, AlertTriangle, Lightbulb, Home, ShoppingCart, Pizza, Search, ClipboardList, Edit, Target, AlertCircle, HelpCircle, Truck, Store } from 'lucide-react'
import { useCart } from '../../components/CartContext'
import AddressSelectionModal from '../../components/AddressSelectionModal'
import { isRestaurantOpen } from '../../utils/openingHours'
import { useLoginID } from '../../components/LoginIDContext'

interface CustomerInfo {
  name: string
  phone: string
  address: string
  coordinates: { lat: number; lng: number } | null
  exactLocation: { lat: number; lng: number } | null
}

interface OrderTime {
  type: 'immediate' | 'scheduled' | null
  scheduledTime?: Date
}



type PaymentMethod = 'online' | 'card' | 'cash'
type OrderType = 'guest' | 'user'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart, getItemTotalPrice } = useCart()
  const { user, isAuthenticated, updateUser } = useLoginID()
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    coordinates: null,
    exactLocation: null
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online')
  const [orderTime, setOrderTime] = useState<OrderTime>({ type: null })
  const [orderType, setOrderType] = useState<OrderType>('guest')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCartLoading, setIsCartLoading] = useState(true)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [addressZone, setAddressZone] = useState<'yellow' | 'blue' | 'outside' | null>(null)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [isCollection, setIsCollection] = useState(false)
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load Google Maps script for autocomplete
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeAutocomplete
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])



  // Initialize scheduled time when switching to scheduled order
  useEffect(() => {
    if (orderTime.type === 'scheduled' && !orderTime.scheduledTime) {
      // Set default time to next available slot (next hour, minimum 11:00)
      const now = new Date()
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000) // Next hour
      
      // Ensure it's within business hours
      let scheduledTime = nextHour
      if (scheduledTime.getHours() < 11) {
        scheduledTime.setHours(11, 0, 0, 0)
      } else if (scheduledTime.getHours() >= 23) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
        scheduledTime.setHours(11, 0, 0, 0)
      }
      
      setOrderTime(prev => ({ ...prev, scheduledTime }))
    }
  }, [orderTime.type])

  // Check user authentication and load user data
  useEffect(() => {
    if (user && isAuthenticated) {
      console.log('🔄 User authenticated, user data available for profile orders')
      console.log('📊 Full user object from database:', user)
      console.log('📍 Address field specifically:', user.LocationText || 'NOT SET')
      console.log('📝 Delivery instructions field specifically:', user.addressInstructions || 'NOT SET')
      console.log('🗺️ Coordinates field specifically:', user.LocationCoordinates || 'NOT SET')
      
      // Only set order type to user if we have meaningful data, but don't auto-fill
      if (user.name || user.phone || user.LocationText) {
        setOrderType('user')
        console.log('✅ Set default order type to: user (profile available)')
        // Fill form with profile data when order type defaults to user
        fillFormWithProfileData()
      }
    } else {
      console.log('❌ User not authenticated or user data not available:', { user, isAuthenticated })
      // Default to guest for non-authenticated users
      setOrderType('guest')
    }
  }, [user, isAuthenticated])

  // Also check auth when user changes (for debugging)
  useEffect(() => {
    console.log('🔄 user changed:', user)
  }, [user])

  // Also check auth when customerInfo changes (for debugging)
  useEffect(() => {
    console.log('🔄 customerInfo state updated:', customerInfo)
    console.log('📋 Final form values after database data load:')
    console.log('  - Name:', customerInfo.name || 'EMPTY')
    console.log('  - Phone:', customerInfo.phone || 'EMPTY')
    console.log('  - Address:', customerInfo.address || 'EMPTY')
    console.log('  - Coordinates:', customerInfo.coordinates || 'EMPTY')
    console.log('  - Delivery Instructions:', deliveryInstructions || 'EMPTY')
  }, [customerInfo, deliveryInstructions])

  // Re-check auth when returning from login (e.g., when returnUrl is present)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const returnUrl = urlParams.get('returnUrl')
      if (returnUrl) {
        // Clear the returnUrl from the URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      }
    }
  }, [])

  // Set cart loading to false after a short delay to prevent showing empty cart initially
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCartLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Validate address zone when coordinates change
  useEffect(() => {
    console.log('🔄 Coordinates changed, validating zone:', customerInfo.coordinates)
    validateAddressZone(customerInfo.coordinates)
  }, [customerInfo.coordinates])

  // Recalculate delivery cost when total price changes
  useEffect(() => {
    if (addressZone) {
      const cost = calculateDeliveryCost(totalPrice, addressZone, isCollection)
      setDeliveryCost(cost || 0)
    }
  }, [totalPrice, addressZone, isCollection])

  // Validate address zone when user data is loaded and order type is 'user'
  useEffect(() => {
    console.log('👤 User data effect triggered:', { orderType, user: !!user, hasCoordinates: !!user?.LocationCoordinates })
    
    if (orderType === 'user' && user && user.LocationCoordinates) {
      try {
        const coordinates = typeof user.LocationCoordinates === 'string' 
          ? JSON.parse(user.LocationCoordinates)
          : user.LocationCoordinates
        
        console.log('📍 Parsed user coordinates:', coordinates)
        
        if (coordinates && coordinates.lat && coordinates.lng) {
          console.log('✅ User data loaded, validating address zone:', coordinates)
          validateAddressZone(coordinates)
        } else {
          console.log('❌ Invalid user coordinates structure:', coordinates)
        }
      } catch (error) {
        console.warn('❌ Failed to parse user coordinates for validation:', user.LocationCoordinates, error)
      }
    }
  }, [user, orderType])



  const initializeAutocomplete = () => {
    if (!addressInputRef.current || !window.google?.maps?.places) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'bg' }, // Restrict to Bulgaria
      fields: ['formatted_address', 'geometry', 'place_id']
    })

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      console.log('🏠 Place selected from autocomplete:', place)
      
      if (place.geometry && place.geometry.location) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
        
        console.log('📍 Coordinates from autocomplete:', coordinates)
        
        setCustomerInfo(prev => ({
          ...prev,
          address: place.formatted_address || '',
          coordinates
        }))
      } else {
        console.log('❌ No geometry/location found in place:', place)
      }
    })

    setAutocomplete(autocompleteInstance as any)
  }


  const handleAddressChange = (address: string) => {
    setCustomerInfo(prev => ({ ...prev, address }))
    // Clear coordinates and reset confirmation when address is manually changed
    if (customerInfo.coordinates) {
      setCustomerInfo(prev => ({ ...prev, coordinates: null, exactLocation: null }))
    }
    setAddressConfirmed(false)
  }


  const handleCoordinatesSelect = (coordinates: { lat: number; lng: number }) => {
    setCustomerInfo(prev => ({ ...prev, coordinates }))
    // Auto-confirm address when coordinates are selected
    validateAddressZone(coordinates)
    setAddressConfirmed(true)
  }

  const handleExactLocationSelect = (exactLocation: { lat: number; lng: number }) => {
    setCustomerInfo(prev => ({ ...prev, exactLocation }))
    // Auto-confirm address when exact location is selected
    if (exactLocation) {
      validateAddressZone(exactLocation)
      setAddressConfirmed(true)
    }
  }


    // Delivery cost calculation and address validation
  const calculateDeliveryCost = (orderTotal: number, zone: 'yellow' | 'blue' | 'outside' | null, isCollectionOrder: boolean = false) => {
    // No delivery cost for collection orders
    if (isCollectionOrder) {
      return 0
    }
    
    if (!zone || zone === 'outside') {
      return null // No delivery outside blue zone
    }
    
    // Minimum order of 15 BGN
    if (orderTotal < 15) {
      return null // Order too small
    }
    
    // Delivery cost by zone (always charge delivery cost regardless of order total)
    switch (zone) {
      case 'yellow':
        return 3
      case 'blue':
        return 7
      default:
        return null
    }
  }

  // Haversine formula to calculate distance between two points on Earth
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in kilometers
    return distance
  }

  // Point-in-polygon function to check if coordinates are within a polygon
  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
          (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
        inside = !inside
      }
    }
    return inside
  }

  const validateAddressZone = (coordinates: { lat: number; lng: number } | null) => {
    console.log('🔍 validateAddressZone called with coordinates:', coordinates)
    
    if (!coordinates) {
      console.log('❌ No coordinates provided, setting zone to null')
      setAddressZone(null)
      setDeliveryCost(0)
      setAddressConfirmed(false)
      return
    }

    if (!coordinates.lat || !coordinates.lng) {
      console.log('❌ Invalid coordinates (missing lat/lng):', coordinates)
      setAddressZone(null)
      setDeliveryCost(0)
      setAddressConfirmed(false)
      return
    }

    // Define Lovech city area (3 BGN delivery) - Yellow zone
    const lovechArea = [
      { lat: 43.1500, lng: 24.6800 }, // North
      { lat: 43.1550, lng: 24.7200 }, // Northeast
      { lat: 43.1450, lng: 24.7500 }, // East
      { lat: 43.1300, lng: 24.7500 }, // Southeast
      { lat: 43.1200, lng: 24.7200 }, // South
      { lat: 43.1250, lng: 24.6800 }, // Southwest
      { lat: 43.1350, lng: 24.6500 }, // West
      { lat: 43.1500, lng: 24.6800 }  // Back to start
    ]
    
    // Define extended area (7 BGN delivery) - Blue zone
    // Updated polygon coordinates for blue zone
    const extendedArea = [
      { lat: 43.19740, lng: 24.67377 },
      { lat: 43.19530, lng: 24.68420 },
      { lat: 43.18795, lng: 24.69091 },
      { lat: 43.18184, lng: 24.69271 },
      { lat: 43.16906, lng: 24.70673 },
      { lat: 43.18185, lng: 24.73747 },
      { lat: 43.19690, lng: 24.78520 },
      { lat: 43.19429, lng: 24.78849 },
      { lat: 43.19177, lng: 24.79354 },
      { lat: 43.18216, lng: 24.77405 },
      { lat: 43.15513, lng: 24.78379 },
      { lat: 43.14733, lng: 24.78212 },
      { lat: 43.14837, lng: 24.76925 },
      { lat: 43.14629, lng: 24.74900 },
      { lat: 43.13578, lng: 24.74945 },
      { lat: 43.12876, lng: 24.76489 },
      { lat: 43.12203, lng: 24.75945 },
      { lat: 43.11969, lng: 24.76062 },
      { lat: 43.10933, lng: 24.75319 },
      { lat: 43.10442, lng: 24.75046 },
      { lat: 43.09460, lng: 24.75211 },
      { lat: 43.09237, lng: 24.74715 },
      { lat: 43.09868, lng: 24.73602 },
      { lat: 43.10296, lng: 24.72085 },
      { lat: 43.10702, lng: 24.70585 },
      { lat: 43.11009, lng: 24.70742 },
      { lat: 43.11222, lng: 24.71048 },
      { lat: 43.12163, lng: 24.70547 },
      { lat: 43.12097, lng: 24.67849 },
      { lat: 43.14318, lng: 24.67233 },
      { lat: 43.15453, lng: 24.68183 },
      { lat: 43.15655, lng: 24.68643 },
      { lat: 43.16302, lng: 24.69263 },
      { lat: 43.17894, lng: 24.67871 },
      { lat: 43.17927, lng: 24.65107 },
      { lat: 43.18665, lng: 24.64179 },
      { lat: 43.19006, lng: 24.64309 },
      { lat: 43.19788, lng: 24.64881 }
    ]
    
    console.log('📍 User coordinates:', coordinates)
    console.log('📍 Lovech area polygon:', lovechArea)
    console.log('📍 Extended area polygon:', extendedArea)
    
    let zone: 'yellow' | 'blue' | 'outside' | null = null
    
    // Check if point is in Lovech city area (yellow zone - 3 BGN)
    if (isPointInPolygon(coordinates, lovechArea)) {
      zone = 'yellow'
      console.log('🟡 Zone: YELLOW (Lovech city area - 3 BGN)')
    }
    // Check if point is in extended area (blue zone - 7 BGN)
    else if (isPointInPolygon(coordinates, extendedArea)) {
      zone = 'blue'
      console.log('🔵 Zone: BLUE (Extended area - 7 BGN)')
    }
    // Point is outside both areas
    else {
      zone = 'outside'
      console.log('🔴 Zone: OUTSIDE (No delivery available)')
    }

    console.log('✅ Setting zone to:', zone)
    setAddressZone(zone)
    
    // Calculate delivery cost
    const cost = calculateDeliveryCost(totalPrice, zone, isCollection)
    console.log('💰 Delivery cost calculated:', cost)
    setDeliveryCost(cost || 0)
  }

  const confirmAddress = async () => {
    console.log('🔍 Confirming address:', customerInfo.address)
    
    if (!customerInfo.address) {
      alert('❌ Моля, въведете адрес преди да го потвърдите')
          return
        }
        
    // If we already have coordinates, validate them
    if (customerInfo.coordinates) {
      console.log('✅ Address already has coordinates, validating zone')
      validateAddressZone(customerInfo.coordinates)
      setAddressConfirmed(true)
      return
    }

    // Try to geocode the address to get coordinates
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder()
      
      geocoder.geocode({ address: customerInfo.address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location
          const coordinates = {
            lat: location.lat(),
            lng: location.lng()
          }
          
          console.log('✅ Address geocoded successfully:', coordinates)
          
          // Update customer info with coordinates
          setCustomerInfo(prev => ({
            ...prev,
            coordinates
          }))
          
          // Validate the zone
          validateAddressZone(coordinates)
          setAddressConfirmed(true)
          
          alert('✅ Адресът е потвърден успешно!')
        } else {
          console.log('❌ Failed to geocode address:', status)
          setAddressConfirmed(false)
          alert('❌ Не може да се намери адресът. Моля, проверете адреса или използвайте "Избери точна локация"')
        }
      })
    } else {
      console.log('❌ Google Maps not loaded')
      setAddressConfirmed(false)
      alert('❌ Google Maps не е зареден. Моля, опитайте отново.')
    }
  }


  const handleLogin = async () => {
    setIsLoading(true)
    try {
      // Redirect to user page with return URL to checkout
      const currentUrl = encodeURIComponent(window.location.href)
      window.location.href = `/user?returnUrl=${currentUrl}`
    } catch (error) {
      console.error('Error redirecting to user page:', error)
      setIsLoading(false)
    }
  }

  const clearFormFields = () => {
    setCustomerInfo({
      name: '',
      phone: '',
      address: '',
      coordinates: null,
      exactLocation: null
    })
    setDeliveryInstructions('')
  }

  const fillFormWithProfileData = () => {
    if (user) {
      const updates: Partial<CustomerInfo> = {}
      
      if (user.name) {
        updates.name = user.name
      }
      if (user.phone) {
        updates.phone = user.phone
      }
      if (user.LocationText) {
        updates.address = user.LocationText
      }
      if (user.LocationCoordinates) {
        try {
          const coordinates = typeof user.LocationCoordinates === 'string' 
            ? JSON.parse(user.LocationCoordinates)
            : user.LocationCoordinates
          updates.coordinates = coordinates
          
          // Validate address zone immediately when coordinates are loaded
          if (coordinates && coordinates.lat && coordinates.lng) {
            console.log('Validating address zone for user profile coordinates:', coordinates)
            validateAddressZone(coordinates)
          }
        } catch (error) {
          console.warn('Failed to parse coordinates:', user.LocationCoordinates)
        }
      }
      
      setCustomerInfo(prev => ({
        ...prev,
        ...updates
      }))
      
      if (user.addressInstructions) {
        setDeliveryInstructions(user.addressInstructions)
      }
    }
  }

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type)
    
    if (type === 'guest') {
      clearFormFields()
    } else if (type === 'user' && user) {
      fillFormWithProfileData()
    }
  }

  // Form validation logic
  const isFormValid = customerInfo.name && customerInfo.phone && 
    orderTime.type !== null &&
    (orderTime.type === 'immediate' || (orderTime.type === 'scheduled' && orderTime.scheduledTime)) &&
    orderType &&
    paymentMethodId !== null && // Payment method must be selected
    totalPrice >= 15 && // Minimum order amount
    (
      isCollection || // Collection orders don't need address validation
      (customerInfo.address && customerInfo.coordinates && addressConfirmed && addressZone !== 'outside' && deliveryCost !== null)
    ) // Delivery orders need full address validation

  const handleSubmit = async (e: React.FormEvent) => {
    try{
    e.preventDefault()
    
    // Validate minimum order amount
    if (totalPrice < 15) {
      alert('❌ Минималната сума за поръчка е 15 лв.')
      return
    }
     
     // Validate address zone (only for delivery orders)
     if (!isCollection && addressZone === 'outside') {
       alert('❌ Доставката не е възможна на този адрес. Моля, изберете адрес в зоната за доставка.')
       return
     }
     
     // Validate delivery cost (only for delivery orders)
     if (!isCollection && deliveryCost === null) {
       alert('❌ Не може да се изчисли цената за доставка. Моля, проверете адреса.')
       return
     }
     
     // Validate payment method
     if (paymentMethodId === null) {
       alert('❌ Моля, изберете начин на плащане.')
       return
     }
     
     // Validate scheduled order time
     if (orderTime.type === 'scheduled' && orderTime.scheduledTime) {
       const now = new Date()
       const scheduledTime = orderTime.scheduledTime
       
       // Check if scheduled time is in the future
       if (scheduledTime <= now) {
         alert('❌ Моля, изберете бъдещо време за поръчката')
         return
       }
       
       // Check if within 72 hours
       const timeDiff = scheduledTime.getTime() - now.getTime()
       const hoursDiff = timeDiff / (1000 * 60 * 60)
       
       if (hoursDiff > 72) {
         alert('❌ Поръчките могат да се правят максимум 72 часа напред')
         return
       }
       
       // Check if within business hours (11:00-23:00)
       const hour = scheduledTime.getHours()
       if (hour < 11 || hour >= 23) {
         alert('❌ Моля, изберете време между 11:00 и 23:00')
         return
       }
     }
     
     // If user is logged in and using user profile, save updated info
     if (orderType === 'user' && user) {
       try {
         // Update user data in the context
         updateUser({
           name: customerInfo.name,
           phone: customerInfo.phone,
           LocationText: customerInfo.address,
           LocationCoordinates: customerInfo.coordinates ? JSON.stringify(customerInfo.coordinates) : undefined
         })
       } catch (error) {
         console.error('Error updating user profile:', error)
         // Don't block the order if profile update fails
       }
     }
     
     // Handle order submission
     const finalTotal = totalPrice + (isCollection ? 0 : deliveryCost)
     
     console.log('📦 Order details:', {
       customerInfo, 
       orderItems: items,
       orderTime, 
       orderType,
       deliveryCost: isCollection ? 0 : deliveryCost,
       totalPrice,
       finalTotal,
       addressZone,
       isCollection,
       paymentMethodId
     })
     
     // Prepare order data for API
     const orderData = {
       customerInfo: {
         ...customerInfo,
         email: (customerInfo as any).email || `guest_${Date.now()}@pizza-stop.bg`
       },
       orderItems: items,
       orderTime,
       orderType,
       deliveryCost: isCollection ? 0 : deliveryCost,
       totalPrice,
       isCollection,
       paymentMethodId,
       loginId: user?.id || null
     }
     
     // Call order confirmation API
     const response = await fetch('/api/order/confirm', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(orderData)
     })
     
     const result = await response.json()
     
     if (response.ok) {
       // Show success message based on order type
       if (orderTime.type === 'immediate') {
         alert(`✅ Поръчката е приета успешно! Номер: ${result.orderId}. Ще започнем да я приготвяме веднага.`)
       } else {
         const scheduledDate = orderTime.scheduledTime?.toLocaleDateString('bg-BG')
         const scheduledTime = orderTime.scheduledTime?.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
         alert(`✅ Поръчката е приета успешно за ${scheduledDate} в ${scheduledTime}! Номер: ${result.orderId}. Ще се свържем с вас за потвърждение.`)
       }
       
       // Clear the cart after successful order
       clearCart()
       
       // Redirect to order success page
       window.location.href = `/order-success?orderId=${result.orderId}`
     } else {
       throw new Error(result.error || 'Failed to confirm order')
     }
   } catch (error) {
     console.error('Order submission error:', error)
     alert('❌ Възникна грешка при потвърждаване на поръчката.')
   } finally {
     setIsLoading(false)
   }
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5">
      {/* Header */}
      <div className="bg-card border-b border-white/12 sticky top-0 z-30">
        <div className="container py-4">
          <div className="flex items-center space-x-4">
            <a href="/order" className="p-2 rounded-lg border border-white/12 text-muted hover:text-text transition-colors">
              <ArrowLeft size={20} />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-text">Оформляване на поръчка</h1>
              <p className="text-muted">Попълнете данните за доставка</p>
            </div>
          </div>
        </div>
      </div>

             <div className="container py-8">
         <div className="max-w-2xl mx-auto space-y-8">
           
           
           {/* Order Summary */}
           <div className="bg-card border border-white/12 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-text mb-4">Обобщение на поръчката</h2>
             
             {isCartLoading ? (
               <div className="text-center py-8">
                 <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-muted">Зареждане на поръчката...</p>
               </div>
             ) : items.length === 0 ? (
                             <div className="text-center py-8">
                <ShoppingCart size={64} className="mx-auto mb-4 text-muted" />
                <p className="text-muted text-lg mb-4">Количката е празна</p>
                 <p className="text-sm text-muted mb-6">Моля, добавете продукти от менюто преди да продължите</p>
                 <div className="space-y-3">
                                     <a
                    href="/order"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-red to-orange text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
                  >
                    <Pizza size={20} />
                    <span>Отиди към менюто</span>
                  </a>
                   <br />
                                     <a
                    href="/"
                    className="inline-flex items-center space-x-2 bg-white/8 hover:bg-white/12 text-text px-6 py-3 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
                  >
                    <Home size={20} />
                    <span>Назад към началната страница</span>
                  </a>
                 </div>
               </div>
             ) : (
              <>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="p-3 bg-white/6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{item.image}</div>
                          <div>
                            <h4 className="font-medium text-text">{item.name}</h4>
                            <p className="text-sm text-muted">
                              {item.size} • {item.quantity}x
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-orange">{getItemTotalPrice(item).toFixed(2)} лв.</p>
                      </div>
                      
                      {/* Display addons if any */}
                      {item.addons && item.addons.length > 0 && (
                        <div className="mt-3 pl-11">
                          <div className="space-y-1">
                            {/* Sauces */}
                            {item.addons.filter(addon => addon.AddonType === 'sauce').length > 0 && (
                              <div>
                                <p className="text-xs text-muted font-medium mb-1">Сосове:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.addons
                                    .filter(addon => addon.AddonType === 'sauce')
                                    .map((addon, addonIndex) => (
                                      <span 
                                        key={addonIndex}
                                        className="text-xs bg-green/20 text-green px-2 py-1 rounded-md"
                                      >
                                        {addon.Name}
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} лв.)`}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Vegetables */}
                            {item.addons.filter(addon => addon.AddonType === 'vegetable').length > 0 && (
                              <div>
                                <p className="text-xs text-muted font-medium mb-1">Зеленчуци:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.addons
                                    .filter(addon => addon.AddonType === 'vegetable')
                                    .map((addon, addonIndex) => (
                                      <span 
                                        key={addonIndex}
                                        className="text-xs bg-emerald/20 text-emerald px-2 py-1 rounded-md"
                                      >
                                        {addon.Name}
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} лв.)`}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Meat */}
                            {item.addons.filter(addon => addon.AddonType === 'meat').length > 0 && (
                              <div>
                                <p className="text-xs text-muted font-medium mb-1">Месо:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.addons
                                    .filter(addon => addon.AddonType === 'meat')
                                    .map((addon, addonIndex) => (
                                      <span 
                                        key={addonIndex}
                                        className="text-xs bg-red/20 text-red px-2 py-1 rounded-md"
                                      >
                                        {addon.Name}
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} лв.)`}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Other addons */}
                            {item.addons.filter(addon => !['sauce', 'vegetable', 'meat'].includes(addon.AddonType)).length > 0 && (
                              <div>
                                <p className="text-xs text-muted font-medium mb-1">Други:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.addons
                                    .filter(addon => !['sauce', 'vegetable', 'meat'].includes(addon.AddonType))
                                    .map((addon, addonIndex) => (
                                      <span 
                                        key={addonIndex}
                                        className="text-xs bg-orange/20 text-orange px-2 py-1 rounded-md"
                                      >
                                        {addon.Name}
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} лв.)`}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Display comment if any */}
                      {item.comment && (
                        <div className="mt-2 pl-11">
                          <p className="text-xs text-muted">
                            <span className="font-medium">Коментар:</span> {item.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                                 <div className="border-t border-white/12 mt-4 pt-4">
                   {/* Order Time Info */}
                   <div className="flex items-center justify-between text-sm text-muted mb-3">
                     <span>Време за поръчка:</span>
                     <span className="text-white">
                                             {orderTime.type === null ? (
                        <span className="text-white flex items-center gap-1">
                          <HelpCircle size={16} />
                          Не е избрано
                        </span>
                      ) : orderTime.type === 'immediate' ? (
                        <span className="text-white flex items-center gap-1">
                          <Clock size={16} />
                          Веднага
                        </span>
                      ) : (
                        <span className="text-white flex items-center gap-1">
                          <Calendar size={16} />
                          {orderTime.scheduledTime?.toLocaleDateString('bg-BG')} в {orderTime.scheduledTime?.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                     </span>
                   </div>
                   
                   <div className="flex items-center justify-between text-lg font-bold">
                     <span>Обща сума:</span>
                     <span className="text-white">{totalPrice.toFixed(2)} лв.</span>
                   </div>
                 </div>
              </>
            )}
          </div>

          {/* Order Time Selection */}
          <div className="bg-card border border-white/12 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text mb-4">
              <Clock size={20} className="inline mr-2" />
              Време за поръчка *
            </h2>
            {orderTime.type === null && (
              <div className="mb-4 p-3 bg-orange/10 border border-orange/20 rounded-xl text-sm text-orange flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>Моля, изберете кога искате да получите поръчката</span>
              </div>
            )}
            <div className="space-y-3">
              {/* Immediate Order - Always visible but disabled when store is closed */}
              <label className={`flex items-center space-x-3 p-3 border rounded-xl transition-colors ${
                isRestaurantOpen()
                  ? 'bg-white/6 border-white/12 cursor-pointer hover:bg-white/10'
                  : 'bg-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-60'
              }`}>
                <input
                  type="radio"
                  name="orderTime"
                  value="immediate"
                  checked={orderTime.type === 'immediate'}
                  onChange={() => isRestaurantOpen() && setOrderTime({ type: 'immediate' })}
                  disabled={!isRestaurantOpen()}
                  className="text-orange focus:ring-orange disabled:opacity-50"
                />
                <Clock size={20} className="text-orange" />
                <div className="flex-1">
                  <span className="font-medium">Веднага</span>
                  <p className="text-sm text-muted">
                    {isRestaurantOpen() 
                      ? 'Поръчката ще бъде приготвена веднага'
                      : 'Ресторантът е затворен в момента'
                    }
                  </p>
                </div>
              </label>

              {/* Scheduled Order - Always available */}
              <label className="flex items-center space-x-3 p-3 bg-white/6 border border-white/12 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name="orderTime"
                  value="scheduled"
                  checked={orderTime.type === 'scheduled'}
                  onChange={() => setOrderTime({ type: 'scheduled' })}
                  className="text-orange focus:ring-orange"
                />
                <Calendar size={20} className="text-orange" />
                <div className="flex-1">
                  <span className="font-medium">Поръчай за по-късно</span>
                  <p className="text-sm text-muted">Избери време за доставка (до 72 часа напред)</p>
                </div>
              </label>

              {/* Date and Time Picker for Scheduled Orders */}
              {orderTime.type === 'scheduled' && (
                <div className="p-4 bg-white/6 border border-white/12 rounded-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        Дата:
                      </label>
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => {
                          // Focus and click the input to open the date picker
                          const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
                          if (dateInput) {
                            dateInput.focus()
                            if (dateInput.showPicker) {
                              dateInput.showPicker()
                            } else {
                              dateInput.click()
                            }
                          }
                        }}
                      >
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          value={orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value)
                            if (isNaN(selectedDate.getTime())) return
                            
                            const currentTime = orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime : new Date()
                          selectedDate.setHours(currentTime.getHours())
                          selectedDate.setMinutes(currentTime.getMinutes())
                          setOrderTime(prev => ({ ...prev, scheduledTime: selectedDate }))
                        }}
                          className="w-full p-4 bg-white/8 border border-white/20 rounded-xl text-text focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-none transition-all cursor-pointer"
                        required
                          onKeyDown={(e) => {
                            // Allow arrow keys, tab, enter, and escape for navigation
                            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape'].includes(e.key)) {
                              return
                            }
                            // Prevent typing in the date input
                            e.preventDefault()
                          }}
                          onInput={(e) => {
                            // Prevent manual text input but allow programmatic changes
                            if ((e.nativeEvent as any).inputType === 'insertText') {
                              e.preventDefault()
                            }
                          }}
                        />
                        {/* Calendar icon overlay */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Calendar size={20} className="text-orange" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text mb-3 flex items-center gap-2">
                        <Clock size={16} />
                        Час:
                      </label>
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => {
                          // Focus and click the input to open the time picker
                          const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement
                          if (timeInput) {
                            timeInput.focus()
                            if (timeInput.showPicker) {
                              timeInput.showPicker()
                            } else {
                              timeInput.click()
                            }
                          }
                        }}
                      >
                      <input
                        type="time"
                        min="11:00"
                        max="23:00"
                        step="300"
                          value={orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime.toTimeString().slice(0, 5) : ''}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number)
                          
                          // Validate hours are within business hours (11-23)
                          if (hours < 11 || hours >= 23) {
                            alert('Моля, изберете време между 11:00 и 23:00')
                            return
                          }
                          
                            const currentDate = orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime : new Date()
                          currentDate.setHours(hours, minutes, 0, 0)
                          setOrderTime(prev => ({ ...prev, scheduledTime: currentDate }))
                        }}
                          className="w-full p-4 bg-white/8 border border-white/20 rounded-xl text-text focus:border-orange focus:ring-2 focus:ring-orange/20 focus:outline-none transition-all cursor-pointer"
                        required
                          onKeyDown={(e) => {
                            // Allow arrow keys, tab, enter, and escape for navigation
                            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape'].includes(e.key)) {
                              return
                            }
                            // Prevent typing in the time input
                            e.preventDefault()
                          }}
                          onInput={(e) => {
                            // Prevent manual text input but allow programmatic changes
                            if ((e.nativeEvent as any).inputType === 'insertText') {
                              e.preventDefault()
                            }
                          }}
                        />
                        {/* Clock icon overlay */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Clock size={20} className="text-orange" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted flex items-center gap-2">
                    <Lightbulb size={14} className="text-blue" />
                    <span>Работно време: 11:00 - 23:00. Поръчките могат да се правят до 72 часа напред.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

                     {/* Order Type Selection */}
           <div className="bg-card border border-white/12 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-text mb-4">Начин на поръчка</h2>
             
             {user ? (
               // User is logged in
               <div className="space-y-4">
                                   <div className="flex items-center space-x-3 p-4 bg-green/10 border border-green/20 rounded-xl">
                    <UserCheck size={24} className="text-green" />
                    <div className="flex-1">
                      <h3 className="font-medium text-text">Поръчка като регистриран потребител</h3>
                      <p className="text-sm text-muted">Здравейте, {user.name}!</p>
                    </div>
                                       
                  </div>
                 
                 <div className="flex space-x-3">
                                     <button
                    type="button"
                    onClick={() => handleOrderTypeChange('user')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      orderType === 'user'
                        ? 'bg-gradient-to-r from-green to-emerald text-white shadow-lg'
                        : 'bg-white/6 border border-white/12 text-text hover:bg-white/10'
                    }`}
                  >
                    <UserCheck size={20} className="inline mr-2" />
                    Използвай профила
                  </button>
                   
                   <button
                     type="button"
                     onClick={() => handleOrderTypeChange('guest')}
                     className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                       orderType === 'guest'
                         ? 'bg-gradient-to-r from-orange to-red text-white shadow-lg'
                         : 'bg-white/6 border border-white/12 text-text hover:bg-white/10'
                     }`}
                   >
                     <User size={20} className="inline mr-2" />
                     Поръчай като гост
                   </button>
                 </div>
               </div>
             ) : (
               // User is not logged in
               <div className="space-y-4">
                 <div className="text-center py-4">
                   <p className="text-muted mb-4">Изберете как искате да продължите с поръчката</p>
                 </div>
                 
                 <div className="flex space-x-3">
                   <button
                     type="button"
                     onClick={handleLogin}
                     disabled={isLoading}
                     className="flex-1 py-3 px-4 bg-gradient-to-r from-blue to-indigo text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isLoading ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                         Зареждане...
                       </>
                     ) : (
                       <>
                         <LogIn size={20} className="inline mr-2" />
                         Влез в профила
                       </>
                     )}
                   </button>
                   
                                     <button
                    type="button"
                    onClick={() => handleOrderTypeChange('guest')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      orderType === 'guest'
                        ? 'bg-gradient-to-r from-orange to-red text-white shadow-lg'
                        : 'bg-white/6 border border-white/12 text-text hover:bg-white/10'
                    }`}
                  >
                    <User size={20} className="inline mr-2" />
                    Поръчай като гост
                  </button>
                </div>
                 
                                 <div className="text-xs text-muted text-center bg-blue/10 border border-blue/20 rounded-lg p-3 flex items-center justify-center gap-2">
                  <Lightbulb size={16} className="text-blue" />
                  <span><strong>Съвет:</strong> Влизането в профила ще запази данните за бъдещи поръчки и ще получите по-бързо обслужване.</span>
                </div>
                 
                                 <div className="text-xs text-muted text-center bg-green/10 border border-green/20 rounded-lg p-3 flex items-center justify-center gap-2">
                  <ShoppingCart size={16} className="text-green" />
                  <span><strong>Важно:</strong> Вашите избрани продукти ще бъдат запазени при влизане в профила!</span>
                </div>
               </div>
             )}
           </div>

           {/* Collection/Delivery Selection */}
           <div className="bg-card border border-white/12 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-text mb-4">
               <Truck size={20} className="inline mr-2" />
               Начин на получаване *
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button
                 type="button"
                 onClick={() => setIsCollection(false)}
                 className={`p-4 rounded-lg border-2 transition-all ${
                   !isCollection
                     ? 'border-orange bg-orange/10 text-orange'
                     : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                 }`}
               >
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-orange"></div>
                   <Truck size={20} />
                   <span className="font-medium">Доставка</span>
                 </div>
                 <p className="text-sm text-muted mt-1">Доставяме до вашия адрес</p>
               </button>
               
               <button
                 type="button"
                 onClick={() => setIsCollection(true)}
                 className={`p-4 rounded-lg border-2 transition-all ${
                   isCollection
                     ? 'border-orange bg-orange/10 text-orange'
                     : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                 }`}
               >
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-orange"></div>
                   <Store size={20} />
                   <span className="font-medium">Вземане</span>
                 </div>
                 <p className="text-sm text-muted mt-1">Вземете от ресторанта</p>
               </button>
             </div>
           </div>

           {/* Payment Method Selection */}
           <div className="bg-card border border-white/12 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-text mb-4">
               <CreditCard size={20} className="inline mr-2" />
               Начин на плащане *
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {isCollection ? (
                 // Collection payment methods (1: Card at Restaurant, 2: Cash at Restaurant)
                 <>
                   <button
                     type="button"
                     onClick={() => setPaymentMethodId(1)}
                     className={`p-4 rounded-lg border-2 transition-all ${
                       paymentMethodId === 1
                         ? 'border-orange bg-orange/10 text-orange'
                         : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-orange"></div>
                       <CreditCard size={20} />
                       <span className="font-medium">С карта в ресторант</span>
                     </div>
                     <p className="text-sm text-muted mt-1">Платете с карта при вземане</p>
                   </button>
                   
                   <button
                     type="button"
                     onClick={() => setPaymentMethodId(2)}
                     className={`p-4 rounded-lg border-2 transition-all ${
                       paymentMethodId === 2
                         ? 'border-orange bg-orange/10 text-orange'
                         : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-orange"></div>
                       <Banknote size={20} />
                       <span className="font-medium">В брой в ресторант</span>
                     </div>
                     <p className="text-sm text-muted mt-1">Платете в брой при вземане</p>
                   </button>
                 </>
               ) : (
                 // Delivery payment methods (3: Card at Address, 4: Cash at Address, 5: Online)
                 <>
                   <button
                     type="button"
                     onClick={() => setPaymentMethodId(3)}
                     className={`p-4 rounded-lg border-2 transition-all ${
                       paymentMethodId === 3
                         ? 'border-orange bg-orange/10 text-orange'
                         : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-orange"></div>
                       <CreditCard size={20} />
                       <span className="font-medium">С карта на адрес</span>
                     </div>
                     <p className="text-sm text-muted mt-1">Платете с карта при доставка</p>
                   </button>
                   
                   <button
                     type="button"
                     onClick={() => setPaymentMethodId(4)}
                     className={`p-4 rounded-lg border-2 transition-all ${
                       paymentMethodId === 4
                         ? 'border-orange bg-orange/10 text-orange'
                         : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-orange"></div>
                       <Banknote size={20} />
                       <span className="font-medium">В брой на адрес</span>
                     </div>
                     <p className="text-sm text-muted mt-1">Платете в брой при доставка</p>
                   </button>
                   
                   <button
                     type="button"
                     onClick={() => setPaymentMethodId(5)}
                     className={`p-4 rounded-lg border-2 transition-all ${
                       paymentMethodId === 5
                         ? 'border-orange bg-orange/10 text-orange'
                         : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-orange"></div>
                       <CreditCard size={20} />
                       <span className="font-medium">Онлайн</span>
                     </div>
                     <p className="text-sm text-muted mt-1">Платете онлайн сега</p>
                   </button>
                 </>
               )}
             </div>
           </div>

           {/* Customer Information Form */}
           <form onSubmit={handleSubmit} className="bg-card border border-white/12 rounded-2xl p-6 space-y-6">
             <h2 className="text-xl font-bold text-text">Данни за доставка</h2>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <User size={16} className="inline mr-2" />
                Име и фамилия *
              </label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted focus:border-orange focus:outline-none transition-colors"
                placeholder="Въведете вашето име"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <Phone size={16} className="inline mr-2" />
                Телефон *
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted focus:border-orange focus:outline-none transition-colors"
                placeholder="+359 888 123 456"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <MapPin size={16} className="inline mr-2" />
                Адрес *
              </label>
              
              {/* Address Input */}
                    <input
                      ref={addressInputRef}
                      type="text"
                      value={customerInfo.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted focus:border-orange focus:outline-none transition-colors mb-3"
                      placeholder="Въведете адреса за доставка (ще се появят предложения)"
                      required
                    />
                    
                    {/* Autocomplete Info */}
              <div className="text-xs text-muted bg-blue/10 border border-blue/20 rounded-lg p-2 flex items-center gap-2 mb-3">
                      <Lightbulb size={14} className="text-blue" />
                      <span>Въведете адреса и ще се появят предложения за автоматично попълване</span>
                    </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                          <button
                            type="button"
                  onClick={confirmAddress}
                  disabled={!customerInfo.address}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-green to-emerald text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Потвърди адрес
                          </button>
                
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-orange to-red text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                  <MapPin size={16} />
                  Избери точна локация
                  </button>
               </div>
             </div>

             {/* Delivery Instructions */}
             <div>
               <label className="block text-sm font-medium text-text mb-2">
                 <MessageSquare size={16} className="inline mr-2" />
                 Инструкции за доставка
               </label>
               <textarea
                 value={deliveryInstructions}
                 onChange={(e) => setDeliveryInstructions(e.target.value)}
                 className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted focus:border-orange focus:outline-none transition-colors resize-none"
                 placeholder="Допълнителни инструкции за доставката (по желание): код на сградата, етаж, апартамент, ориентир и т.н."
                 rows={3}
               />
                             <div className="text-xs text-muted mt-1 flex items-center gap-2">
                <Lightbulb size={14} className="text-blue" />
                <span>Оставете празно ако нямате допълнителни инструкции</span>
              </div>
             </div>
 

            {/* Order Summary */}
            <div className="bg-white/6 border border-white/12 rounded-xl p-4 space-y-3">
              <h3 className="text-lg font-medium text-text mb-3">Обобщение на поръчката</h3>
              
              {/* Order Time */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Време за поръчка:</span>
                <span className="text-white">
                  {orderTime.type === null ? (
                    <span className="text-white">Не е избрано</span>
                  ) : orderTime.type === 'immediate' ? (
                    <span className="text-white">Веднага</span>
                  ) : (
                    <span className="text-white">
                      {orderTime.scheduledTime?.toLocaleDateString('bg-BG')} в {orderTime.scheduledTime?.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </div>

              {/* Collection/Delivery Status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Начин на получаване:</span>
                <span className="text-white">
                  {isCollection ? (
                    <span className="text-white">Вземане от ресторанта</span>
                  ) : (
                    <span className="text-white">Доставка</span>
                  )}
                </span>
              </div>

              {/* Address Status (only for delivery) */}
              {!isCollection && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Адрес:</span>
                  <span className="text-white">
                    {!customerInfo.address ? (
                      <span className="text-white">Не е въведен</span>
                    ) : addressConfirmed ? (
                      <span className="text-white">Потвърден</span>
                    ) : (
                      <span className="text-white">Не е потвърден</span>
                    )}
                  </span>
                </div>
              )}

              {/* Address Zone Status */}
              {customerInfo.coordinates && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Зона за доставка:</span>
                  <span className="text-white font-medium">
                    {addressZone === 'yellow' ? 'Жълта зона (3 лв.)' :
                     addressZone === 'blue' ? 'Синя зона (7 лв.)' :
                     addressZone === 'outside' ? 'Извън зоната' :
                     'Не е определена'}
                  </span>
                </div>
              )}

              {/* Order Total */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Сума на продуктите:</span>
                <span className="text-white">{totalPrice.toFixed(2)} лв.</span>
              </div>

              {/* Delivery Cost */}
              {!isCollection && deliveryCost !== null && addressZone !== 'outside' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Доставка:</span>
                  <span className="text-white">
                    {deliveryCost === 0 ? (
                      <span className="text-white">Безплатна</span>
                    ) : (
                      <span className="text-white">{deliveryCost.toFixed(2)} лв.</span>
                    )}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              <div className="border-t border-white/12 pt-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Обща сума:</span>
                  <span className="text-white">
                    {(totalPrice + (isCollection ? 0 : (deliveryCost || 0))).toFixed(2)} лв.
                  </span>
                </div>
              </div>

              {/* Validation Messages */}
              {totalPrice < 15 && (
                <div className="space-y-3">
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2">
                    Минималната сума за поръчка е 15 лв.
                  </div>
                  
                  {/* Action Buttons for Low Order */}
                  <div className="flex space-x-3">
                    <a
                      href="/order"
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-orange to-red text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Pizza size={16} />
                      Добави продукти
                    </a>
                  </div>
                </div>
              )}
              
              {!addressConfirmed && customerInfo.address && (
                <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2">
                  Адресът не е потвърден. Моля, кликнете "Потвърди адрес" или "Избери точна локация".
                </div>
              )}
              
              {addressZone === 'outside' && (
                <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2">
                  Доставката не е възможна на този адрес. Моля, изберете адрес в зоната за доставка.
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-gradient-to-r from-red to-orange text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Потвърди поръчката
            </button>
          </form>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <AddressSelectionModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          address={customerInfo.address}
          onCoordinatesSelect={handleCoordinatesSelect}
          onExactLocationSelect={handleExactLocationSelect}
        />
      )}
    </div>
  )
}
