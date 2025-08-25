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
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
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

    setAutocomplete(autocompleteInstance)
  }

  const handleAddressChange = (address: string) => {
    setCustomerInfo(prev => ({ ...prev, address }))
    // Clear coordinates when address is manually changed
    if (customerInfo.coordinates) {
      setCustomerInfo(prev => ({ ...prev, coordinates: null, exactLocation: null }))
    }
  }

  const handleCoordinatesSelect = (coordinates: { lat: number; lng: number }) => {
    setCustomerInfo(prev => ({ ...prev, coordinates }))
  }

  const handleExactLocationSelect = (exactLocation: { lat: number; lng: number }) => {
    setCustomerInfo(prev => ({ ...prev, exactLocation }))
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
              <div className="space-y-3">
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
