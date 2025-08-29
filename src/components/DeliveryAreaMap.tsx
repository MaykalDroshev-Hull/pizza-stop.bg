'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Clock, Phone, Truck, Pizza } from 'lucide-react'
import styles from '../styles/DeliveryArea.module.css'

interface DeliveryAreaMapProps {
  apiKey: string
}

export default function DeliveryAreaMap({ apiKey }: DeliveryAreaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapLoaded) return

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
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
      zoom: 13,
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

         // Add restaurant marker
     new window.google.maps.Marker({
       position: lovechCenter,
       map: map,
       title: 'Pizza Stop - Lovech',
               icon: {
          url: '/images/home/logo.png',
          scaledSize: new window.google.maps.Size(60, 60),
          anchor: new window.google.maps.Point(30, 30)
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
    </section>
  )
}

