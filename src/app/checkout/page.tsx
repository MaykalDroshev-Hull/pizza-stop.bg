'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MapPin, User, Phone, CreditCard, Banknote } from 'lucide-react'
import { useCart } from '../../components/CartContext'
import AddressSelectionModal from '../../components/AddressSelectionModal'

interface CustomerInfo {
  name: string
  phone: string
  address: string
  coordinates: { lat: number; lng: number } | null
  exactLocation: { lat: number; lng: number } | null
}

type PaymentMethod = 'online' | 'card' | 'cash'

export default function CheckoutPage() {
  const { items, totalPrice } = useCart()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    coordinates: null,
    exactLocation: null
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [addressInputMethod, setAddressInputMethod] = useState<'autocomplete' | 'coordinates'>('autocomplete')
  const [coordinateInput, setCoordinateInput] = useState({ lat: '', lng: '' })
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [interactiveMap, setInteractiveMap] = useState<any>(null)
  const [mapMarker, setMapMarker] = useState<any>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const addressInputRef = useRef<HTMLInputElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

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

  // Initialize interactive map when coordinates tab is selected
  useEffect(() => {
    if (addressInputMethod === 'coordinates' && mapContainerRef.current && !interactiveMap) {
      initializeInteractiveMap()
    }
  }, [addressInputMethod, interactiveMap])

  // Check GPS permission status on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        setGpsPermissionStatus(permissionStatus.state)
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          setGpsPermissionStatus(permissionStatus.state)
        })
      })
    }
  }, [])

  const initializeAutocomplete = () => {
    if (!addressInputRef.current || !window.google?.maps?.places) return

    const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'bg' }, // Restrict to Bulgaria
      fields: ['formatted_address', 'geometry', 'place_id']
    })

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      if (place.geometry && place.geometry.location) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
        
        setCustomerInfo(prev => ({
          ...prev,
          address: place.formatted_address || '',
          coordinates
        }))
      }
    })

    setAutocomplete(autocompleteInstance as any)
  }

  const initializeInteractiveMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return

    // Default center (Bulgaria)
    const defaultCenter = { lat: 42.7339, lng: 25.4858 }

    // Create interactive map
    const mapInstance = new window.google.maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 10,
      mapTypeId: 'roadmap' as google.maps.MapTypeId,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      // Enable smooth panning and zooming
      gestureHandling: 'greedy',
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    // Add click listener to map
    mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }
        setClickedLocation(location)
        
        // Clear any previous markers
        if (mapMarker) {
          mapMarker.setMap(null)
        }
        
        // Add new marker at clicked location
        const newMarker = new window.google.maps.Marker({
          position: location,
          map: mapInstance,
          title: 'Избрана локация',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#FF7F11"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          }
        })
        setMapMarker(newMarker)
      }
    })

    setInteractiveMap(mapInstance)
  }

  const handleAddressChange = (address: string) => {
    setCustomerInfo(prev => ({ ...prev, address }))
    // Clear coordinates when address is manually changed
    if (customerInfo.coordinates) {
      setCustomerInfo(prev => ({ ...prev, coordinates: null, exactLocation: null }))
    }
  }

  const handleInputMethodChange = (method: 'autocomplete' | 'coordinates') => {
    setAddressInputMethod(method)
    
    // Clear address and coordinates when switching methods
    if (method === 'coordinates') {
      setCustomerInfo(prev => ({ 
        ...prev, 
        address: '', 
        coordinates: null, 
        exactLocation: null 
      }))
    }
    
    // Clear coordinate inputs when switching to autocomplete
    if (method === 'autocomplete') {
      setCoordinateInput({ lat: '', lng: '' })
      setClickedLocation(null)
      
      // Clear map marker
      if (mapMarker) {
        mapMarker.setMap(null)
      }
    }
  }

  const handleCoordinatesSelect = (coordinates: { lat: number; lng: number }) => {
    setCustomerInfo(prev => ({ ...prev, coordinates }))
  }

  const handleExactLocationSelect = (exactLocation: { lat: number; lng: number }) => {
    setCustomerInfo(prev => ({ ...prev, exactLocation }))
  }

  const handleGetAddressFromCoordinates = async () => {
    if (!coordinateInput.lat || !coordinateInput.lng) return

    const lat = parseFloat(coordinateInput.lat)
    const lng = parseFloat(coordinateInput.lng)

    if (isNaN(lat) || isNaN(lng)) {
      alert('Моля, въведете валидни координати')
      return
    }

    try {
      // Use Google Maps Geocoding API to get address from coordinates
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder()
        const latlng = { lat, lng }
        
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address
            const coordinates = { lat, lng }
            
            setCustomerInfo(prev => ({
              ...prev,
              address,
              coordinates
            }))
            
            // Switch back to autocomplete tab to show the result
            setAddressInputMethod('autocomplete')
            
            // Clear coordinate inputs
            setCoordinateInput({ lat: '', lng: '' })
          } else {
            alert('Неуспешно намиране на адрес за тези координати')
          }
        })
      } else {
        alert('Google Maps не е зареден. Моля, опитайте отново.')
      }
    } catch (error) {
      console.error('Error getting address from coordinates:', error)
      alert('Грешка при намиране на адреса')
    }
  }

  const handlePasteCoordinates = async () => {
    try {
      const text = await navigator.clipboard.readText()
      
      // Try to parse coordinates from clipboard text
      // Common formats: "42.7339, 25.4858" or "42.7339,25.4858" or "42.7339 25.4858"
      const coordinatePattern = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/
      const match = text.match(coordinatePattern)
      
      if (match) {
        const [, lat, lng] = match
        setCoordinateInput({ lat: lat.trim(), lng: lng.trim() })
      } else {
        alert('Невалиден формат на координатите. Очаква се формат: 42.7339, 25.4858')
      }
    } catch (error) {
      console.error('Error reading clipboard:', error)
      alert('Грешка при четене от клипборда. Моля, копирайте координатите ръчно.')
    }
  }

  const handleGetAddressFromMapLocation = async (location: { lat: number; lng: number }) => {
    try {
      // Use Google Maps Geocoding API to get address from clicked location
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder()
        
        geocoder.geocode({ location }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address
            const coordinates = { lat: location.lat, lng: location.lng }
            
            setCustomerInfo(prev => ({
              ...prev,
              address,
              coordinates
            }))
            
            // Switch back to autocomplete tab to show the result
            setAddressInputMethod('autocomplete')
            
            // Clear clicked location
            setClickedLocation(null)
            
            // Clear map marker
            if (mapMarker) {
              mapMarker.setMap(null)
            }
          } else {
            alert('Неуспешно намиране на адрес за тази локация')
          }
        })
      } else {
        alert('Google Maps не е зареден. Моля, опитайте отново.')
      }
    } catch (error) {
      console.error('Error getting address from map location:', error)
      alert('Грешка при намиране на адреса')
    }
  }

    const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ Геолокацията не се поддържа от този браузър. Моля, използвайте модерен браузър.')
      return
    }

    // Check if permission is already granted/denied
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        setGpsPermissionStatus(permissionStatus.state)
        
        if (permissionStatus.state === 'denied') {
          alert('❌ Доступът до GPS е отказан. Моля:\n\n1. Кликнете на иконата за настройки в адресната лента\n2. Разрешете "Местоположение" за този сайт\n3. Опитайте отново')
          return
        }
        
        // Permission is granted or prompt, proceed with getting location
        getCurrentLocationWithPermission()
      })
    } else {
      // Fallback for browsers that don't support permissions API
      setGpsPermissionStatus('prompt')
      getCurrentLocationWithPermission()
    }
  }

  const getCurrentLocationWithPermission = () => {
    // Show loading state
    setIsGettingLocation(true)

    // Show initial permission request message
    const permissionMessage = '📍 Браузърът ще поиска достъп до вашата GPS локация.\n\nМоля, кликнете "Разреши" за да продължите.'
    
    // Use a more user-friendly confirmation dialog
    if (confirm(permissionMessage)) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng, accuracy } = position.coords
          
          // Set the clicked location
          setClickedLocation({ lat, lng })
          
          // Center map on current location
          if (interactiveMap) {
            interactiveMap.setCenter({ lat, lng })
            interactiveMap.setZoom(18) // Zoom in for street level
          }
          
          // Clear any previous markers
          if (mapMarker) {
            mapMarker.setMap(null)
          }
          
          // Add marker at current location
          if (interactiveMap) {
            const newMarker = new window.google.maps.Marker({
              position: { lat, lng },
              map: interactiveMap,
              title: 'Текуща GPS локация',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="#10B981"/>
                    <circle cx="16" cy="16" r="8" fill="white"/>
                    <circle cx="16" cy="16" r="4" fill="#10B981"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16)
            }
            })
            setMapMarker(newMarker)
          }
          
          // Hide loading state
          setIsGettingLocation(false)
          
          // Show success message with accuracy info
          const accuracyText = accuracy ? `\nТочност: ±${Math.round(accuracy)} метра` : ''
          alert(`✅ GPS локацията е намерена успешно!${accuracyText}\n\nКоординати: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n\nСега кликнете "🏠 Вземи адрес" за да получите адреса.`)
          
        },
        (error) => {
          // Hide loading state
          setIsGettingLocation(false)
          
          // Handle different error types with better Bulgarian messages
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert('❌ Доступът до GPS е отказан!\n\nЗа да разрешите достъпа:\n1. Кликнете на иконата за настройки в адресната лента\n2. Разрешете "Местоположение" за Pizza Stop\n3. Опитайте отново')
              break
            case error.POSITION_UNAVAILABLE:
              alert('❌ GPS информацията не е налична!\n\nВъзможни причини:\n• GPS е изключен на устройството\n• Няма GPS сигнал (в сграда, подземно)\n• Проблем с GPS хардуера\n\nМоля, проверете настройките и опитайте отново.')
              break
            case error.TIMEOUT:
              alert('❌ Времето за намиране на GPS изтече!\n\nВъзможни причини:\n• Слаб GPS сигнал\n• Меден интернет\n• GPS сървърите са заети\n\nМоля, опитайте отново или се преместете на по-открито място.')
              break
            default:
              alert('❌ Неочаквана грешка при намиране на GPS!\n\nГрешка: ' + error.message + '\n\nМоля, опитайте отново или използвайте ръчно въвеждане на адрес.')
          }
        },
        {
          enableHighAccuracy: true, // Use GPS for better accuracy
          timeout: 15000, // 15 seconds timeout (increased for better GPS lock)
          maximumAge: 300000 // Cache location for 5 minutes
        }
      )
    } else {
      // User cancelled the permission request
      setIsGettingLocation(false)
      alert('ℹ️ Заявката за GPS достъп е отказана.\n\nМожете да използвате:\n• Ръчно въвеждане на адрес\n• Кликване на картата\n• Въвеждане на координати')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle order submission
    console.log('Order submitted:', { customerInfo, paymentMethod, items, totalPrice })
  }

  const isFormValid = customerInfo.name && customerInfo.phone && customerInfo.address && customerInfo.coordinates

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
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/6 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{item.image}</div>
                    <div>
                      <h4 className="font-medium text-text">{item.name}</h4>
                      <p className="text-sm text-muted">
                        {item.size} • {item.quantity}x
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-orange">{item.price.toFixed(2)} лв.</p>
                </div>
              ))}
            </div>
            <div className="border-t border-white/12 mt-4 pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Обща сума:</span>
                <span className="text-orange">{totalPrice.toFixed(2)} лв.</span>
              </div>
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
              
              {/* Address Input Tabs */}
              <div className="mb-3">
                <div className="flex space-x-1 bg-white/6 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => handleInputMethodChange('autocomplete')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      addressInputMethod === 'autocomplete'
                        ? 'bg-orange text-white shadow-sm'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    📝 Автоматично попълване
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputMethodChange('coordinates')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      addressInputMethod === 'coordinates'
                        ? 'bg-orange text-white shadow-sm'
                        : 'text-orange hover:text-text'
                    }`}
                  >
                    📍 Въведи координати
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {addressInputMethod === 'autocomplete' ? (
                  // Autocomplete Input
                  <>
                    <input
                      ref={addressInputRef}
                      type="text"
                      value={customerInfo.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      className="w-full p-3 bg-white/6 border border-white/12 rounded-xl text-text placeholder-muted focus:border-orange focus:outline-none transition-colors"
                      placeholder="Въведете адреса за доставка (ще се появят предложения)"
                      required
                    />
                    
                    {/* Autocomplete Info */}
                    <div className="text-xs text-muted bg-blue/10 border border-blue/20 rounded-lg p-2">
                      💡 Въведете адреса и ще се появят предложения за автоматично попълване
                    </div>
                  </>
                                 ) : (
                   // Interactive Map Selection
                   <>
                     {/* Map Container */}
                     <div className="relative">
                       <div
                         ref={mapContainerRef}
                         className="w-full h-80 rounded-xl border border-white/12 overflow-hidden"
                       />
                       
                                               {/* Map Instructions Overlay */}
                        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm max-w-xs">
                          <div className="font-medium mb-2">🗺️ Как да изберете адрес:</div>
                          <ul className="space-y-1 text-xs">
                            <li>• Плъзнете картата за да навигирате</li>
                            <li>• Кликнете на желаната локация</li>
                            <li>• Адресът ще се попълни автоматично</li>
                          </ul>
                        </div>
                        
                        {/* Current Location Button */}
                        <div className="absolute top-4 right-4">
                          <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={isGettingLocation || gpsPermissionStatus === 'denied'}
                            className={`px-4 py-3 rounded-xl font-bold transition-all shadow-xl border-2 flex items-center space-x-2 transform hover:scale-105 ${
                              gpsPermissionStatus === 'denied'
                                ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-60'
                                : isGettingLocation
                                ? 'bg-blue-600 text-white cursor-wait opacity-80'
                                : 'bg-gradient-to-r from-orange to-red text-white hover:from-orange/90 hover:to-red/90 border-white/20'
                            }`}
                            title={
                              gpsPermissionStatus === 'denied'
                                ? 'GPS достъпът е отказан. Моля, разрешете в настройките на браузъра.'
                                : 'Използвай текущата GPS локация'
                            }
                          >
                            {isGettingLocation ? (
                              <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium">Зареждане GPS...</span>
                              </>
                            ) : gpsPermissionStatus === 'denied' ? (
                              <>
                                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                                <span className="text-sm font-medium">🚫 GPS отказан</span>
                              </>
                            ) : (
                              <>
                                <div className="w-5 h-5 bg-white rounded-full animate-pulse shadow-inner"></div>
                                <span className="text-sm font-medium">📍 Моята GPS</span>
                              </>
                            )}
                          </button>
                        </div>
                       
                       {/* Current Coordinates Display */}
                       {clickedLocation && (
                         <div className="absolute bottom-4 left-4 bg-orange/90 text-white p-3 rounded-lg text-sm">
                           <div className="font-medium">📍 Избрана локация:</div>
                           <div className="text-xs opacity-90">
                             {clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)}
                           </div>
                         </div>
                       )}
                       
                       {/* Get Address Button */}
                       {clickedLocation && (
                         <div className="absolute bottom-4 right-4">
                           <button
                             type="button"
                             onClick={() => handleGetAddressFromMapLocation(clickedLocation)}
                             className="px-4 py-2 bg-orange text-white rounded-lg font-medium hover:bg-orange/80 transition-colors shadow-lg"
                           >
                             🏠 Вземи адрес
                           </button>
                         </div>
                       )}
                     </div>
                     
                     {/* Alternative: Manual Coordinate Input */}
                     <div className="mt-4 p-4 bg-white/6 border border-white/12 rounded-xl">
                       <div className="text-sm text-muted mb-3">💡 Или въведете координати ръчно:</div>
                       <div className="grid grid-cols-2 gap-3 mb-3">
                         <div>
                           <label className="block text-xs text-muted mb-1">Ширина (Latitude)</label>
                           <input
                             type="text"
                             value={coordinateInput.lat}
                             onChange={(e) => setCoordinateInput(prev => ({ ...prev, lat: e.target.value }))}
                             className="w-full p-2 bg-white/6 border border-white/12 rounded-lg text-text placeholder-muted focus:border-orange focus:outline-none transition-colors text-sm"
                             placeholder="42.7339"
                           />
                         </div>
                         <div>
                           <label className="block text-xs text-muted mb-1">Дължина (Longitude)</label>
                           <input
                             type="text"
                             value={coordinateInput.lng}
                             onChange={(e) => setCoordinateInput(prev => ({ ...prev, lng: e.target.value }))}
                             className="w-full p-2 bg-white/6 border border-white/12 rounded-lg text-text placeholder-muted focus:border-orange focus:outline-none transition-colors text-sm"
                             placeholder="25.4858"
                           />
                         </div>
                       </div>
                       
                       <div className="flex space-x-2">
                         <button
                           type="button"
                           onClick={handleGetAddressFromCoordinates}
                           disabled={!coordinateInput.lat || !coordinateInput.lng}
                           className="flex-1 py-2 px-3 bg-orange/10 border border-orange text-orange rounded-lg font-medium hover:bg-orange/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                         >
                           🗺️ Вземи адрес от координатите
                         </button>
                         <button
                           type="button"
                           onClick={handlePasteCoordinates}
                           className="px-3 py-2 bg-white/6 border border-white/12 text-text rounded-lg font-medium hover:bg-white/10 transition-colors text-sm"
                         >
                           📋 Вмъкни координати
                         </button>
                       </div>
                     </div>
                     
                                           {/* GPS Info Box */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue/10 to-green/10 border border-blue/20 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">📍</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-text mb-2">GPS Локация - Най-лесният начин!</h4>
                            <div className="text-sm text-muted space-y-1">
                              <p>• <strong>Кликнете "📍 Моята GPS"</strong> за автоматично намиране</p>
                              <p>• Браузърът ще поиска достъп до вашата локация</p>
                              <p>• GPS ще определи точното местоположение</p>
                              <p>• Адресът ще се попълни автоматично</p>
                            </div>
                            {gpsPermissionStatus === 'denied' && (
                              <div className="mt-3 p-2 bg-red/10 border border-red/20 rounded-lg text-xs text-red">
                                ⚠️ GPS достъпът е отказан. Моля, разрешете в настройките на браузъра.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Map Info */}
                      <div className="text-xs text-muted bg-green/10 border border-green/20 rounded-lg p-2">
                        💡 Плъзнете картата и кликнете на желаната локация, или въведете координати ръчно
                      </div>
                   </>
                 )}

                {/* Map Selection Button */}
                {customerInfo.address && !customerInfo.coordinates && (
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="w-full p-3 bg-orange/10 border border-orange text-orange rounded-xl font-medium hover:bg-orange/20 transition-colors"
                  >
                    🗺️ Избери точна локация на картата
                  </button>
                )}

                {customerInfo.coordinates && (
                  <div className="p-3 bg-green/10 border border-green text-green rounded-xl text-sm">
                    ✅ Адресът е геокодиран успешно
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-lg font-medium text-text mb-3">Начин на плащане</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 bg-white/6 border border-white/12 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="text-orange focus:ring-orange"
                  />
                  <CreditCard size={20} className="text-orange" />
                  <span className="font-medium">Плащане онлайн</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-white/6 border border-white/12 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="text-orange focus:ring-orange"
                  />
                  <CreditCard size={20} className="text-orange" />
                  <span className="font-medium">С карта при доставка</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-white/6 border border-white/12 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="text-orange focus:ring-orange"
                  />
                  <Banknote size={20} className="text-orange" />
                  <span className="font-medium">В брой при доставка</span>
                </label>
              </div>
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
