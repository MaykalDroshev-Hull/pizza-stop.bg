'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Lock, 
  MapPin, 
  Pizza, 
  Clock, 
  Heart, 
  Settings,
  LogOut,
  ArrowRight,
  Plus,
  Edit3,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { isRestaurantOpen } from '@/utils/openingHours'
import styles from './dashboard.module.css'
import { useLoginID } from '@/components/LoginIDContext'
import { useLoading } from '@/components/LoadingContext'
import { convertToBGN, formatBGNPrice } from '@/utils/currency'

interface User {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

interface Order {
  OrderID: string
  OrderDate: string
  TotalAmount: number
  Status: string
  StatusID?: number // Order status ID for progress bar
  PaymentMethod: string
  IsPaid: boolean
  DeliveryAddress: string
  OrderType?: number // 1 = collection, 2 = delivery
  ExpectedDT?: string // Expected delivery/collection time
  DeliveredDT?: string // Actual delivery/collection time
  Products: Array<{
    ProductID?: number | null
    ProductName: string
    ProductSize: string
    Quantity: number
    UnitPrice: number
    TotalPrice: number
    Addons: Array<{
      Name: string
      Price: number
      AddonType: string
    }>
    Comment?: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useLoginID()
  const { startLoading, stopLoading } = useLoading()
  const [activeTab, setActiveTab] = useState('orders')
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [favouriteOrder, setFavouriteOrder] = useState<Order | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [addressData, setAddressData] = useState({
    address: '',
    phone: '',
    addressInstructions: '',
    coordinates: null as { lat: number; lng: number } | null
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [hasFetchedData, setHasFetchedData] = useState(false)
  const [isOpen, setIsOpen] = useState(isRestaurantOpen())
  const successMessageRef = useRef<HTMLDivElement>(null)
  
  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    errors: [] as string[],
    showTooltip: false
  })
  
  // Address validation state
  const [addressZone, setAddressZone] = useState<'yellow' | 'blue' | 'outside' | null>(null)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [isValidatingAddress, setIsValidatingAddress] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  
  // Map modal state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [mapModalLoaded, setMapModalLoaded] = useState(false)
  const mapModalRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Load Google Maps script
  useEffect(() => {
    if (mapLoaded) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setMapLoaded(true)
    }

    script.onerror = () => {
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [mapLoaded])

  // Initialize autocomplete when map is loaded and address tab is active
  useEffect(() => {
    if (mapLoaded && addressInputRef.current && !autocompleteRef.current && activeTab === 'address') {
      // Add a small delay to ensure the input is fully rendered
      const timer = setTimeout(() => {
        if (addressInputRef.current && !autocompleteRef.current) {
          initializeAutocomplete()
        }
      }, 500) // 500ms delay to ensure input is ready

      return () => clearTimeout(timer)
    }
  }, [mapLoaded, activeTab])

  // Initialize map modal when opened
  useEffect(() => {
    if (isMapModalOpen && mapLoaded && mapModalRef.current && !mapModalLoaded) {
      const initMap = () => {
        if (!window.google?.maps) return

        const map = new window.google.maps.Map(mapModalRef.current!, {
          center: { lat: 43.1333, lng: 24.7167 }, // Lovech center
          zoom: 13,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          // Use default map style to ensure streets are visible
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
            map.setZoom(18) // This gives approximately 25 meter radius
            
            // Add marker at user location
            markerRef.current = new window.google.maps.Marker({
              position: userLocation,
              map: map,
              draggable: true,
              title: 'Вашата локация'
            })

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
            // Continue with default map view if location fails
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

        // Yellow zone (Lovech city)
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

  // Re-initialize autocomplete when the address tab becomes active
  useEffect(() => {
    if (activeTab === 'address' && mapLoaded && addressInputRef.current && autocompleteRef.current) {
      // Re-bind autocomplete to ensure it works when tab is switched
      setTimeout(() => {
        if (addressInputRef.current && autocompleteRef.current) {
          // Set bounds using the setBounds method instead of bindTo
          autocompleteRef.current.setBounds(new google.maps.LatLngBounds())
        }
      }, 100)
    }
  }, [activeTab, mapLoaded])

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/user')
      return
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (user && !hasFetchedData) {
      fetchUserData()
      setHasFetchedData(true)
    }
  }, [user, hasFetchedData]) // Run when user changes and data hasn't been fetched

  // Initialize profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  // Update restaurant open/closed status every minute
  useEffect(() => {
    const updateStatus = () => {
      setIsOpen(isRestaurantOpen())
    }
    
    // Update immediately
    updateStatus()
    
    // Update every minute
    const interval = setInterval(updateStatus, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Ref to track if refresh is in progress to prevent multiple simultaneous calls
  const isRefreshingStatusesRef = useRef(false)
  
  // Ref to store current orders without causing re-renders
  const ordersRef = useRef<Order[]>([])
  
  // Update ref when orders change
  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  // Function to refresh statuses of active orders only
  const refreshActiveOrderStatuses = useCallback(async () => {
    if (!user || isRefreshingStatusesRef.current) return

    const currentOrders = ordersRef.current
    
    if (currentOrders.length === 0) return

    // Get active orders (not delivered and not cancelled)
    const activeOrders = currentOrders.filter(order => {
      const statusID = order.StatusID
      return statusID && statusID !== 6 && statusID !== 7 // Not delivered and not cancelled
    })

    if (activeOrders.length === 0) return

    try {
      isRefreshingStatusesRef.current = true
      const orderIds = activeOrders.map(order => order.OrderID)
      
      const response = await fetch('/api/user/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds })
      })

      if (response.ok) {
        const data = await response.json()
        const statusMap = data.statuses || {}

        // Update orders with new statuses using functional update to avoid dependency
        setOrders(prevOrders => 
          prevOrders.map(order => {
            const newStatus = statusMap[order.OrderID]
            if (newStatus) {
              return {
                ...order,
                StatusID: newStatus.StatusID,
                Status: newStatus.Status
              }
            }
            return order
          })
        )
      }
    } catch (err) {
      // Silently fail - don't show error for background refresh
    } finally {
      isRefreshingStatusesRef.current = false
    }
  }, [user]) // Removed 'orders' from dependencies to prevent infinite loop

  // Auto-refresh active order statuses every 30 seconds
  useEffect(() => {
    if (activeTab !== 'orders' || !user) return

    // Check if there are any active orders before setting up refresh
    const hasActiveOrders = orders.some(order => {
      const statusID = order.StatusID
      return statusID && statusID !== 6 && statusID !== 7
    })

    if (!hasActiveOrders) return

    // Refresh immediately when orders tab is active and has active orders
    refreshActiveOrderStatuses()

    // Set up interval to refresh every 30 seconds
    const interval = setInterval(() => {
      // Check again if there are still active orders before refreshing
      const stillHasActiveOrders = ordersRef.current.some(order => {
        const statusID = order.StatusID
        return statusID && statusID !== 6 && statusID !== 7
      })
      
      if (stillHasActiveOrders) {
        refreshActiveOrderStatuses()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [activeTab, user, refreshActiveOrderStatuses]) // Refresh when tab changes or refresh function changes

  const fetchUserData = async () => {
    if (!user) return
    
    try {
      startLoading()
      
      // Fetch user's orders
      const token = localStorage.getItem('auth_token')
      const authHdrs: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {}
      const ordersResponse = await fetch(`/api/user/orders?userId=${user.id}`, { headers: authHdrs })
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const sortedOrders = (ordersData.orders || []).sort((a: Order, b: Order) => 
          new Date(b.OrderDate).getTime() - new Date(a.OrderDate).getTime()
        )
        setOrders(sortedOrders)
        
        // Find favourite order (most ordered)
        if (ordersData.orders && ordersData.orders.length > 0) {
          const orderCounts = new Map<string, number>()
          ordersData.orders.forEach((order: Order) => {
            const key = JSON.stringify(order.Products.map(p => p.ProductName).sort())
            orderCounts.set(key, (orderCounts.get(key) || 0) + 1)
          })
          
          let maxCount = 0
          let favourite: Order | null = null
          
          ordersData.orders.forEach((order: Order) => {
            const key = JSON.stringify(order.Products.map(p => p.ProductName).sort())
            const count = orderCounts.get(key) || 0
            if (count > maxCount) {
              maxCount = count
              favourite = order
            }
          })
          
          setFavouriteOrder(favourite)
        }
      }
      
      // Fetch user profile data
      const profileResponse = await fetch(`/api/user/profile?userId=${user.id}`, { headers: authHdrs })
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.user) {
          // Update address data with existing user data
          let coordinates = null
          if (profileData.user.LocationCoordinates) {
            try {
              let parsedCoords = typeof profileData.user.LocationCoordinates === 'string' 
                ? JSON.parse(profileData.user.LocationCoordinates)
                : profileData.user.LocationCoordinates
              
              // Fix typo in database: "Ing" should be "lng"
              if (parsedCoords && parsedCoords.Ing !== undefined) {
                parsedCoords.lng = parsedCoords.Ing
                delete parsedCoords.Ing
              }
              
              coordinates = parsedCoords
            } catch {
            }
          }
          
          setAddressData({
            address: profileData.user.LocationText || '',
            phone: profileData.user.phone || '',
            addressInstructions: profileData.user.addressInstructions || '',
            coordinates: coordinates
          })
          
          // Validate existing coordinates if available
          if (coordinates) {
            validateAddressZone(coordinates)
          }
        }
      }
      
    } catch {
      setError('Грешка при зареждане на данните')
    } finally {
      stopLoading()
    }
  }

  // Function to manually refresh all orders
  const handleRefreshOrders = async () => {
    if (!user) return
    
    try {
      setIsRefreshing(true)
      await fetchUserData()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/user')
  }

  // Email validation function (same as in user page)
  const validateEmail = (email: string) => {
    const errors: string[] = []
    
    if (!email) {
      return { isValid: true, errors: [] }
    }

    // Check for exactly one @ symbol
    const atCount = (email.match(/@/g) || []).length
    if (atCount === 0) {
      errors.push('Имейлът трябва да съдържа символ @')
    } else if (atCount > 1) {
      errors.push('Имейлът може да съдържа само един символ @')
    }

    if (atCount === 1) {
      const [localPart, domainPart] = email.split('@')
      
      // Local part validation
      if (!localPart) {
        errors.push('Частта преди @ не може да бъде празна')
      } else {
        // Check for consecutive dots
        if (localPart.includes('..')) {
          errors.push('Не са позволени последователни точки (..)')
        }
        
        // Check if starts or ends with dot
        if (localPart.startsWith('.') || localPart.endsWith('.')) {
          errors.push('Частта преди @ не може да започва или завършва с точка')
        }
        
        // Check allowed characters in local part
        const localPartRegex = /^[a-zA-Z0-9._+-]+$/
        if (!localPartRegex.test(localPart)) {
          errors.push('Частта преди @ може да съдържа само букви, цифри, точки, долни черти, тирета и плюсове')
        }
      }
      
      // Domain part validation
      if (!domainPart) {
        errors.push('Частта след @ не може да бъде празна')
      } else {
        // Check for at least one dot
        if (!domainPart.includes('.')) {
          errors.push('Домейнът трябва да съдържа поне една точка')
        }
        
        // Check for consecutive dots
        if (domainPart.includes('..')) {
          errors.push('Не са позволени последователни точки (..) в домейна')
        }
        
        // Check if starts or ends with dot
        if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
          errors.push('Домейнът не може да започва или завършва с точка')
        }
        
        // Check allowed characters in domain
        const domainRegex = /^[a-zA-Z0-9.-]+$/
        if (!domainRegex.test(domainPart)) {
          errors.push('Домейнът може да съдържа само букви, цифри, тирета и точки')
        }
        
        // Check domain labels don't start/end with -
        const domainLabels = domainPart.split('.')
        for (const label of domainLabels) {
          if (label.startsWith('-') || label.endsWith('-')) {
            errors.push('Частите на домейна не могат да започват или завършват с тире')
            break
          }
        }
        
        // Check top-level domain is at least 2 characters
        const topLevelDomain = domainLabels[domainLabels.length - 1]
        if (topLevelDomain && topLevelDomain.length < 2) {
          errors.push('Домейнът от най-високо ниво трябва да бъде поне 2 символа дълъг')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Phone validation function
  const validatePhone = (phone: string) => {
    if (!phone) return { isValid: true, error: '' }
    
    // Bulgarian phone number validation
    const phoneRegex = /^(\+359|0)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return { 
        isValid: false, 
        error: 'Моля, въведете валиден български телефонен номер (напр. 0888123456 или +359888123456)' 
      }
    }
    
    return { isValid: true, error: '' }
  }

  // Handle profile data changes
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'email') {
      const validation = validateEmail(value)
      setEmailValidation({ ...validation, showTooltip: false })
    }
  }

  // Handle profile edit start
  const handleEditProfile = () => {
    setIsEditingProfile(true)
    setError('')
    setUpdateSuccess('')
  }

  // Handle profile edit cancel
  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setError('')
    setUpdateSuccess('')
    // Reset to original user data
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
    setEmailValidation({ isValid: true, errors: [], showTooltip: false })
  }

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email
    if (profileData.email) {
      const emailValidation = validateEmail(profileData.email)
      if (!emailValidation.isValid) {
        setError('Моля, въведете валиден имейл адрес')
        setEmailValidation({ ...emailValidation, showTooltip: true })
        setTimeout(() => {
          setEmailValidation(prev => ({ ...prev, showTooltip: false }))
        }, 3000)
        return
      }
    }
    
    // Validate phone
    const phoneValidation = validatePhone(profileData.phone)
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error)
      return
    }
    
    setIsUpdating(true)
    setError('')
    setUpdateSuccess('')
    
    try {
      const putToken = localStorage.getItem('auth_token')
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(putToken ? { 'Authorization': `Bearer ${putToken}` } : {})
        },
        body: JSON.stringify({
          userId: user?.id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Грешка при обновяване на профила')
      }
      
      setUpdateSuccess('Профилът е обновен успешно!')
      setIsEditingProfile(false)
      
      // Update user context with new data
      updateUser({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone
      })
      
    } catch (err: any) {
      setError(err.message || 'Грешка при обновяване на профила')
    } finally {
      setIsUpdating(false)
    }
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

  const initializeAutocomplete = () => {
    if (mapLoaded && addressInputRef.current && !autocompleteRef.current) {
      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'bg' },
          fields: ['formatted_address', 'geometry', 'place_id']
        })

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          
          if (place?.geometry?.location) {
            const coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
            
            setAddressData(prev => ({
              ...prev,
              address: place.formatted_address || '',
              coordinates: coordinates
            }))
            validateAddressZone(coordinates)
          }
        })
      } catch {
      }
    }
  }

  const validateAddressZone = (coordinates: { lat: number; lng: number } | null): 'blue' | 'yellow' | 'outside' | null => {
    if (!coordinates) {
      setAddressZone(null)
      setAddressConfirmed(false)
      return null
    }

    if (!coordinates.lat || !coordinates.lng) {
      setAddressZone(null)
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
    
    // Only confirm address if it's within delivery zone
    if (zone === 'outside') {
      setAddressConfirmed(false)
    } else {
      setAddressConfirmed(true)
    }
    
    return zone
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Новите пароли не съвпадат')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Паролата трябва да е поне 6 символа дълга')
      return
    }
    
    setIsUpdating(true)
    setError('')
    setUpdateSuccess('')
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Грешка при промяна на паролата')
      }
      
      setUpdateSuccess('Паролата е променена успешно!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      
    } catch (err: any) {
      setError(err.message || 'Грешка при промяна на паролата')
    } finally {
      setIsUpdating(false)
    }
  }

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


  const handleMapModalClose = () => {
    setIsMapModalOpen(false)
    setMapModalLoaded(false)
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null
    }
  }

  const handleMapLocationSelect = async () => {
    if (markerRef.current && addressZone && addressZone !== 'outside') {
      const position = markerRef.current.getPosition()
      if (position) {
        const lat = position.lat()
        const lng = position.lng()
        
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder()
        try {
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results) {
                resolve(results)
              } else {
                reject(new Error(`Geocoding failed: ${status}`))
              }
            })
          })
          
          if (result[0]) {
            setAddressData(prev => ({
              ...prev,
              address: result[0].formatted_address,
              coordinates: { lat, lng }
            }))
            handleMapModalClose()
          }
        } catch {
        }
      }
    }
  }

  const handleAddressUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If no coordinates from autocomplete, try to geocode manually
    if (!addressData.coordinates && addressData.address) {
      try {
        const geocoder = new google.maps.Geocoder()
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: addressData.address }, (results, status) => {
            if (status === 'OK' && results) {
              resolve(results)
            } else {
              reject(new Error(`Geocoding failed: ${status}`))
            }
          })
        })
        
        if (result[0]?.geometry?.location) {
          const coordinates = {
            lat: result[0].geometry.location.lat(),
            lng: result[0].geometry.location.lng()
          }
          setAddressData(prev => ({ ...prev, coordinates }))
          validateAddressZone(coordinates)
        }
      } catch {
        setError('Не можахме да намерим координатите на адреса. Моля, опитайте отново.')
        return
      }
    }
    
    // Validate address is within delivery zone
    if (!addressConfirmed || addressZone === 'outside') {
      setError('Моля, изберете адрес в зоната за доставка')
      return
    }
    
    if (!addressData.coordinates) {
      setError('Моля, изберете адрес с валидни координати')
      return
    }
    
    setIsUpdating(true)
    setError('')
    setUpdateSuccess('')
    
    try {
      const response = await fetch('/api/user/update-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          address: {
            ...addressData,
            coordinates: JSON.stringify(addressData.coordinates)
          }
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Грешка при обновяване на адреса')
      }
      
      setUpdateSuccess('Адресът е обновен успешно!')
      
      // Scroll to success message smoothly
      setTimeout(() => {
        successMessageRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
      
    } catch (err: any) {
      setError(err.message || 'Грешка при обновяване на адреса')
    } finally {
      setIsUpdating(false)
    }
  }

  // Order status definitions based on ID
  const ORDER_STATUSES = [
    { id: 1, text: 'Приета', progress: 0, color: '#3b82f6' }, // Blue
    { id: 2, text: 'В процес на приготвяне', progress: 20, color: '#fbbf24' }, // Yellow
    { id: 3, text: 'Приготвена', progress: 40, color: '#f59e0b' }, // Orange
    { id: 4, text: 'При шофьора', progress: 60, color: '#8b5cf6' }, // Purple
    { id: 5, text: 'В процес на доставка', progress: 80, color: '#10b981' }, // Green
    { id: 6, text: 'Доставена', progress: 100, color: '#22c55e' }, // Bright Green
    { id: 7, text: 'Отменена', progress: 0, color: '#ef4444' } // Red
  ] as const

  // Helper function to get status info by ID or text
  const getStatusInfo = (statusID?: number, statusText?: string) => {
    // First try to get by ID
    if (statusID) {
      const status = ORDER_STATUSES.find(s => s.id === statusID)
      if (status) return status
    }
    
    // Fallback to text matching
    if (statusText) {
      const statusLower = statusText.toLowerCase()
      if (statusLower.includes('приета') || statusLower.includes('accepted')) {
        return ORDER_STATUSES[0]
      }
      if (statusLower.includes('приготвяне') || statusLower.includes('preparation')) {
        return ORDER_STATUSES[1]
      }
      if (statusLower.includes('приготвена') || statusLower.includes('ready') || statusLower.includes('prepared')) {
        return ORDER_STATUSES[2]
      }
      if (statusLower.includes('шофьора') || statusLower.includes('driver')) {
        return ORDER_STATUSES[3]
      }
      if (statusLower.includes('доставка') || statusLower.includes('delivery')) {
        return ORDER_STATUSES[4]
      }
      if (statusLower.includes('доставена') || statusLower.includes('delivered')) {
        return ORDER_STATUSES[5]
      }
      if (statusLower.includes('отменена') || statusLower.includes('cancelled') || statusLower.includes('canceled')) {
        return ORDER_STATUSES[6]
      }
    }
    
    // Default to first status
    return ORDER_STATUSES[0]
  }

  const handleOrderAgain = async (order: Order) => {
    try {
      startLoading()
      
      // Get current menu to check product availability
      const { fetchMenuData } = await import('../../lib/menuData')
      const menuData = await fetchMenuData()
      
      // Flatten all products from all categories
      const availableProducts = [
        ...menuData.pizza,
        ...menuData.burgers,
        ...menuData.doners,
        ...menuData.drinks,
        ...(menuData.sauces || [])
      ] as any[]
      
      // Map order products to cart items, checking availability
      const cartItems: any[] = []
      const unavailableItems: string[] = []
      
      for (const orderProduct of order.Products) {
        // Check if this is a 50/50 pizza (name contains "/" separator)
        const isFiftyFifty = orderProduct.ProductName.includes(' / ') || 
                            (orderProduct.Comment && orderProduct.Comment.includes('50/50'))
        
          if (isFiftyFifty) {
          // Handle 50/50 pizza - validate individual pizza components
          const pizzaNames = orderProduct.ProductName.split(' / ').map(name => name.trim())
          let allPizzasAvailable = true

          // Check if all individual pizzas are still available
          for (const pizzaName of pizzaNames) {
            const availablePizza = availableProducts.find((p: any) => p.name === pizzaName)
            if (!availablePizza) {
              allPizzasAvailable = false
              break
            }
          }

          if (allPizzasAvailable) {
            const unitPrice = typeof orderProduct.UnitPrice === 'number'
              ? orderProduct.UnitPrice
              : Number(orderProduct.UnitPrice) || 0
            const quantity = typeof orderProduct.Quantity === 'number'
              ? orderProduct.Quantity
              : Number(orderProduct.Quantity) || 1

            // Parse addons from JSON string if needed
            let parsedAddons: Array<{ Name: string; Price: number; AddonType: string }> = []
            if (orderProduct.Addons) {
              if (typeof orderProduct.Addons === 'string') {
                try {
                  parsedAddons = JSON.parse(orderProduct.Addons)
                } catch (e) {
                  // If parsing fails, use empty array
                  console.warn('Failed to parse addons for 50/50 pizza:', e)
                  parsedAddons = []
                }
              } else {
                parsedAddons = Array.isArray(orderProduct.Addons)
                  ? (orderProduct.Addons as Array<{ Name: string; Price: number; AddonType: string }>)
                  : []
              }

              parsedAddons = parsedAddons.map(addon => ({
                ...addon,
                Price: typeof addon.Price === 'number' ? addon.Price : Number(addon.Price) || 0
              }))
            }

            // Create cart item for 50/50 pizza
            const cartItem = {
              id: `${Date.now()}-${Math.random()}`, // Unique string ID for 50/50 pizza
              name: orderProduct.ProductName,
              price: unitPrice,
              image: '🍕',
              category: 'pizza-5050', // Special category for 50/50 pizzas
              size: orderProduct.ProductSize || 'Голяма',
              addons: parsedAddons,
              comment: orderProduct.Comment || '',
              quantity
            }
            cartItems.push(cartItem)
          } else {
            // 50/50 pizza contains disabled pizzas
            unavailableItems.push(orderProduct.ProductName)
          }
        } else {
          // Regular product - find matching product in current menu
          // First try to match by ProductID (most reliable)
          let availableProduct: any = null
          
          if (orderProduct.ProductID) {
            availableProduct = availableProducts.find((p: any) => 
              p.id === orderProduct.ProductID
            )
          }
          
          // Fallback to name matching if ProductID is not available or not found
          // (for backward compatibility with older orders or 50/50 pizzas)
          if (!availableProduct) {
            // Remove size information from order product name (e.g., "Акапулко (30)" -> "Акапулко")
            const cleanOrderName = orderProduct.ProductName
              .replace(/\s*\([0-9]+\)\s*$/, '') // Remove trailing "(30)" or "(60)"
              .trim()
            
            // Try exact match first
            availableProduct = availableProducts.find((p: any) => 
              p.name === orderProduct.ProductName || p.name === cleanOrderName
            )
            
            // If exact match fails, try normalized match (trim whitespace, case-insensitive)
            if (!availableProduct) {
              const normalizedOrderName = cleanOrderName.toLowerCase()
              availableProduct = availableProducts.find((p: any) => 
                p.name.trim().toLowerCase() === normalizedOrderName
              )
            }
          }
          
          if (availableProduct) {
            const unitPrice = typeof orderProduct.UnitPrice === 'number'
              ? orderProduct.UnitPrice
              : Number(orderProduct.UnitPrice) || 0
            const quantity = typeof orderProduct.Quantity === 'number'
              ? orderProduct.Quantity
              : Number(orderProduct.Quantity) || 1

            // Parse addons from JSON string if needed
            let parsedAddons: Array<{ Name: string; Price: number; AddonType: string }> = []
            if (orderProduct.Addons) {
              if (typeof orderProduct.Addons === 'string') {
                try {
                  parsedAddons = JSON.parse(orderProduct.Addons)
                } catch (e) {
                  console.warn('Failed to parse addons:', e)
                  parsedAddons = []
                }
              } else {
                parsedAddons = Array.isArray(orderProduct.Addons) ? orderProduct.Addons : []
              }

              parsedAddons = parsedAddons.map(addon => ({
                ...addon,
                Price: typeof addon.Price === 'number' ? addon.Price : Number(addon.Price) || 0
              }))
            }
            
            // Product is available - add to cart
            const cartItem = {
              id: `${availableProduct.id}-${Date.now()}-${Math.random()}`, // Unique ID for cart item
              productId: typeof availableProduct.id === 'number'
                ? availableProduct.id
                : Number(availableProduct.id) || undefined, // CRITICAL: Database ProductID for backend validation
              name: orderProduct.ProductName,
              price: unitPrice,
              image: availableProduct.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNjY2NjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5GVPzwvdGV4dD4KPC9zdmc+',
              category: availableProduct.category || 'pizza',
              size: orderProduct.ProductSize || 'Medium',
              addons: parsedAddons,
              comment: orderProduct.Comment || '',
              quantity
            }
            cartItems.push(cartItem)
          } else {
            // Product is unavailable
            unavailableItems.push(orderProduct.ProductName)
          }
        }
      }
      
      // Clear current cart and add items
      if (typeof window !== 'undefined') {
        localStorage.setItem('pizza-stop-cart', JSON.stringify(cartItems))
        
        // Store order type and unavailable items info for checkout
        const orderInfo = {
          isCollection: order.OrderType === 1, // 1 = collection, 2 = delivery
          unavailableItems
        }
        localStorage.setItem('pizza-stop-order-again', JSON.stringify(orderInfo))
      }
      
      // Navigate to checkout
      router.push('/checkout')
      
    } catch (err: any) {
      setError('Грешка при зареждане на поръчката. Моля, опитайте отново.')
    } finally {
      stopLoading()
    }
  }

  if (authLoading) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <User size={24} />
            </div>
            <div>
              <h1>Добре дошли обратно, {user.name}!</h1>
              <p>{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            Изход
          </button>
        </header>

        {/* Navigation Tabs */}
        <nav className={styles.tabs}>
                     <button
             className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
             onClick={() => setActiveTab('orders')}
           >
             <Pizza size={20} />
             Поръчки
           </button>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            Профил
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            Настройки
          </button>
        </nav>

        {/* Error and Success Messages */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {updateSuccess && <div ref={successMessageRef} className={styles.successMessage}>{updateSuccess}</div>}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>
            {/* Favourite Order */}
            {favouriteOrder && (
              <section className={styles.favouriteOrder}>
                <div className={styles.sectionHeader}>
                  <Heart className={styles.sectionIcon} size={24} />
                  <h2>Вашата любима поръчка</h2>
                </div>
                <div className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <h3>Поръчка #{favouriteOrder.OrderID}</h3>
                    </div>
                    <div className={styles.orderTotal}>
                      {favouriteOrder.TotalAmount.toFixed(2)} €. <span className="text-muted text-sm font-normal">({formatBGNPrice(convertToBGN(favouriteOrder.TotalAmount))})</span>
                    </div>
                  </div>
                  <div className={styles.orderProducts}>
                    {favouriteOrder.Products.map((product, index) => (
                      <div key={index} className={styles.productItem}>
                        <div className={styles.productMain}>
                          <span className={styles.productName}>{product.ProductName}</span>
                          <span className={styles.productSize}>{product.ProductSize}</span>
                          <span className={styles.productQuantity}>x{product.Quantity}</span>
                          <span className={styles.productPrice}>{product.TotalPrice.toFixed(2)} €. <span className="text-muted text-sm font-normal">({formatBGNPrice(convertToBGN(product.TotalPrice))})</span></span>
                        </div>
                        {product.Addons && product.Addons.length > 0 && (
                          <div className={styles.productAddons}>
                            {product.Addons.map((addon, addonIndex) => (
                              <span key={addonIndex} className={styles.addonItem}>
                                {addon.Name}
                                {addon.Price > 0 && (
                                  <> (+{addon.Price.toFixed(2)} €. <span className="text-muted text-xs">({formatBGNPrice(convertToBGN(addon.Price))})</span>)</>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                        {product.Comment && (
                          <div className={styles.productComment}>
                            <em>"{product.Comment}"</em>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleOrderAgain(favouriteOrder)}
                    className={styles.orderAgainBtn}
                  >
                    <Plus size={16} />
                    Поръчай отново
                  </button>
                </div>
              </section>
            )}

            {/* Recent Orders */}
            <section className={styles.recentOrders}>
              <div className={styles.sectionHeader}>
                <Clock className={styles.sectionIcon} size={24} />
                <h2>Последни поръчки</h2>
                <button
                  onClick={handleRefreshOrders}
                  disabled={isRefreshing}
                  className={styles.refreshButton}
                  title="Обнови поръчките"
                >
                  <RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />
                </button>
              </div>
              {orders.length > 0 ? (
                <div className={styles.ordersList}>
                  {orders.slice(0, 5).map((order) => {
                    const statusInfo = getStatusInfo(order.StatusID, order.Status)
                    const isCancelled = statusInfo.id === 7
                    
                    return (
                    <div key={order.OrderID} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0 }}>Поръчка #{order.OrderID}</h3>
                            <span className={styles.orderStatusText} style={{ color: statusInfo.color }}>
                              {statusInfo.text}
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          {!isCancelled ? (
                            <div className={styles.progressBarContainer}>
                              <div className={styles.progressBarTrack}>
                                <div 
                                  className={styles.progressBarFill}
                                  style={{
                                    width: `${statusInfo.progress}%`,
                                    backgroundColor: statusInfo.color,
                                    boxShadow: `0 0 12px ${statusInfo.color}40`
                                  }}
                                />
                              </div>
                              <div className={styles.progressBarSteps}>
                                {ORDER_STATUSES.filter(s => s.id !== 7).map((status, index, array) => {
                                  const isActive = statusInfo.id >= status.id
                                  const isCurrent = statusInfo.id === status.id
                                  const nextStatus = array[index + 1]
                                  const isNextActive = nextStatus && statusInfo.id >= nextStatus.id
                                  
                                  return (
                                    <div
                                      key={status.id}
                                      className={`${styles.progressBarStep} ${isActive ? styles.active : ''} ${isCurrent ? styles.current : ''}`}
                                      title={status.text}
                                    >
                                      <div
                                        className={styles.progressBarStepDot}
                                        style={{
                                          backgroundColor: isActive ? statusInfo.color : 'rgba(255, 255, 255, 0.2)',
                                          borderColor: isActive ? statusInfo.color : 'rgba(255, 255, 255, 0.3)',
                                          boxShadow: isCurrent ? `0 0 8px ${statusInfo.color}` : 'none'
                                        }}
                                      />
                                      {index < array.length - 1 && (
                                        <div
                                          className={styles.progressBarStepLine}
                                          style={{
                                            backgroundColor: isNextActive ? statusInfo.color : 'rgba(255, 255, 255, 0.1)',
                                            opacity: isNextActive ? 0.6 : 1
                                          }}
                                        />
                                      )}
                                      <span
                                        className={styles.progressBarStepLabel}
                                        style={{
                                          color: isActive ? statusInfo.color : 'var(--muted)',
                                          fontWeight: isCurrent ? 600 : 400
                                        }}
                                      >
                                        {status.text}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className={styles.cancelledStatus}>
                              <XCircle size={16} />
                              <span>Поръчката е отменена</span>
                            </div>
                          )}
                          <p className={styles.orderDate}>
                            <Clock size={16} />
                            Поръчана: {new Date(order.OrderDate).toLocaleDateString('bg-BG')} в {new Date(order.OrderDate).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {order.ExpectedDT && (
                            <p className={styles.orderDate}>
                              <Clock size={16} />
                              {order.DeliveredDT 
                                ? (order.OrderType === 1 ? 'Взета' : 'Доставена') + ': ' + new Date(order.DeliveredDT).toLocaleDateString('bg-BG') + ' в ' + new Date(order.DeliveredDT).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
                                : (order.OrderType === 1 ? 'За вземане' : 'За доставка') + ': ' + new Date(order.ExpectedDT).toLocaleDateString('bg-BG') + ' в ' + new Date(order.ExpectedDT).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })
                              }
                            </p>
                          )}
                        </div>
                        <div className={styles.orderTotal}>
                          {order.TotalAmount.toFixed(2)} €. <span className="text-muted text-sm font-normal">({formatBGNPrice(convertToBGN(order.TotalAmount))})</span>
                        </div>
                      </div>
                      <div className={styles.orderProducts}>
                        {order.Products.slice(0, 2).map((product, index) => (
                          <div key={index} className={styles.productItem}>
                            <div className={styles.productMain}>
                              <span className={styles.productName}>{product.ProductName}</span>
                              <span className={styles.productSize}>{product.ProductSize}</span>
                              <span className={styles.productQuantity}>x{product.Quantity}</span>
                              <span className={styles.productPrice}>{product.TotalPrice.toFixed(2)} €. <span className="text-muted text-sm font-normal">({formatBGNPrice(convertToBGN(product.TotalPrice))})</span></span>
                            </div>
                            {product.Addons && product.Addons.length > 0 && (
                              <div className={styles.productAddons}>
                                {product.Addons.slice(0, 2).map((addon, addonIndex) => (
                                  <span key={addonIndex} className={styles.addonItem}>
                                    {addon.Name}
                                    {addon.Price > 0 && (
                                      <> (+{addon.Price.toFixed(2)} €. <span className="text-muted text-xs">({formatBGNPrice(convertToBGN(addon.Price))})</span>)</>
                                    )}
                                  </span>
                                ))}
                                {product.Addons.length > 2 && (
                                  <span className={styles.moreAddons}>+{product.Addons.length - 2} още</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {order.Products.length > 2 && (
                          <p className={styles.moreItems}>+{order.Products.length - 2} още продукти</p>
                        )}
                      </div>
                      <div className={styles.orderActions}>
                        <button 
                          onClick={() => handleOrderAgain(order)}
                          className={styles.orderAgainBtn}
                        >
                          <Plus size={16} />
                          Поръчай отново
                        </button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h3>Все още нямате поръчки</h3>
                  <p>Започнете първата си поръчка и ще я покажем тук!</p>
                  <div className={styles.emptyStateButton}>
                    <button 
                      onClick={() => router.push('/order')}
                      className={styles.navbarStyleBtn}
                    >
                      {isOpen ? 'ПОРЪЧАЙ СЕГА' : 'ПОРЪЧАЙ ЗА ПО-КЪСНО'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            <section className={styles.profileSection}>
              <div className={styles.sectionHeader}>
                <User className={styles.sectionIcon} size={24} />
                <h2>Лична информация</h2>
                {!isEditingProfile && (
                  <button 
                    onClick={handleEditProfile}
                    className={styles.editButton}
                  >
                    <Edit3 size={16} />
                    Редактирай
                  </button>
                )}
              </div>
              
              {!isEditingProfile ? (
                <div className={styles.profileInfo}>
                  <div className={styles.infoRow}>
                    <label>Име:</label>
                    <span>{user.name}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>Имейл:</label>
                    <span>{user.email}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>Телефон:</label>
                    <span>{user.phone || 'Не е предоставен'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <label>Член от:</label>
                    <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Не е налична'}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="profileName">Име</label>
                    <input
                      type="text"
                      id="profileName"
                      value={profileData.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="profileEmail">Имейл</label>
                      <input
                        type="email"
                        id="profileEmail"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        onFocus={() => {
                          if (!emailValidation.isValid && profileData.email) {
                            setEmailValidation(prev => ({ ...prev, showTooltip: true }))
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setEmailValidation(prev => ({ ...prev, showTooltip: false }))
                          }, 100)
                        }}
                        className={!emailValidation.isValid && profileData.email ? styles.invalidInput : ''}
                        required
                      />
                      {!emailValidation.isValid && profileData.email && (
                        <AlertCircle 
                          className={styles.validationIcon} 
                          size={18} 
                          onMouseEnter={() => setEmailValidation(prev => ({ ...prev, showTooltip: true }))}
                          onMouseLeave={() => setEmailValidation(prev => ({ ...prev, showTooltip: false }))}
                        />
                      )}
                      {emailValidation.showTooltip && !emailValidation.isValid && emailValidation.errors.length > 0 && (
                        <div className={styles.validationTooltip}>
                          <div className={styles.tooltipContent}>
                            {emailValidation.errors.map((error, index) => (
                              <div key={index} className={styles.tooltipError}>
                                {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="profilePhone">Телефон</label>
                    <input
                      type="tel"
                      id="profilePhone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="0888123456 или +359888123456"
                      required
                    />
                  </div>
                  
                  <div className={styles.formActions}>
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className={styles.cancelButton}
                      disabled={isUpdating}
                    >
                      Отказ
                    </button>
                    <button 
                      type="submit" 
                      className={styles.primaryBtn}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Запазване...' : 'Запази промените'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            {/* Change Password */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <Lock className={styles.sectionIcon} size={24} />
                                 <h2>Промяна на парола</h2>
              </div>
              <form onSubmit={handlePasswordChange} className={styles.form}>
                <div className={styles.formGroup}>
                                       <label htmlFor="currentPassword">Текуща парола</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                                       <label htmlFor="newPassword">Нова парола</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                                       <label htmlFor="confirmPassword">Потвърди нова парола</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className={styles.primaryBtn}
                  disabled={isUpdating}
                >
                                     {isUpdating ? 'Обновяване...' : 'Промени парола'}
                </button>
              </form>
            </section>

            {/* Update Address */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <MapPin className={styles.sectionIcon} size={24} />
                                 <h2>Адрес за доставка</h2>
              </div>
                             <form onSubmit={handleAddressUpdate} className={styles.form}>
                 <div className={styles.formGroup}>
                   <label htmlFor="address">Адрес</label>
                   <div className={styles.addressInputContainer}>
                     <input
                       ref={addressInputRef}
                       type="text"
                       id="address"
                       value={addressData.address}
                       onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
                       onFocus={() => {
                         // Initialize autocomplete when user focuses on the input
                         if (mapLoaded && addressInputRef.current && !autocompleteRef.current) {
                           initializeAutocomplete()
                         }
                       }}
                       onClick={() => {
                         // Also initialize on click as a fallback
                         if (mapLoaded && addressInputRef.current && !autocompleteRef.current) {
                           initializeAutocomplete()
                         }
                       }}
                       placeholder="Въведете адрес (напр. ул. Христо Ботев 1, Ловеч)"
                       required
                       className={styles.addressInput}
                       autoComplete="off"
                     />
                     {addressZone && (
                       <div className={styles.zoneIndicator}>
                         {addressZone === 'yellow' && (
                           <div className={styles.zoneYellow}>
                             <CheckCircle size={16} />
                             <span>Зона 1 (1.5 €. <span className="text-muted text-xs">({formatBGNPrice(convertToBGN(1.5))})</span>)</span>
                           </div>
                         )}
                         {addressZone === 'blue' && (
                           <div className={styles.zoneBlue}>
                             <CheckCircle size={16} />
                             <span>Зона 2 (3.5 €. <span className="text-muted text-xs">({formatBGNPrice(convertToBGN(3.5))})</span>)</span>
                           </div>
                         )}
                         {addressZone === 'outside' && (
                           <div className={styles.zoneOutside}>
                             <XCircle size={16} />
                             <span>Извън зоната</span>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                   <button 
                     type="button"
                     onClick={() => setIsMapModalOpen(true)}
                     className={styles.mapButton}
                   >
                     <MapPin size={16} />
                     Не намирате адреса си?
                   </button>
                 </div>
                 <div className={styles.formGroup}>
                   <label htmlFor="phone">Телефон</label>
                   <input
                     type="tel"
                     id="phone"
                     value={addressData.phone}
                     onChange={(e) => setAddressData(prev => ({ ...prev, phone: e.target.value }))}
                     required
                   />
                 </div>
                 <div className={styles.formGroup}>
                   <label htmlFor="addressInstructions">Инструкции за доставка</label>
                   <textarea
                     id="addressInstructions"
                     value={addressData.addressInstructions}
                     onChange={(e) => setAddressData(prev => ({ ...prev, addressInstructions: e.target.value }))}
                     placeholder="Допълнителни инструкции за доставка (например: код на входа, етаж, апартамент)"
                     rows={3}
                   />
                 </div>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isUpdating || !addressConfirmed || addressZone === 'outside'}
                >
                                     {isUpdating ? 'Обновяване...' : 'Обнови адрес'}
                </button>
              </form>
            </section>
          </div>
        )}
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
                    <span>Зона 1 (1.5 €. <span className="text-muted text-xs">({formatBGNPrice(convertToBGN(1.5))})</span>)</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }}></div>
                    <span>Зона 2 (3.5 €. <span className="text-muted text-xs">({formatBGNPrice(convertToBGN(3.5))})</span>)</span>
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
                    disabled={!markerRef.current || addressZone === 'outside'}
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
    </main>
  )
}
