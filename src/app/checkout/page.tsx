'use client'

import { useState, useEffect, useRef } from 'react'

// Extend the global Event interface to include InputEvent
declare global {
  interface Event {
    inputType?: string
  }
}
import { Globe, ArrowLeft, MapPin, User, Phone, CreditCard, Banknote, Clock, Calendar, LogIn, UserCheck, MessageSquare, RotateCcw, Database, Navigation, FileText, Map, CheckCircle, XCircle, Info, AlertTriangle, Lightbulb, Home, ShoppingCart, Pizza, Search, ClipboardList, Edit, Target, AlertCircle, HelpCircle, Truck, Store, Mail } from 'lucide-react'
import { useCart } from '../../components/CartContext'
import CartSummaryDisplay from '../../components/CartSummaryDisplay'
import DrinksSuggestionBox from '../../components/DrinksSuggestionBox'
import { isRestaurantOpen } from '../../utils/openingHours'
import { useLoginID } from '../../components/LoginIDContext'
import { encryptOrderId } from '../../utils/orderEncryption'
import styles from './checkout.module.css'

interface CustomerInfo {
  name: string
  phone: string
  email?: string
  LocationText: string
  LocationCoordinates: string
}

interface OrderTime {
  type: 'immediate' | 'scheduled' | null
  scheduledTime?: Date
}



type PaymentMethod = 'online' | 'card' | 'cash'
type OrderType = 'guest' | 'user'

export default function CheckoutPage() {
  const { items, totalPrice, getItemTotalPrice, refreshFromStorage, cartValidationMessage, clearCart } = useCart()
  const { user, isAuthenticated, updateUser } = useLoginID()
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    LocationText: '',
    LocationCoordinates:  '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online')
  const [orderTime, setOrderTime] = useState<OrderTime>({ type: null })
  const [orderType, setOrderType] = useState<OrderType>('guest')
  const [showDrinksSuggestion, setShowDrinksSuggestion] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCartLoading, setIsCartLoading] = useState(true)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [addressZone, setAddressZone] = useState<'yellow' | 'blue' | 'outside' | null>(null)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [isCollection, setIsCollection] = useState(false)
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'pickup' | 'delivery' | 'delivery-yellow' | 'delivery-blue'>('pickup')
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null)
  const [unavailableItems, setUnavailableItems] = useState<string[]>([])
  const [cachedProfileData, setCachedProfileData] = useState<any>(null)
  const [dateTimeError, setDateTimeError] = useState<string>('')
  const addressInputRef = useRef<HTMLInputElement>(null)
  
  // Map modal state (from dashboard)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [mapModalLoaded, setMapModalLoaded] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isValidatingAddress, setIsValidatingAddress] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [hasMarker, setHasMarker] = useState(false)
  const mapModalRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Function to get working hours for a specific day
  const getWorkingHoursForDay = (date: Date) => {
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Monday to Friday: 09:00 - 22:30
      return {
        start: '09:00',
        end: '22:30',
        message: 'Понеделник – Петък: 09:00 - 22:30'
      }
    } else {
      // Saturday and Sunday: 11:00 - 20:30
      return {
        start: '11:00',
        end: '20:30',
        message: 'Събота и Неделя: 11:00 - 20:30'
      }
    }
  }

  // Function to get day name in Bulgarian
  const getDayNameInBulgarian = (date: Date) => {
    const dayNames = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота']
    return dayNames[date.getDay()]
  }

  // Load Google Maps script and initialize autocomplete when delivery is selected
  useEffect(() => {
    // Only load Google Maps when delivery is selected
    if (selectedDeliveryType === 'pickup') {
      return
    }

    const loadGoogleMaps = async () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        if (!autocomplete) {
          initializeAutocomplete();
        }
        return;
      }

      // Check if script already exists to prevent duplicate loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for existing script to load
        existingScript.addEventListener('load', () => {
          if (!autocomplete) {
            initializeAutocomplete();
          }
        });
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      if (!apiKey) {
        return
      }

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.addEventListener('load', () => {
        setMapLoaded(true);
        initializeAutocomplete();
      });

      script.addEventListener('error', () => {
      });

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [selectedDeliveryType])

  // Initialize map modal when opened
  useEffect(() => {
    if (isMapModalOpen && mapLoaded && mapModalRef.current && !mapModalLoaded) {
      const initMap = () => {
        if (!window.google?.maps) return

        const map = new window.google.maps.Map(mapModalRef.current!, {
          center: { lat: 43.1333, lng: 24.7167 }, // Lovech center
          zoom: 13,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: []
        })

        mapInstanceRef.current = map

        // Wait for map to be ready before adding overlays and listeners
        window.google.maps.event.addListenerOnce(map, 'idle', async () => {
          // Automatically get user location when map opens
          try {
            const userLocation = await getUserLocation()
            
            // Center map on user location with 25 meter radius zoom
            map.setCenter(userLocation)
            map.setZoom(18)
            
            // Add marker at user location
            markerRef.current = new window.google.maps.Marker({
              position: userLocation,
              map: map,
              draggable: true,
              title: 'Вашата локация'
            })
            setHasMarker(true)

            // Add marker drag listener
            markerRef.current.addListener('dragend', (event: google.maps.MapMouseEvent) => {
              if (event.latLng) {
                const lat = event.latLng.lat()
                const lng = event.latLng.lng()
                validateAddressZone({ lat, lng })
              }
            })

            // Validate zone for user location
            validateAddressZone(userLocation)
          } catch {
          }
          
          // Add delivery zone overlays
          const lovechArea = [
            { lat: 43.12525, lng: 24.71518 },
            { lat: 43.12970, lng: 24.70579 },
            { lat: 43.13005, lng: 24.69994 },
            { lat: 43.12483, lng: 24.68928 },
            { lat: 43.12299, lng: 24.67855 },
            { lat: 43.13595, lng: 24.67501 },
            { lat: 43.14063, lng: 24.67991 },
            { lat: 43.14337, lng: 24.67877 },
            { lat: 43.14687, lng: 24.67553 },
            { lat: 43.15432, lng: 24.68221 },
            { lat: 43.15486, lng: 24.68312 },
            { lat: 43.15629, lng: 24.69245 },
            { lat: 43.15968, lng: 24.70306 },
            { lat: 43.16907, lng: 24.72538 },
            { lat: 43.15901, lng: 24.74022 },
            { lat: 43.15548, lng: 24.73935 },
            { lat: 43.14960, lng: 24.73785 },
            { lat: 43.13553, lng: 24.73599 },
            { lat: 43.13952, lng: 24.72210 },
            { lat: 43.12939, lng: 24.72549 }
          ]

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

          // Yellow zone (Lovech city area)
          new window.google.maps.Polygon({
            paths: lovechArea,
            strokeColor: '#fbbf24',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#fbbf24',
            fillOpacity: 0.2
          }).setMap(map)

          // Blue zone (Extended area)
          new window.google.maps.Polygon({
            paths: extendedArea,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.2
          }).setMap(map)

          // Add click listener to place marker
          map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const lat = event.latLng.lat()
              const lng = event.latLng.lng()
              
              // Remove existing marker
              if (markerRef.current) {
                markerRef.current.setMap(null)
              }
              
              // Add new marker
              markerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                draggable: true,
                title: 'Избран адрес'
              })
              setHasMarker(true)

              // Add marker drag listener
              markerRef.current.addListener('dragend', (event: google.maps.MapMouseEvent) => {
                if (event.latLng) {
                  const lat = event.latLng.lat()
                  const lng = event.latLng.lng()
                  validateAddressZone({ lat, lng })
                }
              })

              // Validate zone for clicked location
              validateAddressZone({ lat, lng })
            }
          })

          setMapModalLoaded(true)
        })
      }

      // Small delay to ensure modal is rendered
      setTimeout(initMap, 100)
    }
  }, [isMapModalOpen, mapLoaded, mapModalLoaded])

  // Check for "order again" data on component mount and refresh cart
  useEffect(() => {
    // Refresh cart from localStorage first (for "order again" functionality)
    refreshFromStorage()
    
    if (typeof window !== 'undefined') {
      const orderAgainData = localStorage.getItem('pizza-stop-order-again')
      if (orderAgainData) {
        try {
          const orderInfo = JSON.parse(orderAgainData)
          setIsCollection(orderInfo.isCollection || false)
          setUnavailableItems(orderInfo.unavailableItems || [])
          
          // Clear the data after using it
          localStorage.removeItem('pizza-stop-order-again')
        } catch {
        }
      }
    }
  }, [refreshFromStorage])

  // Check for drinks in cart and show suggestion box
  useEffect(() => {
    if (items.length > 0) {
      const hasDrinks = items.some(item => item.category === 'drinks')
      if (!hasDrinks) {
        // Show drinks suggestion box after a short delay
        setTimeout(() => {
          setShowDrinksSuggestion(true)
        }, 1000)
      }
    }
  }, [items])

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
  
      // Only set order type to user if we have meaningful data, but don't auto-fill
      if (user.name || user.phone || user.LocationText) {
        setOrderType('user')
        // Fill form with profile data when order type defaults to user
        fillFormWithProfileData()
      } else {
        // If user is authenticated but no profile data, fetch fresh data from database
        fetchUserProfileFromDatabase()
      }
    } else {
      // Default to guest for non-authenticated users
      setOrderType('guest')
    }
  }, [user, isAuthenticated])

  // Also check auth when user changes (for debugging)
  useEffect(() => {
    // Clear cached profile data when user changes
    if (cachedProfileData && cachedProfileData.userId !== user?.id) {
      setCachedProfileData(null)
    }
  }, [user, cachedProfileData])

  // Handle order type changes - fetch profile data when switching to "user"
  useEffect(() => {
    if (orderType === 'user' && user && isAuthenticated) {
      fetchUserProfileFromDatabase()
    }
  }, [orderType, user, isAuthenticated])

  // Clear date/time error when order time type changes
  useEffect(() => {
    setDateTimeError('')
  }, [orderTime.type])

  // Also check auth when customerInfo changes (for debugging)
  useEffect(() => {}, [customerInfo, deliveryInstructions])

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
    if (customerInfo.LocationCoordinates) {
      try {
        const coords = typeof customerInfo.LocationCoordinates === 'string' 
          ? JSON.parse(customerInfo.LocationCoordinates)
          : customerInfo.LocationCoordinates
        validateAddressZone(coords)
      } catch {
      }
    }
  }, [customerInfo.LocationCoordinates])

  // Recalculate delivery cost when total price changes
  useEffect(() => {
    const cost = calculateDeliveryCost(totalPrice, addressZone, selectedDeliveryType)
    setDeliveryCost(cost || 0)
  }, [totalPrice, addressZone, selectedDeliveryType])

  // Default payment method to cash when collection is selected
  useEffect(() => {
    if (selectedDeliveryType === 'pickup') {
      setPaymentMethodId(2) // Cash at restaurant
      setIsCollection(true)
    } else {
      setIsCollection(false)
    }
  }, [selectedDeliveryType])

  // Validate address zone when user data is loaded and order type is 'user'
  useEffect(() => {
    
    if (orderType === 'user' && user && user.LocationCoordinates) {
      try {
        const coordinates = typeof user.LocationCoordinates === 'string' 
          ? JSON.parse(user.LocationCoordinates)
          : user.LocationCoordinates
        
        
        if (coordinates && coordinates.lat && coordinates.lng) {
          validateAddressZone(coordinates)
        } 
      } catch {
      }
    }
  }, [user, orderType])



  const initializeAutocomplete = () => {
    if (!addressInputRef.current || !window.google?.maps?.places) return;

    // Clean up existing autocomplete instance if it exists
    if (autocomplete) {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    }

    // Lovech center coordinates
    const lovechCenter = { lat: 43.1333, lng: 24.7167 };
    
    // Calculate bounds for 30km radius around Lovech
    // 1 degree latitude ≈ 111 km, so 30km ≈ 0.27 degrees
    // 1 degree longitude ≈ 111 km * cos(latitude), so at 43.1333°: 30km ≈ 0.37 degrees
    const radiusLat = 0.27; // ~30km in latitude
    const radiusLng = 0.37; // ~30km in longitude at Lovech's latitude
    
    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(
        lovechCenter.lat - radiusLat,
        lovechCenter.lng - radiusLng
      ),
      new window.google.maps.LatLng(
        lovechCenter.lat + radiusLat,
        lovechCenter.lng + radiusLng
      )
    );

    const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'bg' }, // Restrict to Bulgaria
      bounds: bounds, // Limit to Lovech and 30km radius
      strictBounds: true, // Strictly enforce bounds - don't show results outside
      fields: ['formatted_address', 'geometry', 'place_id']
    });

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (place.formatted_address) {
        // Filter out addresses from major cities outside Lovech area
        const excludedCities = ['Sofia', 'София', 'Varna', 'Варна', 'Plovdiv', 'Пловдив', 'Burgas', 'Бургас', 'Ruse', 'Русе']
        const addressLower = place.formatted_address.toLowerCase()
        const containsExcludedCity = excludedCities.some(city => 
          addressLower.includes(city.toLowerCase())
        )

        if (containsExcludedCity) {
          alert('❌ Адресът е извън зоната за доставка. Моля, изберете адрес в Ловеч или в радиус от 30 км.')
          setCustomerInfo(prev => ({
            ...prev,
            LocationText: '',
            LocationCoordinates: ''
          }))
          return
        }

        // Validate that the selected place is within bounds
        if (place.geometry && place.geometry.location) {
          const coordinates = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };

          // Check if coordinates are within the 30km radius from Lovech
          const distance = calculateDistance(
            lovechCenter.lat,
            lovechCenter.lng,
            coordinates.lat,
            coordinates.lng
          );

          // Reject addresses outside 30km radius
          if (distance > 30) {
            alert('❌ Адресът е извън зоната за доставка. Моля, изберете адрес в Ловеч или в радиус от 30 км.')
            setCustomerInfo(prev => ({
              ...prev,
              LocationText: '',
              LocationCoordinates: ''
            }))
            return
          }

          // Update the address with the selected place
          setCustomerInfo(prev => ({
            ...prev,
            LocationText: place.formatted_address || ''
          }));

          // Update coordinates and validate address zone
          setCustomerInfo(prev => ({
            ...prev,
            LocationCoordinates: JSON.stringify(coordinates)
          }));

          // Validate the address zone
          validateAddressZone(coordinates);
        }
      }
    });

    setAutocomplete(autocompleteInstance as any);
  }


  const handleAddressChange = (LocationText: string) => {
    setCustomerInfo(prev => ({ ...prev, LocationText }))
    // Clear coordinates and reset confirmation when address is manually changed
    if (customerInfo.LocationCoordinates) {
      setCustomerInfo(prev => ({ ...prev, LocationCoordinates: '' }))
    }
    setAddressConfirmed(false)
  }


  const handleCoordinatesSelect = (coordinates: { lat: number; lng: number }) => {
    const coordinatesString = JSON.stringify(coordinates)
    setCustomerInfo(prev => ({ ...prev, LocationCoordinates: coordinatesString }))
    // Validate zone and set confirmation status based on zone
    validateAddressZone(coordinates)
  }

  const handleExactLocationSelect = (coordinates: { lat: number; lng: number }) => {
    const coordinatesString = JSON.stringify(coordinates)
    setCustomerInfo(prev => ({ ...prev, LocationCoordinates: coordinatesString }))
    // Validate zone and set confirmation status based on zone
    if (coordinates) {
      validateAddressZone(coordinates)
    }
  }

  const handleAddressUpdate = (LocationText: string) => {
    setCustomerInfo(prev => ({ ...prev, LocationText }))
  }

  // Get user location function (from dashboard)
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокацията не се поддържа от вашия браузър.'))
        return
      }

      setIsGettingLocation(true)
      setLocationError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setIsGettingLocation(false)
          resolve(location)
        },
        (error) => {
          setIsGettingLocation(false)
          let errorMessage = 'Грешка при определяне на локацията.'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Достъпът до геолокацията е отказан. Моля, разрешете достъпа в настройките на браузъра.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Информацията за локацията не е налична.'
              break
            case error.TIMEOUT:
              errorMessage = 'Времето за определяне на локацията изтече.'
              break
          }
          
          setLocationError(errorMessage)
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  // Map modal handlers
  const handleMapModalClose = () => {
    setIsMapModalOpen(false)
    setMapModalLoaded(false)
    setLocationError(null)
    setHasMarker(false)
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
  }

  const handleMapLocationSelect = async () => {
 
    if (!markerRef.current) {
      return
    }

    const position = markerRef.current.getPosition()
    
    if (!position) {
      return
    }

    const coordinates = {
      lat: position.lat(),
      lng: position.lng()
    }

    try {
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder()
      
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ location: coordinates }, (results, status) => {
          
          if (status === 'OK' && results) {
            resolve(results)
          } else {
            reject(new Error('Geocoding failed'))
          }
        })
      })

      if (result && result[0]) {
        const address = result[0].formatted_address
        
        setCustomerInfo(prev => ({
          ...prev,
          LocationText: address,
          LocationCoordinates: JSON.stringify(coordinates)
        }))
        
        
        // Validate zone
        validateAddressZone(coordinates)
        setAddressConfirmed(true)
        
      } 
    } catch{
    }

    handleMapModalClose()
  }


    // Delivery cost calculation based on selected delivery type
  const calculateDeliveryCost = (
    orderTotal: number,
    zone: 'yellow' | 'blue' | 'outside' | null,
    deliveryType: 'pickup' | 'delivery' | 'delivery-yellow' | 'delivery-blue'
  ) => {
    if (deliveryType === 'pickup') return 0
    if (zone === 'yellow') {
      if (orderTotal < 15) return null
      return 3
    }
    if (zone === 'blue') {
      if (orderTotal < 30) return null
      return 7
    }
    return null
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

  const validateAddressZone = (coordinates: { lat: number; lng: number } | null): 'blue' | 'yellow' | 'outside' | null => {
    
    if (!coordinates) {
      setAddressZone(null)
      setDeliveryCost(0)
      setAddressConfirmed(false)
      return null
    }

    if (!coordinates.lat || !coordinates.lng) {
      setAddressZone(null)
      setDeliveryCost(0)
      setAddressConfirmed(false)
      return null
    }

    // Define Lovech city area (3 BGN delivery) - Yellow zone
    const lovechArea = [
      { lat: 43.12525, lng: 24.71518 },
      { lat: 43.12970, lng: 24.70579 },
      { lat: 43.13005, lng: 24.69994 },
      { lat: 43.12483, lng: 24.68928 },
      { lat: 43.12299, lng: 24.67855 },
      { lat: 43.13595, lng: 24.67501 },
      { lat: 43.14063, lng: 24.67991 },
      { lat: 43.14337, lng: 24.67877 },
      { lat: 43.14687, lng: 24.67553 },
      { lat: 43.15432, lng: 24.68221 },
      { lat: 43.15486, lng: 24.68312 },
      { lat: 43.15629, lng: 24.69245 },
      { lat: 43.15968, lng: 24.70306 },
      { lat: 43.16907, lng: 24.72538 },
      { lat: 43.15901, lng: 24.74022 },
      { lat: 43.15548, lng: 24.73935 },
      { lat: 43.14960, lng: 24.73785 },
      { lat: 43.13553, lng: 24.73599 },
      { lat: 43.13952, lng: 24.72210 },
      { lat: 43.12939, lng: 24.72549 }
    ]
    
    // Define extended area (7 BGN delivery) - Blue zone
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
    
    let zone: 'yellow' | 'blue' | 'outside' | null = null
    
    // Check if point is in Lovech city area (yellow zone - 3 BGN)
    if (isPointInPolygon(coordinates, lovechArea)) {
      zone = 'yellow'
    }
    // Check if point is in extended area (blue zone - 7 BGN)
    else if (isPointInPolygon(coordinates, extendedArea)) {
      zone = 'blue'
    }
    // Point is outside both areas
    else {
      zone = 'outside'
    }
    
    setAddressZone(zone)
    
    // Only confirm address if it's within delivery zone (for delivery orders)
    if (selectedDeliveryType !== 'pickup') {
      if (zone === 'outside') {
        setAddressConfirmed(false)
      } else {
        setAddressConfirmed(true)
      }
    } else {
      // For pickup orders, no address validation needed
      setAddressConfirmed(true)
    }
    
    // Calculate delivery cost automatically based on zone
    const cost = calculateDeliveryCost(totalPrice, zone, selectedDeliveryType)
    setDeliveryCost(cost || 0)
    
    return zone
  }

  const handleInitiatePayment = async () => {
    setIsLoading(true)

    try {
      // First, validate the form (reuse the same validation logic as handleSubmit)
      if (!items || items.length === 0) {
        alert('❌ Вашата количка е празна! Моля, добавете продукти преди да поръчате.')
        setIsLoading(false)
        return
      }

      const invalidItems = items.filter(item => !item.name || !item.price || item.quantity <= 0)
      if (invalidItems.length > 0) {
        alert('❌ Някои продукти в количката са невалидни. Моля, опреснете страницата.')
        setIsLoading(false)
        return
      }

      if (totalPrice < 15) {
        alert('❌ Минималната сума за поръчка е 15 €.')
        setIsLoading(false)
        return
      }

      if (selectedDeliveryType !== 'pickup') {
        if (!customerInfo.LocationText || !customerInfo.LocationCoordinates) {
          alert('❌ Моля, въведете адрес за доставка.')
          setIsLoading(false)
          return
        }

        if (!addressConfirmed) {
          alert('❌ Моля, потвърдете адреса за доставка.')
          setIsLoading(false)
          return
        }

        if (deliveryCost === null || addressZone === 'outside') {
          alert('❌ Не може да се изчисли цената за доставка или адресът е извън зона.')
          setIsLoading(false)
          return
        }
      }

      if (paymentMethodId === null) {
        alert('❌ Моля, изберете начин на плащане.')
        setIsLoading(false)
        return
      }

      if (orderTime.type === 'scheduled' && orderTime.scheduledTime) {
        const now = new Date()
        const scheduledTime = orderTime.scheduledTime

        if (scheduledTime <= now) {
          alert('❌ Моля, изберете бъдещо време за поръчката')
          setIsLoading(false)
          return
        }

        const timeDiff = scheduledTime.getTime() - now.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)

        if (hoursDiff > 120) {
          alert('❌ Поръчките могат да се правят максимум 5 дни напред')
          setIsLoading(false)
          return
        }

        const hour = scheduledTime.getHours()
        if (hour < 11 || hour >= 23) {
          alert('❌ Моля, изберете време между 11:00 и 23:00')
          setIsLoading(false)
          return
        }
      }

      if (orderType === 'user' && user) {
        try {
          updateUser({
            name: customerInfo.name,
            phone: customerInfo.phone,
            LocationText: customerInfo.LocationText,
            LocationCoordinates: customerInfo.LocationCoordinates
          })
        } catch {
        }
      }

      if (!orderTime.type) {
        alert('❌ Моля, изберете кога искате да получите поръчката')
        setIsLoading(false)
        return
      }

      if (orderTime.type === 'scheduled' && (!orderTime.scheduledTime || !(orderTime.scheduledTime instanceof Date))) {
        alert('❌ Моля, изберете валидна дата и час за доставката')
        setIsLoading(false)
        return
      }

      // Prepare order data
      const finalTotal = totalPrice + (selectedDeliveryType === 'pickup' ? 0 : deliveryCost)
      const orderData = {
        customerInfo: {
          ...customerInfo,
          email: orderType === 'guest' ? customerInfo.email : (user?.email || `guest_${Date.now()}@pizza-stop.bg`),
          LocationText: isCollection ? 'Lovech Center, ul. "Angel Kanchev" 10, 5502 Lovech, Bulgaria' : customerInfo.LocationText,
          deliveryInstructions: deliveryInstructions || undefined
        },
        orderItems: items,
        orderTime: {
          type: orderTime.type as 'immediate' | 'scheduled',
          scheduledTime: orderTime.scheduledTime ? orderTime.scheduledTime.toISOString() : undefined
        },
        orderType,
        deliveryCost: selectedDeliveryType === 'pickup' ? 0 : deliveryCost,
        totalPrice,
        isCollection: selectedDeliveryType === 'pickup',
        paymentMethodId,
        loginId: user?.id || null
      }


      // Call payment initiation API
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok) {
        // Redirect to payment processor
        if (result.paymentUrl) {
          clearCart()
          window.location.href = result.paymentUrl
        } else {
          throw new Error('No payment URL received')
        }
      } else {
        alert(`❌ ${result.error || 'Грешка при иницииране на плащането'}`)
        setIsLoading(false)
      }
    } catch {
      setIsLoading(false)
      alert('❌ Възникна грешка при иницииране на плащането.')
    }
  }

  const confirmAddress = async () => {
    
    if (!customerInfo.LocationText) {
      alert('❌ Моля, въведете адрес преди да го потвърдите')
          return
        }
        
    // If we already have coordinates, validate them
    if (customerInfo.LocationCoordinates) {
      try {
        const coords = typeof customerInfo.LocationCoordinates === 'string' 
          ? JSON.parse(customerInfo.LocationCoordinates)
          : customerInfo.LocationCoordinates
        validateAddressZone(coords)
        setAddressConfirmed(true)
      } catch {
      }
      return
    }

    // Try to geocode the address to get coordinates
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder()
      
      geocoder.geocode({ address: customerInfo.LocationText }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location
          const coordinates = {
            lat: location.lat(),
            lng: location.lng()
          }
          
          
          // Update customer info with coordinates
          setCustomerInfo(prev => ({
            ...prev,
            LocationCoordinates: JSON.stringify(coordinates)
          }))
          
          // Validate the zone (confirmation status will be set based on zone)
          const zone = validateAddressZone(coordinates)
          
          // Show appropriate message based on zone
          if (zone === 'outside') {
            alert('❌ Адресът е извън зоната за доставка. Доставката не е възможна.')
          }
          // Success case - no alert needed, user can see the confirmation in the UI
        } else {
          setAddressConfirmed(false)
          alert('❌ Не може да се намери адресът. Моля, проверете адреса или използвайте "Избери точна локация"')
        }
      })
    } else {
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
    } catch {
      setIsLoading(false)
    }
  }

  const clearFormFields = () => {
    setCustomerInfo({
      name: '',
      phone: '',
      email: '',
      LocationText: '',
      LocationCoordinates: ''
    })
    setDeliveryInstructions('')
  }

  const fetchUserProfileFromDatabase = async () => {
    if (!user?.id) {
      return
    }

    // Check if we already have cached data for this user
    if (cachedProfileData && cachedProfileData.userId === user.id) {
      fillFormWithProfileDataFromData(cachedProfileData.user)
      return
    }

    try {
      const response = await fetch(`/api/user/profile?userId=${user.id}`)
      
      if (response.ok) {
        const profileData = await response.json()
        
        if (profileData.user) {
          // Cache the profile data with user ID
          setCachedProfileData({
            userId: user.id,
            user: profileData.user
          })
          
          // Update the user context with fresh data
          updateUser(profileData.user)
          
          // Fill form with the fresh data
          fillFormWithProfileDataFromData(profileData.user)
        }
      } else {
      }
    } catch {
    }
  }

  const fillFormWithProfileDataFromData = (userData: any) => {
    
    const updates: Partial<CustomerInfo> = {}
    
    if (userData.name) {
      updates.name = userData.name
    }
    if (userData.phone) {
      updates.phone = userData.phone
    }
    if (userData.email) {
      updates.email = userData.email
    }
    if (userData.LocationText) {
      updates.LocationText = userData.LocationText
    }
    
    if (userData.LocationCoordinates) {
      try {
        let coordinates = typeof userData.LocationCoordinates === 'string' 
          ? JSON.parse(userData.LocationCoordinates)
          : userData.LocationCoordinates
        
        // Fix typo in database: "Ing" should be "lng"
        if (coordinates && coordinates.Ing !== undefined) {
          coordinates.lng = coordinates.Ing
          delete coordinates.Ing
        }
        
        updates.LocationCoordinates = JSON.stringify(coordinates)
        
        // Validate address zone immediately when coordinates are loaded
        if (coordinates && coordinates.lat && coordinates.lng) {
          validateAddressZone(coordinates)
        }
      } catch {
      }
    }
    
    
    setCustomerInfo(prev => {
      const newState = {
        ...prev,
        ...updates
      }
      return newState
    })
    
    if (userData.addressInstructions) {
      setDeliveryInstructions(userData.addressInstructions)
    }
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
      if (user.email) {
        updates.email = user.email
      }
      if (user.LocationText) {
        updates.LocationText = user.LocationText
      }
      if (user.LocationCoordinates) {
        try {
          let coordinates = typeof user.LocationCoordinates === 'string' 
            ? JSON.parse(user.LocationCoordinates)
            : user.LocationCoordinates
          
          // Fix typo in database: "Ing" should be "lng"
          if (coordinates && coordinates.Ing !== undefined) {
            coordinates.lng = coordinates.Ing
            delete coordinates.Ing
          }
          
          updates.LocationCoordinates = JSON.stringify(coordinates)
          
          // Validate address zone immediately when coordinates are loaded
          if (coordinates && coordinates.lat && coordinates.lng) {
            validateAddressZone(coordinates)
          }
        } catch {
        }
      }
            
      setCustomerInfo(prev => {
        const newState = {
          ...prev,
          ...updates
        }
        return newState
      })
      
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
    (orderType === 'user' || (orderType === 'guest' && customerInfo.email)) && // Email required for guest orders
    orderTime.type !== null &&
    (orderTime.type === 'immediate' || (orderTime.type === 'scheduled' && orderTime.scheduledTime)) &&
    orderType &&
    paymentMethodId !== null && // Payment method must be selected
    totalPrice >= 15 && // Minimum order amount
    (
      selectedDeliveryType === 'pickup' || // Pickup orders don't need address validation
      ((selectedDeliveryType === 'delivery' || selectedDeliveryType === 'delivery-yellow' || selectedDeliveryType === 'delivery-blue') && (
        (addressZone === 'yellow' && totalPrice >= 15) ||
        (addressZone === 'blue' && totalPrice >= 30)
      ))
    ) && // Delivery orders need address validation
    (selectedDeliveryType === 'pickup' || (customerInfo.LocationText && customerInfo.LocationCoordinates && addressConfirmed && addressZone !== 'outside')) &&
    true // No additional validation needed for payment methods

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      // For online payments, use the payment initiation flow
      if (paymentMethodId === 5) {
        await handleInitiatePayment()
        return
      }

      // Set loading state immediately for non-online payments
      setIsLoading(true)
  
    
    try{
    
    // CRITICAL: Validate cart is not empty
    if (!items || items.length === 0) {
      alert('❌ Вашата количка е празна! Моля, добавете продукти преди да поръчате.')
      setIsLoading(false)
      return
    }
    
    // Validate all items have required data
    const invalidItems = items.filter(item => !item.name || !item.price || item.quantity <= 0)
    if (invalidItems.length > 0) {
      alert('❌ Някои продукти в количката са невалидни. Моля, опреснете страницата.')
      setIsLoading(false)
      return
    }
    
    // Validate minimum order amount
    if (totalPrice < 15) {
      alert('❌ Минималната сума за поръчка е 15 €.')
      setIsLoading(false)
      return
    }
     
     // Validate delivery requirements (only for delivery orders)
     if (selectedDeliveryType !== 'pickup') {
       if (!customerInfo.LocationText || !customerInfo.LocationCoordinates) {
         alert('❌ Моля, въведете адрес за доставка.')
         setIsLoading(false)
         return
       }
       
       if (!addressConfirmed) {
         alert('❌ Моля, потвърдете адреса за доставка.')
         setIsLoading(false)
         return
       }
       
       if (deliveryCost === null || addressZone === 'outside') {
         alert('❌ Не може да се изчисли цената за доставка или адресът е извън зона.')
         setIsLoading(false)
         return
       }
     }
     
     // Validate payment method
     if (paymentMethodId === null) {
       alert('❌ Моля, изберете начин на плащане.')
       setIsLoading(false)
       return
     }
     
     // Validate scheduled order time
     if (orderTime.type === 'scheduled' && orderTime.scheduledTime) {
       const now = new Date()
       const scheduledTime = orderTime.scheduledTime
       
       // Check if scheduled time is in the future
       if (scheduledTime <= now) {
         alert('❌ Моля, изберете бъдещо време за поръчката')
         setIsLoading(false)
         return
       }
       
       // Check if within 5 days (120 hours)
       const timeDiff = scheduledTime.getTime() - now.getTime()
       const hoursDiff = timeDiff / (1000 * 60 * 60)
       
      if (hoursDiff > 120) {
        alert('❌ Поръчките могат да се правят максимум 5 дни напред')
        setIsLoading(false)
        return
      }
       
       // Check if within business hours (11:00-23:00)
       const hour = scheduledTime.getHours()
       if (hour < 11 || hour >= 23) {
         alert('❌ Моля, изберете време между 11:00 и 23:00')
         setIsLoading(false)
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
           LocationText: customerInfo.LocationText,
           LocationCoordinates: customerInfo.LocationCoordinates
         })
       } catch {
         // Don't block the order if profile update fails
       }
     }
     
     // Handle order submission
    const finalTotal = totalPrice + (selectedDeliveryType === 'pickup' ? 0 : deliveryCost)
     
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
    
    // Prepare order data for API
   const orderData = {
     customerInfo: {
       ...customerInfo,
      email: orderType === 'guest' ? customerInfo.email : (user?.email || `guest_${Date.now()}@pizza-stop.bg`),
      // For collection orders, ensure address fields are properly set
      LocationText: isCollection ? 'Lovech Center, ul. "Angel Kanchev" 10, 5502 Lovech, Bulgaria' : customerInfo.LocationText,
      deliveryInstructions: deliveryInstructions || undefined
     },
     orderItems: items,
     orderTime: {
       type: orderTime.type as 'immediate' | 'scheduled', // Type assertion for Zod
       // Convert Date to ISO string for Zod validation
       scheduledTime: orderTime.scheduledTime ? orderTime.scheduledTime.toISOString() : undefined
     },
     orderType,
    deliveryCost: selectedDeliveryType === 'pickup' ? 0 : deliveryCost,
     totalPrice,
    isCollection: selectedDeliveryType === 'pickup',
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
      // Redirect to order success page with encrypted order ID
      clearCart()
      const encryptedOrderId = encryptOrderId(result.orderId.toString())
      // Don't stop loading, keep it running during redirect
      window.location.href = `/order-success?orderId=${encryptedOrderId}`
    } else {
      setIsLoading(false)
      
      // Show user-friendly error message
      if (result.details) {
        // Parse the validation errors
        let errorMessage = '❌ Моля, коригирайте следните грешки:\n\n'
        
        if (result.details.customerInfo) {
          errorMessage += 'Информация за клиента:\n'
          result.details.customerInfo.forEach((err: string) => {
            errorMessage += `  • ${err}\n`
          })
        }
        
        if (result.details.orderItems) {
          errorMessage += '\nПродукти:\n'
          result.details.orderItems.forEach((err: string) => {
            errorMessage += `  • ${err}\n`
          })
        }
        
        if (result.details.orderTime) {
          errorMessage += '\nВреме за доставка:\n'
          result.details.orderTime.forEach((err: string) => {
            errorMessage += `  • ${err}\n`
          })
        }
        
        // Show all other errors
        Object.keys(result.details).forEach(key => {
          if (!['customerInfo', 'orderItems', 'orderTime'].includes(key)) {
            errorMessage += `\n${key}:\n`
            if (Array.isArray(result.details[key])) {
              result.details[key].forEach((err: string) => {
                errorMessage += `  • ${err}\n`
              })
            }
          }
        })
        
        alert(errorMessage)
      } else {
        alert(`❌ ${result.error || 'Възникна грешка при потвърждаване на поръчката'}`)
      }
      throw new Error(result.error || 'Failed to confirm order')
    }
   } catch {
     setIsLoading(false)
     alert('❌ Възникна грешка при потвърждаване на поръчката.')
   }
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5">
      {/* Header */}
      <div className="bg-card border-b border-white/12">
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
         <div className="max-w-6xl mx-auto space-y-8">
           
           
           {/* Drinks Suggestion Box */}
           {showDrinksSuggestion && (
             <DrinksSuggestionBox
               onClose={() => setShowDrinksSuggestion(false)}
             />
           )}

           {/* Cart Items Summary */}
           <div className="bg-card border border-white/12 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-text mb-4">Артикули в количката</h2>
             
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
                          <div>
                            <h4 className="font-medium text-text">{item.name}</h4>
                            <p className="text-sm text-muted">
                              {item.size} • {item.quantity}x
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-orange">{getItemTotalPrice(item).toFixed(2)} €.</p>
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
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} €.)`}
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
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} €.)`}
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
                                        className="text-xs bg-orange/20 text-orange px-2 py-1 rounded-md"
                                      >
                                        {addon.Name}
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} €.)`}
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
                                        {addon.Price > 0 && ` (+${addon.Price.toFixed(2)} €.)`}
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
                     <CartSummaryDisplay />
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
                  <p className="text-sm text-muted">Избери време за доставка (до 5 дни напред)</p>
                </div>
              </label>

              {/* Date and Time Picker for Scheduled Orders */}
              {orderTime.type === 'scheduled' && (
                <div className="p-4 bg-white/6 border border-white/12 rounded-xl">
                  <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 max-md:px-4">
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
                        max={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          value={orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value)
                          if (isNaN(selectedDate.getTime())) return
                          
                          // Validate date range (today to 5 days ahead)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0) // Start of today
                          const maxDate = new Date()
                          maxDate.setDate(maxDate.getDate() + 5) // 5 days = 120 hours
                          maxDate.setHours(23, 59, 59, 999) // End of day
                          
                          if (selectedDate < today) {
                            setDateTimeError('Не можете да изберете дата в миналото. Моля, изберете днешна дата или по-късна.')
                            return
                          }
                          
                          if (selectedDate > maxDate) {
                            setDateTimeError('Поръчките могат да се правят до 5 дни напред. Моля, изберете по-ранна дата.')
                            return
                          }
                          
                          // Clear error if date is valid
                          setDateTimeError('')
                          
                          const currentTime = orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime : new Date()
                          
                          // Get working hours for the selected date
                          const workingHours = getWorkingHoursForDay(selectedDate)
                          const [startHour] = workingHours.start.split(':').map(Number)
                          
                          // If current time is outside working hours for the new day, reset to start of working hours
                          if (currentTime.getHours() < startHour || currentTime.getHours() > 22) {
                            selectedDate.setHours(startHour, 0, 0, 0)
                          } else {
                            selectedDate.setHours(currentTime.getHours())
                            selectedDate.setMinutes(currentTime.getMinutes())
                          }
                          
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
                        {/* Calendar icon overlay - hidden on mobile */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none max-md:hidden">
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
                        min={orderTime.scheduledTime ? getWorkingHoursForDay(orderTime.scheduledTime).start : '09:00'}
                        max={orderTime.scheduledTime ? getWorkingHoursForDay(orderTime.scheduledTime).end : '22:30'}
                        step="300"
                          value={orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime.toTimeString().slice(0, 5) : ''}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':').map(Number)
                          
                          // Get working hours for the selected date
                          const selectedDate = orderTime.scheduledTime || new Date()
                          const workingHours = getWorkingHoursForDay(selectedDate)
                          const [startHour] = workingHours.start.split(':').map(Number)
                          const [endHour, endMinute] = workingHours.end.split(':').map(Number)
                          
                          // Validate hours are within business hours for the selected day
                          if (hours < startHour || (hours > endHour || (hours === endHour && minutes > endMinute))) {
                            const dayName = getDayNameInBulgarian(selectedDate)
                            setDateTimeError(`Моля, изберете време между ${workingHours.start} и ${workingHours.end} за ${dayName}`)
                            return
                          }
                          
                          // Clear error if time is valid
                          setDateTimeError('')
                          
                          const currentDate = orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime : new Date()
                          currentDate.setHours(hours, minutes, 0, 0)
                          
                          // If selecting time for today, validate it's not in the past
                          const today = new Date()
                          if (currentDate.toDateString() === today.toDateString()) {
                            const now = new Date()
                            if (currentDate < now) {
                              setDateTimeError('Не можете да изберете време в миналото. Моля, изберете по-късно време.')
                              return
                            }
                          }
                          
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
                          onBlur={(e) => {
                            // Re-validate time on blur
                            const [hours, minutes] = e.target.value.split(':').map(Number)
                            if (isNaN(hours) || isNaN(minutes)) return
                            
                            const selectedDate = orderTime.scheduledTime || new Date()
                            const workingHours = getWorkingHoursForDay(selectedDate)
                            const [startHour] = workingHours.start.split(':').map(Number)
                            const [endHour, endMinute] = workingHours.end.split(':').map(Number)
                            
                            if (hours < startHour || (hours > endHour || (hours === endHour && minutes > endMinute))) {
                              // Reset to valid time if invalid
                              const currentDate = orderTime.scheduledTime && orderTime.scheduledTime instanceof Date && !isNaN(orderTime.scheduledTime.getTime()) ? orderTime.scheduledTime : new Date()
                              currentDate.setHours(startHour, 0, 0, 0)
                              setOrderTime(prev => ({ ...prev, scheduledTime: currentDate }))
                            }
                          }}
                        />
                        {/* Clock icon overlay - hidden on mobile */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none max-md:hidden">
                          <Clock size={20} className="text-orange" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {dateTimeError && (
                    <div className="mt-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>{dateTimeError}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-muted flex items-center gap-2">
                    <Lightbulb size={14} className="text-blue" />
                    <span>
                      {orderTime.scheduledTime ? (
                        <>
                          <strong>{getDayNameInBulgarian(orderTime.scheduledTime)}:</strong> Поръчки се приемат между {getWorkingHoursForDay(orderTime.scheduledTime).start} - {getWorkingHoursForDay(orderTime.scheduledTime).end}
                        </>
                      ) : (
                        <>
                          <strong>Работно време:</strong> Понеделник – Петък: 09:00 - 22:30, Събота и Неделя: 11:00 - 20:30. Поръчките могат да се правят до 5 дни напред.
                        </>
                      )}
                    </span>
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

           {/* Order Type Selection */}
           <div className="bg-card border border-white/12 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-text mb-4">
               <Truck size={20} className="inline mr-2" />
               Тип на поръчка *
             </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button
                 type="button"
                 onClick={() => setSelectedDeliveryType('pickup')}
                 className={`p-4 rounded-lg border-2 transition-all ${
                   selectedDeliveryType === 'pickup'
                     ? 'border-green bg-green/10 text-green'
                     : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                 }`}
               >
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-green"></div>
                   <Store size={20} />
                   <span className="font-medium">Вземане от ресторант</span>
                 </div>
               </button>
               
              <button
                type="button"
                onClick={() => setSelectedDeliveryType('delivery')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDeliveryType === 'delivery'
                    ? 'border-yellow bg-yellow/10 text-yellow'
                    : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow"></div>
                  <Truck size={20} />
                  <span className="font-medium">Доставка</span>
                </div>
              </button>
             </div>
           </div>

           {/* Payment Method Selection - Only show for delivery */}
           {selectedDeliveryType !== 'pickup' && (
             <div className="bg-card border border-white/12 rounded-2xl p-6">
               <h2 className="text-xl font-bold text-text mb-4">
                 <CreditCard size={20} className="inline mr-2" />
                 Начин на плащане *
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Delivery payment methods (3: Card at Address, 4: Cash at Address, 5: Online) */}
                 <button
                   type="button"
                   onClick={() => setPaymentMethodId(3)}
                   className={`p-4 rounded-lg border-2 transition-all ${
                     paymentMethodId === 3
                       ? 'border-yellow bg-yellow/10 text-yellow'
                       : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-yellow"></div>
                     <CreditCard size={20} />
                     <span className="font-medium">С карта на адрес</span>
                   </div>
                 </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethodId(4)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethodId === 4
                      ? 'border-yellow bg-yellow/10 text-yellow'
                      : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow"></div>
                    <Banknote size={20} />
                    <span className="font-medium">В брой на адрес</span>
                  </div>
                </button>

                {/* Online payment temporarily disabled */}
                {/* <button
                  type="button"
                  onClick={() => setPaymentMethodId(5)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethodId === 5
                      ? 'border-yellow bg-yellow/10 text-yellow'
                      : 'border-white/20 bg-white/5 text-text hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow"></div>
                    <Globe size={20} />
                    <span className="font-medium">Онлайн</span>
                  </div>
                </button> */}
               </div>
             </div>
           )}

           {/* Customer Information Form */}
           <form onSubmit={handleSubmit} className="bg-card border border-white/12 rounded-2xl p-6">
             <h2 className="text-xl font-bold text-text mb-6">Данни за доставка</h2>
             
             <div className="space-y-6">
            
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

            {/* Email - Only show for guest orders */}
            {orderType === 'guest' && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Имейл *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted focus:border-orange focus:outline-none transition-colors"
                  placeholder="example@email.com"
                  required
                />
                <div className="text-xs text-muted mt-1 flex items-center gap-2">
                  <Info size={14} className="text-blue" />
                  <span>Ще изпратим потвърждение за поръчката на този имейл</span>
                </div>
              </div>
            )}

            {/* Address - Only show for delivery */}
            {selectedDeliveryType !== 'pickup' && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Адрес *
                </label>
                
                {/* Address Input */}
                      <input
                        ref={addressInputRef}
                        type="text"
                        value={customerInfo.LocationText}
                        onChange={(e) => handleAddressChange(e.target.value)}
                  className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted focus:border-orange focus:outline-none transition-colors mb-3"
                        placeholder="Въведете адреса за доставка (ще се появят предложения)"
                        required
                      />
                      
                      {/* Autocomplete Info */}
                <div className="text-xs text-muted bg-blue/10 border border-blue/20 rounded-lg p-2 flex items-center gap-2 mb-3">
                        <Lightbulb size={14} className="text-blue" />
                        <span>Въведете адреса и ще се появят предложения за автоматично попъ€ане</span>
                      </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                          <button
                            type="button"
                  onClick={confirmAddress}
                  disabled={!customerInfo.LocationText}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 ${
                    addressConfirmed 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' 
                      : (customerInfo.LocationText && addressZone && addressZone !== 'outside')
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                        : 'bg-gradient-to-r from-orange to-red text-white hover:from-orange-600 hover:to-red-600'
                  }`}
                >
                  <CheckCircle size={16} />
                  {addressConfirmed ? 'Потвърден' : 'Потвърди адрес'}
                          </button>
                
                  <button
                    type="button"
                    onClick={() => {
                      setIsMapModalOpen(true)
                      // Reset confirmation state when opening modal
                      setAddressConfirmed(false)
                    }}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-orange to-red text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                  <MapPin size={16} />
                  Избери точна локация
                  </button>
               </div>
              </div>
            )}

             {/* Delivery Instructions - Only show for delivery */}
             {selectedDeliveryType !== 'pickup' && (
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
             )}
 

            {/* Cart Validation Message */}
            {cartValidationMessage && (
              <div className="bg-orange/10 border border-orange/20 rounded-xl p-4 mb-4">
                <h3 className="text-orange font-medium mb-2">
                  ⚠️ Продукти премахнати от количката
                </h3>
                <p className="text-sm text-muted">
                  {cartValidationMessage}
                </p>
              </div>
            )}

            {/* Unavailable Items Alert */}
            {unavailableItems.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                <h3 className="text-red-400 font-medium mb-2">
                  ⚠️ Някои продукти не са налични
                </h3>
                <p className="text-sm text-muted mb-2">
                  Следните продукти от предишната ви поръчка в момента не са налични:
                </p>
                <ul className="text-sm text-red-300 space-y-1">
                  {unavailableItems.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted mt-2">
                  Можете да продължите с наличните продукти или да добавите нови от менюто.
                </p>
              </div>
            )}

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
                    {!customerInfo.LocationText ? (
                      <span className="text-white">Не е въведен</span>
                    ) : addressConfirmed ? (
                      <span className="text-white">Потвърден</span>
                    ) : (
                      <span className="text-white">Не е потвърден</span>
                    )}
                  </span>
                </div>
              )}

              {/* Order Type Status */}
              {selectedDeliveryType !== 'pickup' && customerInfo.LocationCoordinates && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Тип на поръчка:</span>
                  <span className="text-white font-medium">
                    {addressZone === 'yellow' ? 'Доставка - Жълта зона' :
                     addressZone === 'blue' ? 'Доставка - Синя зона' :
                     'Доставка'}
                  </span>
                </div>
              )}


              {/* Order Total */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Сума на продуктите:</span>
                <CartSummaryDisplay />
              </div>

              {/* Delivery Cost */}
              {selectedDeliveryType !== 'pickup' && deliveryCost !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Доставка:</span>
                  <span className="text-white">
                    {deliveryCost === 0 ? (
                      <span className="text-white">Безплатна</span>
                    ) : (
                      <span className="text-white">{deliveryCost.toFixed(2)} €.</span>
                    )}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              <div className="border-t border-white/12 pt-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Обща сума:</span>
                  <span className="text-white">
                    {(totalPrice + (selectedDeliveryType === 'pickup' ? 0 : (deliveryCost || 0))).toFixed(2)} €.
                  </span>
                </div>
              </div>

              {/* Payment Initiation - Only show when online payment is selected */}
              {/* Online payment temporarily disabled */}
              {/* {paymentMethodId === 5 && (
                <div className="bg-card border border-white/12 rounded-2xl p-6 mt-6">
                  <h3 className="text-xl font-bold text-text mb-6 flex items-center">
                    <CreditCard size={20} className="mr-2" />
                    Онлайн плащане
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm text-gray-300 bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
                      <Lightbulb size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        Ще бъдете пренасочени към сигурен платежен портал за извършване на плащането.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-3"></div>
                          Иницииране на плащане...
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} className="inline mr-2" />
                          Продължи към плащане
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )} */}

              {/* Validation Messages */}
              <div className="space-y-2">
                {/* Minimum order amount errors by delivery zone */}
                {addressZone === 'yellow' && selectedDeliveryType !== 'pickup' && totalPrice < 15 && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="font-medium mb-1">Минимална сума за жълта зона</div>
                    <div>Минималната сума за доставка в жълта зона е 15 €. Текуща сума: {totalPrice.toFixed(2)} €.</div>
                  </div>
                )}
                
                {addressZone === 'blue' && selectedDeliveryType !== 'pickup' && totalPrice < 30 && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="font-medium mb-1">Минимална сума за синя зона</div>
                    <div>Минималната сума за доставка в синя зона е 30 €. Текуща сума: {totalPrice.toFixed(2)} €.</div>
                  </div>
                )}
                
                {/* General minimum order for pickup */}
                {selectedDeliveryType === 'pickup' && totalPrice < 15 && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="font-medium mb-1">Минимална сума за поръчка</div>
                    <div>Минималната сума за поръчка е 15 €. Текуща сума: {totalPrice.toFixed(2)} €.</div>
                  </div>
                )}
                
                {/* Address validation errors */}
                {selectedDeliveryType !== 'pickup' && !customerInfo.LocationText && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="font-medium mb-1">Адрес не е въведен</div>
                    <div>Моля, въведете адрес за доставка.</div>
                  </div>
                )}
                
                {selectedDeliveryType !== 'pickup' && customerInfo.LocationText && !addressConfirmed && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="font-medium mb-1">Адрес не е потвърден</div>
                    <div>Моля, кликнете "Потвърди адрес" или "Избери точна локация".</div>
                  </div>
                )}
                
                {selectedDeliveryType !== 'pickup' && addressZone === 'outside' && customerInfo.LocationText && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="font-medium mb-1">Доставка не е възможна</div>
                    <div>Доставката не е възможна на този адрес. Моля, изберете адрес в зоната за доставка.</div>
                  </div>
                )}
                
                {/* Order time validation */}
                {orderTime.type === null && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    <div className="font-medium mb-1">Време за поръчка не е избрано</div>
                    <div>Моля, изберете кога искате да получите поръчката.</div>
                  </div>
                )}

                
                {/* Action Buttons for Low Order */}
                {(totalPrice < 15 || (addressZone === 'blue' && selectedDeliveryType !== 'pickup' && totalPrice < 30)) && (
                  <div className="flex space-x-3">
                    <a
                      href="/order"
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-orange to-red text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Pizza size={16} />
                      Добави продукти
                    </a>
                  </div>
                )}
              </div>
            </div>

                 {/* Submit Button */}
                 <button
                   type="submit"
                   disabled={!isFormValid || isLoading}
                   className="w-full bg-gradient-to-r from-red to-orange text-white py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                 >
                   {isLoading ? (
                     <>
                       <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-3"></div>
                       Обработване на поръчката...
                     </>
                   ) : (
                     'Потвърди поръчката'
                   )}
                 </button>
             </div>
           </form>
        </div>
      </div>

      {/* Map Modal */}
      {isMapModalOpen && (
        <div className={styles.mapModalOverlay}>
          <div className={styles.mapModal}>
            <div className={styles.mapModalHeader}>
              <h3>Изберете адрес на картата</h3>
              <button 
                onClick={handleMapModalClose}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.mapModalContent}>
              {locationError && (
                <div className={styles.locationError}>
                  <XCircle size={16} />
                  <span>{locationError}</span>
                </div>
              )}
              <div 
                ref={mapModalRef} 
                className={styles.mapContainer}
              />
              <div className={styles.mapModalFooter}>
                <div className={styles.zoneLegend}>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: '#fbbf24' }}></div>
                    <span>Зона 1 (3 €.)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }}></div>
                    <span>Зона 2 (7 €.)</span>
                  </div>
                </div>
                <div className={styles.mapModalActions}>
                  <button 
                    onClick={handleMapModalClose}
                    className={styles.cancelButton}
                  >
                    Отказ
                  </button>
                  <button 
                    onClick={handleMapLocationSelect}
                    disabled={!hasMarker || (selectedDeliveryType !== 'pickup' && addressZone === 'outside')}
                    className={styles.confirmButton}
                  >
                    Потвърди адрес
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
