'use client'

import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Navigation } from 'lucide-react'

interface AddressSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  onCoordinatesSelect: (coordinates: { lat: number; lng: number }) => void
  onExactLocationSelect: (exactLocation: { lat: number; lng: number }) => void
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  address,
  onCoordinatesSelect,
  onExactLocationSelect
}: AddressSelectionModalProps) {
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [exactMarker, setExactMarker] = useState<any>(null)
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedExactLocation, setSelectedExactLocation] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !mapRef.current) return

    // Load Google Maps script
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [isOpen])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    // Default center (Bulgaria)
    const defaultCenter = { lat: 42.7339, lng: 25.4858 }

    // Create map centered on default location
    const mapInstance = new window.google.maps.Map(mapRef.current!, {
      center: defaultCenter,
      zoom: 8,
      mapTypeId: 'roadmap' as google.maps.MapTypeId,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    setMap(mapInstance)

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

        // Add click listener to map for exact location selection
        mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const exactLocation = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            }
            setSelectedExactLocation(exactLocation)

            // Remove previous exact location marker
            if (exactMarker) {
              exactMarker.setMap(null)
            }

            // Add new exact location marker
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

            setExactMarker(newExactMarker)
          }
        })
      }
    })
  }

  const handleConfirm = () => {
    if (geocodedCoordinates) {
      onCoordinatesSelect(geocodedCoordinates)
    }
    if (selectedExactLocation) {
      onExactLocationSelect(selectedExactLocation)
    }
    onClose()
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
            onClick={onClose}
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
                <li>• Оранжевият маркер показва намерения адрес</li>
                <li>• Кликнете на картата за да изберете точната локация на вратата</li>
                <li>• Червеният маркер показва избраната точна локация</li>
              </ul>
            </div>

            {/* Map */}
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full h-96 rounded-xl border border-white/12 overflow-hidden"
              />
              
              {/* Map Controls Overlay */}
              <div className="absolute top-4 right-4 space-y-2">
                <button
                  onClick={() => map?.panTo(geocodedCoordinates!)}
                  disabled={!geocodedCoordinates}
                  className="p-2 bg-white/90 rounded-lg shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Центрирай на адреса"
                >
                  <MapPin size={20} className="text-orange" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange rounded-full"></div>
                  <span className="text-sm text-muted">Намерен адрес</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red rounded-full"></div>
                  <span className="text-sm text-muted">Точна локация</span>
                </div>
              </div>
              
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
            onClick={onClose}
            className="px-6 py-3 border border-white/12 text-text rounded-xl hover:bg-white/6 transition-colors"
          >
            Отказ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!geocodedCoordinates}
            className="px-6 py-3 bg-gradient-to-r from-red to-orange text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            Потвърди локацията
          </button>
        </div>
      </div>
    </div>
  )
}
