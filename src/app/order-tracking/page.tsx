'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Clock, MapPin, Phone, CreditCard, Truck, Store, CheckCircle, AlertCircle, Package, ChefHat, Utensils } from 'lucide-react'

interface OrderDetails {
  orderId: string
  customerName: string
  customerPhone: string
  orderLocation: string
  orderTime: string
  paymentMethod: string
  totalAmount: number
  deliveryCost: number
  isCollection: boolean
  status: string
  estimatedTime?: string
  items: Array<{
    name: string
    size: string
    quantity: number
    price: number
    addons?: Array<{
      name: string
      price: number
    }>
    comment?: string
  }>
  deliveryInstructions?: string
}

interface OrderStatus {
  id: number
  name: string
  description: string
  timestamp?: string
  completed: boolean
}

export default function OrderTrackingPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Order status tracking
  const [orderStatuses] = useState<OrderStatus[]>([
    { id: 1, name: 'Поръчката е получена', description: 'Вашата поръчка е потвърдена', completed: true },
    { id: 2, name: 'Приготвя се', description: 'Готвачите започнаха да приготвят вашата поръчка', completed: true },
    { id: 3, name: 'Готова за доставка', description: 'Поръчката е готова и очаква доставка', completed: false },
    { id: 4, name: 'В доставка', description: 'Куриерът е на път към вас', completed: false },
    { id: 5, name: 'Доставена', description: 'Поръчката е доставена успешно', completed: false }
  ])

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId)
    } else {
      setError('Не е предоставен номер на поръчка')
      setIsLoading(false)
    }
  }, [orderId])

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/order/details?orderId=${orderId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Поръчката не е намерена')
        }
        throw new Error('Грешка при зареждане на поръчката')
      }
      
      const data = await response.json()
      setOrderDetails(data)
    } catch (err: any) {
      setError(err.message || 'Грешка при зареждане на поръчката')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleBackToOrders = () => {
    window.location.href = '/dashboard'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
          <p className="text-text">Зареждане на детайли за поръчката...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle size={64} className="text-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-4">Грешка</h1>
          <p className="text-muted mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleBackToOrders}
              className="w-full bg-gradient-to-r from-orange to-red text-white py-3 px-6 rounded-xl font-medium transition-all transform hover:scale-105"
            >
              Към моите поръчки
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-white/8 hover:bg-white/12 text-text py-3 px-6 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
            >
              Начална страница
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-4">Поръчката не е намерена</h1>
          <p className="text-muted mb-6">Моля, проверете номера на поръчката</p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-orange to-red text-white py-3 px-6 rounded-xl font-medium transition-all transform hover:scale-105"
          >
            Начална страница
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5">
      {/* Header */}
      <div className="bg-card border-b border-white/12 sticky top-0 z-30">
        <div className="container py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBackToOrders}
              className="p-2 rounded-lg border border-white/12 text-muted hover:text-text transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text">Следи поръчката</h1>
              <p className="text-muted">Поръчка #{orderDetails.orderId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Order Status Timeline */}
          <div className="bg-card border border-white/12 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
              <Clock size={20} />
              Статус на поръчката
            </h2>
            
            <div className="space-y-4">
              {orderStatuses.map((status, index) => (
                <div key={status.id} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    status.completed 
                      ? 'bg-green text-white' 
                      : 'bg-white/12 text-muted'
                  }`}>
                    {status.completed ? (
                      <CheckCircle size={16} />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-muted"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      status.completed ? 'text-text' : 'text-muted'
                    }`}>
                      {status.name}
                    </h3>
                    <p className="text-sm text-muted">{status.description}</p>
                    {status.timestamp && (
                      <p className="text-xs text-muted mt-1">{status.timestamp}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-card border border-white/12 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
              <Package size={20} />
              Детайли за поръчката
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange/20 rounded-lg flex items-center justify-center">
                    <Phone size={20} className="text-orange" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Клиент</p>
                    <p className="font-medium text-text">{orderDetails.customerName}</p>
                    <p className="text-sm text-muted">{orderDetails.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue/20 rounded-lg flex items-center justify-center">
                    {orderDetails.isCollection ? <Store size={20} className="text-blue" /> : <MapPin size={20} className="text-blue" />}
                  </div>
                  <div>
                    <p className="text-sm text-muted">
                      {orderDetails.isCollection ? 'Вземане от ресторанта' : 'Адрес за доставка'}
                    </p>
                    <p className="font-medium text-text">{orderDetails.orderLocation}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green/20 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-green" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Начин на плащане</p>
                    <p className="font-medium text-text">{orderDetails.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple/20 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Време за поръчка</p>
                    <p className="font-medium text-text">{orderDetails.orderTime}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-red" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Статус</p>
                    <p className="font-medium text-text">{orderDetails.status}</p>
                  </div>
                </div>

                {orderDetails.estimatedTime && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow/20 rounded-lg flex items-center justify-center">
                      <Truck size={20} className="text-yellow" />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Очаквано време</p>
                      <p className="font-medium text-text">{orderDetails.estimatedTime}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-card border border-white/12 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
              <Utensils size={20} />
              Поръчани продукти
            </h2>
            
            <div className="space-y-4">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="p-4 bg-white/6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🍕</div>
                      <div>
                        <h4 className="font-medium text-text">{item.name}</h4>
                        <p className="text-sm text-muted">
                          {item.size} • {item.quantity}x
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-orange">{item.price.toFixed(2)} лв.</p>
                  </div>
                  
                  {/* Display addons if any */}
                  {item.addons && item.addons.length > 0 && (
                    <div className="mt-3 pl-11">
                      <div className="flex flex-wrap gap-2">
                        {item.addons.map((addon, addonIndex) => (
                          <span 
                            key={addonIndex}
                            className="text-xs bg-orange/20 text-orange px-2 py-1 rounded-md"
                          >
                            {addon.name}
                            {addon.price > 0 && ` (+${addon.price.toFixed(2)} лв.)`}
                          </span>
                        ))}
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
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-white/12 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text mb-6">Обобщение на поръчката</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Сума на продуктите:</span>
                <span className="text-white">{orderDetails.totalAmount.toFixed(2)} лв.</span>
              </div>
              
              {!orderDetails.isCollection && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Доставка:</span>
                  <span className="text-white">
                    {orderDetails.deliveryCost === 0 ? 'Безплатна' : `${orderDetails.deliveryCost.toFixed(2)} лв.`}
                  </span>
                </div>
              )}
              
              <div className="border-t border-white/12 pt-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Обща сума:</span>
                  <span className="text-white">
                    {(orderDetails.totalAmount + (orderDetails.isCollection ? 0 : orderDetails.deliveryCost)).toFixed(2)} лв.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Instructions */}
          {orderDetails.deliveryInstructions && (
            <div className="bg-card border border-white/12 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Инструкции за доставка
              </h2>
              <p className="text-text">{orderDetails.deliveryInstructions}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleBackToOrders}
              className="flex-1 bg-gradient-to-r from-orange to-red text-white py-3 px-6 rounded-xl font-medium transition-all transform hover:scale-105"
            >
              Към моите поръчки
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 bg-white/8 hover:bg-white/12 text-text py-3 px-6 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
            >
              Начална страница
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
