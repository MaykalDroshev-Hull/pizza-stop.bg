'use client'

import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Navigation, AlertCircle } from 'lucide-react'

interface AddressSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  onCoordinatesSelect: (coordinates: { lat: number; lng: number }) => void
  onExactLocationSelect: (exactLocation: { lat: number; lng: number }) => void
  onAddressUpdate: (address: string) => void
  onAddressConfirm: () => void
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  address,
  onCoordinatesSelect,
  onExactLocationSelect,
  onAddressUpdate,
  onAddressConfirm
}: AddressSelectionModalProps) {
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [exactMarker, setExactMarker] = useState<any>(null)
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedExactLocation, setSelectedExactLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const exactMarkerRef = useRef<any>(null)

  useEffect(() => {
    if (!isOpen || !mapRef.current) return

    // Load Google Maps script
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps && window.google.maps.geometry) {
        initializeMap()
        return
      }

      // Check if script already exists to prevent duplicate loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Wait for existing script to load
        existingScript.addEventListener('load', initializeMap)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [isOpen])

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
          setUserLocation(location)
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

  const initializeMap = async () => {
    if (!mapRef.current || !window.google) return

    // Default center (Bulgaria)
    const defaultCenter = { lat: 42.7339, lng: 25.4858 }
    let mapCenter = defaultCenter

    // Try to get user's current location first
    try {
      const userLoc = await getUserLocation()
      mapCenter = userLoc
    } catch (error) {
      console.log('Could not get user location, using default center:', error)
    }

    // Create map centered on user location or default with tight zoom
    const mapInstance = new window.google.maps.Map(mapRef.current!, {
      center: mapCenter,
      zoom: 18, // High zoom level for ~30 meter radius
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      // Remove default map controls
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false
    })

    setMap(mapInstance)

    // Add user location marker if we have it
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: 'Вашата локация',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#3B82F6"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <circle cx="16" cy="16" r="4" fill="#3B82F6"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      })
    }

    // Add click listener to map for exact location selection
    const clickListener = mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const exactLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }
        setSelectedExactLocation(exactLocation)

        // If marker already exists, just move it to new position
        if (exactMarkerRef.current) {
          exactMarkerRef.current.setPosition(exactLocation)
        } else {
          // Create new exact location marker only if it doesn't exist
          const newExactMarker = new window.google.maps.Marker({
            position: exactLocation,
            map: mapInstance,
            title: 'Точна локация',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#E11D48"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 12)
            }
          })

          exactMarkerRef.current = newExactMarker
          setExactMarker(newExactMarker)
        }
      }
    })

    // If we have an initial address, geocode it
    if (address) {
      geocodeAddress(address, mapInstance)
    }
  }

  const geocodeAddress = (addressToGeocode: string, mapInstance: any) => {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: addressToGeocode }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location
        const coordinates = { lat: location.lat(), lng: location.lng() }
        setGeocodedCoordinates(coordinates)

        // Center map on geocoded location
        mapInstance.setCenter(coordinates)
        mapInstance.setZoom(18)

        // Add marker for geocoded address
        if (marker) {
          marker.setMap(null)
        }

        const addressMarker = new window.google.maps.Marker({
          position: coordinates,
          map: mapInstance,
          title: 'Адрес',
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

        setMarker(addressMarker)
      }
    })
  }

  const handleConfirm = async () => {
    // Use exact location if selected, otherwise use geocoded coordinates
    const coordinatesToUse = selectedExactLocation || geocodedCoordinates
    
    if (coordinatesToUse) {
      try {
        // Get delivery zone
        const zone = getDeliveryZone(coordinatesToUse)
        
        // Reverse geocode to get the address
        const geocodedAddress = await reverseGeocode(coordinatesToUse)
        
        // Determine zone type and create address with zone info
        let addressWithZone = ''
        if (zone === 'blue') {
          addressWithZone = `${geocodedAddress} (Геолокация потвърдена - синя зона)`
        } else if (zone === 'yellow') {
          addressWithZone = `${geocodedAddress} (Геолокация потвърдена - жълта зона)`
        } else {
          addressWithZone = `${geocodedAddress} (Геолокация не потвърдена - доставката не е възможна)`
        }
        
        // Update the address field
        onAddressUpdate(addressWithZone)
        
        if (zone === 'outside') {
          // Location is outside delivery zone - just close modal
          onClose()
        } else {
          if (selectedExactLocation) {
            onExactLocationSelect(selectedExactLocation)
          } else if (geocodedCoordinates) {
            onCoordinatesSelect(geocodedCoordinates)
          }
          // Also trigger the address confirmation logic from the main form
          onAddressConfirm()
          onClose()
        }
      } catch (error) {
        console.error('Error during confirmation:', error)
        // Just close modal on error - user can try again
        onClose()
      }
    }
  }

  const handleClose = () => {
    // Reset marker ref when closing
    exactMarkerRef.current = null
    setExactMarker(null)
    setSelectedExactLocation(null)
    onClose()
  }

  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].lng > point.lng) !== (polygon[j].lng > point.lng)) &&
          (point.lat < (polygon[j].lat - polygon[i].lat) * (point.lng - polygon[i].lng) / (polygon[j].lng - polygon[i].lng) + polygon[i].lat)) {
        inside = !inside
      }
    }
    return inside
  }

  const getDeliveryZone = (coordinates: { lat: number; lng: number }): 'blue' | 'yellow' | 'outside' => {
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
    
    // Check if coordinates are inside Lovech city area (yellow zone - 3 BGN)
    const isInLovechArea = isPointInPolygon(coordinates, lovechArea)
    
    // Check if coordinates are inside extended area (blue zone - 7 BGN)
    const isInExtendedArea = isPointInPolygon(coordinates, extendedArea)
    
    if (isInLovechArea) {
      return 'yellow' // Lovech city area - yellow zone
    } else if (isInExtendedArea) {
      return 'blue' // Extended area - blue zone
    } else {
      return 'outside' // Outside both areas
    }
  }

  const reverseGeocode = (coordinates: { lat: number; lng: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error('Google Maps not loaded'))
        return
      }

      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: coordinates }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address)
        } else {
          reject(new Error('Geocoding failed'))
        }
      })
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-white/12 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/12">
          <div>
            <h2 className="text-xl font-bold text-text">Избери точна локация</h2>
            <p className="text-muted text-sm mt-1">{address}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-text transition-colors p-2"
            aria-label="Затвори"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue/10 border border-blue text-blue p-4 rounded-xl">
              <div className="flex items-center space-x-2">
                <Navigation size={20} />
                <span className="font-medium">Инструкции:</span>
              </div>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Синият маркер показва вашата текуща локация</li>
                <li>• Оранжевият маркер показва намерения адрес</li>
                <li>• Кликнете на картата за да изберете точната локация на вратата</li>
                <li>• Червеният маркер показва избраната точна локация</li>
              </ul>
            </div>

            {/* Location Status */}
            {isGettingLocation && (
              <div className="bg-blue/10 border border-blue text-blue p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue"></div>
                  <span className="text-sm">Определям вашата локация...</span>
                </div>
              </div>
            )}

            {locationError && (
              <div className="bg-red/10 border border-red text-red p-3 rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span className="text-sm">{locationError}</span>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full h-96 rounded-xl border border-white/12 overflow-hidden"
              />
              
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              
              {selectedExactLocation && (
                <div className="text-sm text-green">
                  ✅ Точна локация избрана
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/12 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-6 py-3 border border-white/12 text-text rounded-xl hover:bg-white/6 transition-colors"
          >
            Отказ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedExactLocation && !geocodedCoordinates}
            className="px-6 py-3 bg-gradient-to-r from-red to-orange text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            Потвърди локацията
          </button>
        </div>
      </div>
    </div>
  )
}
