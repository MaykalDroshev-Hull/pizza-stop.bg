'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Clock, Phone, Truck, Pizza, CheckCircle, XCircle, Navigation } from 'lucide-react'
import styles from '../styles/DeliveryArea.module.css'
import { isRestaurantOpen } from '../utils/openingHours'

interface DeliveryAreaMapProps {
  apiKey: string
}

export default function DeliveryAreaMap({ apiKey }: DeliveryAreaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [address, setAddress] = useState('')
  const [isAddressInCoverage, setIsAddressInCoverage] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [deliveryZone, setDeliveryZone] = useState('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapLoaded) return

         // Load Google Maps script
     const script = document.createElement('script')
     script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`
     script.async = true
     script.defer = true
    
    script.onload = () => {
      initMap()
      setMapLoaded(true)
    }

    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [apiKey, mapLoaded])

  // Initialize autocomplete when modal opens
  useEffect(() => {
    if (isModalOpen && mapLoaded && addressInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        initAutocomplete()
      }, 100)
    }
  }, [isModalOpen, mapLoaded])

  const checkAddressCoverage = async (address: string) => {
    setIsChecking(true)
    
    // Normalize the address for better matching
    const normalizedAddress = address.toLowerCase()
      .replace(/[.,]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    // Define coverage areas with their keywords
    const lovechCityKeywords = [
      'ловеч', 'lovech', '5500', 'ул.', 'улица', 'бул.', 'булевард', 'пл.', 'площад'
    ]
    
    const lovechVillages = [
      'продъмчет', 'продъмчец', 'prodimchets', 'prodimchec',
      'лисец', 'lisets', 'lisets',
      'баховица', 'bahovitsa', 'bahovica',
      'горан', 'goran',
      'умаревци', 'umarevtsi', 'umarevci',
      'скобелево', 'skobelevo'
    ]
    
    // Check if address contains Lovech city indicators
    const isInLovechCity = lovechCityKeywords.some(keyword => 
      normalizedAddress.includes(keyword)
    )
    
    // Check if address contains specific village names
    const isInVillage = lovechVillages.some(village => 
      normalizedAddress.includes(village)
    )
    
    // Check if address contains postal codes for the area
    const hasLovechPostalCode = /550[0-9]/.test(normalizedAddress)
    
    // Determine coverage based on multiple factors
    let isInCoverage = false
    let deliveryZone = ''
    
    if (isInLovechCity || hasLovechPostalCode) {
      isInCoverage = true
      deliveryZone = 'Ловеч град (3 лв.)'
    } else if (isInVillage) {
      isInCoverage = true
      deliveryZone = 'Разширена зона (7 лв.)'
    }
    
    // Simulate API call delay
    setTimeout(() => {
      setIsAddressInCoverage(isInCoverage)
      setDeliveryZone(deliveryZone)
      setIsChecking(false)
    }, 1000)
  }

  const resetModal = () => {
    setAddress('')
    setIsAddressInCoverage(null)
    setIsChecking(false)
    setDeliveryZone('')
  }

  const detectDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокацията не се поддържа от вашия браузър.')
      return
    }

    setIsDetectingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        // Check if the detected location is within delivery range
        const lovechCenter = { lat: 43.142931, lng: 24.717857 }
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(lovechCenter.lat, lovechCenter.lng),
          new window.google.maps.LatLng(latitude, longitude)
        )
        
        if (distance <= 30000) { // Within 30km
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsDetectingLocation(false)
              
              if (status === 'OK' && results && results[0]) {
                const detectedAddress = results[0].formatted_address
                setAddress(detectedAddress)
                
                // Automatically check coverage for this address
                checkAddressCoverage(detectedAddress)
              } else {
                alert('Неуспешно определяне на адреса. Моля, въведете го ръчно.')
              }
            }
          )
        } else {
          setIsDetectingLocation(false)
          alert(`Вашата локация е на ${Math.round(distance / 1000)}km от Ловеч, което е извън зоната за доставка. Моля, въведете адрес ръчно.`)
        }
      },
      (error) => {
        setIsDetectingLocation(false)
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
        
        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const openModal = () => {
    resetModal()
    setIsModalOpen(true)
  }

  const initAutocomplete = () => {
    if (!addressInputRef.current || !window.google) return

    // Lovech center coordinates
    const lovechCenter = { lat: 43.142931, lng: 24.717857 }
    
    // Create a circle with 30km radius around Lovech
    const circle = new window.google.maps.Circle({
      center: lovechCenter,
      radius: 30000, // 30km in meters
      visible: false // Don't show the circle on the map
    })

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'bg' },
      fields: ['formatted_address', 'geometry'],
      bounds: circle.getBounds() || undefined, // Limit results to the circle bounds
      strictBounds: true // Strictly enforce the bounds
    })

    // Filter autocomplete predictions to only show addresses within 30km
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address && place.geometry && place.geometry.location) {
        const placeLocation = place.geometry.location
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(lovechCenter.lat, lovechCenter.lng),
          placeLocation
        )
        
        // Only accept addresses within 30km
        if (distance <= 30000) {
          setAddress(place.formatted_address)
        } else {
          // Show error for addresses outside the range
          alert('Този адрес е извън зоната за доставка (над 30km от Ловеч). Моля, изберете адрес по-близо до града.')
        }
      }
    })

    // Additional filtering: Listen to predictions and filter them
    autocomplete.addListener('predictions_changed', () => {
      // This event fires when predictions are updated
      // We can't directly filter the predictions, but the bounds and strictBounds help
    })
  }

  const initMap = () => {
    if (!mapRef.current || !window.google) return

    // Lovech, Bulgaria coordinates
    const lovechCenter = { lat: 43.142931, lng: 24.717857 }
    
    // Define Lovech city area (3 BGN delivery) - Golden color
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
    
    // Define extended area (7 BGN delivery) - Blue color
    // Includes: Prodimchets, Lisets, Bahovitsa, Goran, Umarevtsi, Skobelevo
    const extendedArea = [
      { lat: 43.1700, lng: 24.6500 }, // North
      { lat: 43.1750, lng: 24.7500 }, // Northeast
      { lat: 43.1650, lng: 24.8000 }, // East
      { lat: 43.1400, lng: 24.8000 }, // Southeast
      { lat: 43.1100, lng: 24.7500 }, // South
      { lat: 43.1150, lng: 24.6800 }, // Southwest
      { lat: 43.1350, lng: 24.6200 }, // West
      { lat: 43.1700, lng: 24.6500 }  // Back to start
    ]

    const map = new window.google.maps.Map(mapRef.current, {
      center: lovechCenter,
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Add extended area polygon (7 BGN delivery) - Blue color
    new window.google.maps.Polygon({
      paths: extendedArea,
      fillColor: '#3b82f6', // Blue
      fillOpacity: 0.2,
      strokeColor: '#3b82f6',
      strokeWeight: 2,
      strokeOpacity: 0.6,
      map: map
    })
    
    // Add Lovech city area polygon (3 BGN delivery) - Golden color
    new window.google.maps.Polygon({
      paths: lovechArea,
      fillColor: '#fbbf24', // Golden
      fillOpacity: 0.4,
      strokeColor: '#fbbf24',
      strokeWeight: 3,
      strokeOpacity: 0.8,
      map: map
    })

                           // Add restaurant marker with custom logo
      new window.google.maps.Marker({
        position: lovechCenter,
        map: map,
        title: 'Pizza Stop - Lovech',
        icon: {
          url: '/images/home/map-marker.png', // Your custom Canva logo
          scaledSize: new window.google.maps.Size(80, 80),
          anchor: new window.google.maps.Point(40, 80) // Anchor at bottom center of pin
        }
      })
  }

  return (
    <section className={styles.deliveryAreaSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Райони за доставка</h2>
        
                 <div className={styles.deliveryInfo}>
           <div className={styles.infoCard}>
             <MapPin className={styles.infoIcon} />
             <h3>Ловеч - 3 лв.</h3>
             <p>Доставка в град Ловеч и близките райони</p>
           </div>
           
                       <div className={styles.infoCard}>
              <MapPin className={styles.infoIcon} />
              <h3>Разширена зона - 7 лв.</h3>
              <p>Продъмчец, Лисец, Баховица, Горан, Умаревци, Скобелево</p>
            </div>
           
           <div className={styles.infoCard}>
             <Clock className={styles.infoIcon} />
             <h3>Време за доставка</h3>
             <p>40-60 минути в зависимост от района</p>
           </div>
         
         </div>

                 <div className={styles.mapContainer}>
           <div ref={mapRef} className={styles.map} />
           
           {/* Map Legend */}
           <div className={styles.mapLegend}>
             <div className={styles.legendItem}>
               <div className={styles.legendColor} style={{ backgroundColor: '#fbbf24' }}></div>
               <span>Ловеч - 3 лв. доставка</span>
             </div>
             <div className={styles.legendItem}>
               <div className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }}></div>
               <span>Разширена зона - 7 лв. доставка</span>
             </div>
           </div>
         </div>

         {/* Address Check Button */}
         <div className={styles.addressCheckSection}>
                       <button 
              className={styles.addressCheckButton}
              onClick={openModal}
            >
             <MapPin className={styles.buttonIcon} />
             Провери своя адрес
           </button>
         </div>

         <div className={styles.deliveryDetails}>
           <h3>Допълнителна информация</h3>
           <ul>
             <li>Работно време: Пон.–Съб. 11:00–23:00, Нед. 11:00–21:00</li>
             <li>Прием на поръчки: 9:30–22:30</li>
             <li>Поръчките не могат да бъдат променяни след потвърждаването</li>
             <li>Минимална сума за доставка: 15 лв.</li>
             <li>Безплатна доставка за поръчки над 25 лв.</li>
             <li>Може да се поръчва до 3 дни напред</li>
           </ul>
         </div>
       </div>

       {/* Address Check Modal */}
       {isModalOpen && (
         <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
             <div className={styles.modalHeader}>
               <h3>Провери доставка до твоя адрес</h3>
               <button 
                 className={styles.closeButton}
                 onClick={() => setIsModalOpen(false)}
               >
                 ×
               </button>
             </div>
             
             <div className={styles.modalContent}>
                               {isAddressInCoverage === null ? (
                  <>
                    <p>Въведете своя адрес, за да проверим дали доставяме до вас:</p>
                    
                    {/* Location Detection Button */}
                    <div className={styles.locationDetectionSection}>
                      <button
                        className={styles.locationButton}
                        onClick={detectDeviceLocation}
                        disabled={isDetectingLocation}
                      >
                        <Navigation className={styles.locationIcon} />
                        {isDetectingLocation ? 'Определям локацията...' : 'Определи моята локация'}
                      </button>
                      <p className={styles.locationHint}>
                        Или въведете адреса ръчно по-долу
                      </p>
                    </div>
                    
                    <div className={styles.addressInput}>
                      <input
                        ref={addressInputRef}
                        type="text"
                        placeholder="Въведете адрес..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={styles.input}
                        autoComplete="off"
                      />
                      <button
                        className={styles.checkButton}
                        onClick={() => checkAddressCoverage(address)}
                        disabled={!address.trim() || isChecking}
                      >
                        {isChecking ? 'Проверявам...' : 'Провери'}
                      </button>
                    </div>
                  </>
                                               ) : isAddressInCoverage ? (
                  <div className={styles.successMessage}>
                    <div className={styles.successIcon}>
                      <CheckCircle className={styles.icon} />
                    </div>
                    <h4>Отлично! Доставяме до вас!</h4>
                    <p>Вашият адрес е в зоната за доставка.</p>
                    <div className={styles.deliveryZoneInfo}>
                      <span className={styles.zoneBadge}>
                        {deliveryZone || 'Зона за доставка'}
                      </span>
                    </div>
                    <a href="/order" className={styles.orderButton}>
                      {isRestaurantOpen() ? 'Поръчай сега' : 'Поръчай за по-късно'}
                    </a>
                  </div>
                ) : (
                  <div className={styles.errorMessage}>
                    <div className={styles.errorIcon}>
                      <XCircle className={styles.icon} />
                    </div>
                    <h4>За съжаление не доставяме до вашия район</h4>
                    <p>Вашият адрес е извън текущата зона за доставка.</p>
                    <div className={styles.actionButtons}>
                      <a href="tel:+35968670070" className={styles.callButton}>
                        Обади се за проверка
                      </a>
                      <button 
                        className={styles.areaButton}
                        onClick={() => setIsModalOpen(false)}
                      >
                        Виж зони за доставка
                      </button>
                    </div>
                  </div>
                )}
             </div>
           </div>
         </div>
       )}
     </section>
   )
 }

