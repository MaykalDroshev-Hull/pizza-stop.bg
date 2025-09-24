'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Clock, MapPin, Phone, CreditCard, Truck, Store, CheckCircle, AlertCircle, Package, ChefHat, Utensils } from 'lucide-react'
import { decryptOrderId } from '@/utils/orderEncryption'

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
  items?: Array<{
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

function OrderTrackingContent() {
  const searchParams = useSearchParams()
  const encryptedOrderId = searchParams.get('orderId')
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Decrypt the order ID
  const orderId = encryptedOrderId ? decryptOrderId(encryptedOrderId) : null


  useEffect(() => {
    if (encryptedOrderId && !orderId) {
      // Invalid encrypted order ID
      setError('Невалиден номер на поръчка')
      setIsLoading(false)
    } else if (orderId) {
      fetchOrderDetails(orderId)
    } else {
      setError('Не е предоставен номер на поръчка')
      setIsLoading(false)
    }
  }, [orderId, encryptedOrderId])

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
      
      const responseData = await response.json()
      
      // Debug: Log the response data to see the structure
      console.log('API Response Data:', responseData)
      
      // Extract the order data from the API response
      const orderData = responseData.order || responseData
      
      // Debug: Log the order data and items
      console.log('Order Data:', orderData)
      console.log('Order Items:', orderData.items)
      
      // Transform the data to match our interface
      const transformedData = {
        orderId: orderData.OrderID || orderData.orderId,
        customerName: orderData.Login?.Name || orderData.customerName || 'Неизвестен клиент',
        customerPhone: orderData.Login?.phone || orderData.customerPhone || '',
        orderLocation: orderData.Login?.LocationText || orderData.orderLocation || '',
        orderTime: orderData.OrderDT || orderData.orderTime || '',
        paymentMethod: orderData.PaymentMethod?.PaymentMethodName || orderData.paymentMethod || '',
        totalAmount: parseFloat(orderData.TotalAmount || orderData.totalAmount || 0),
        deliveryCost: parseFloat(orderData.DeliveryPrice || orderData.DeliveryCost || orderData.deliveryCost || 0),
        isCollection: orderData.OrderType === 1 || orderData.isCollection || false,
        status: orderData.OrderStatus?.StatusName || orderData.status || 'Неизвестен',
        estimatedTime: orderData.ExpectedDT || orderData.estimatedTime,
        items: (orderData.items || []).map(item => ({
          name: item.ProductName || item.name || 'Продукт',
          size: item.Size || item.size || 'Стандарт',
          quantity: item.Quantity || item.quantity || 1,
          price: parseFloat(item.TotalPrice || item.UnitPrice || item.Price || item.price || 0),
          addons: item.Addons || item.addons || [],
          comment: item.Comment || item.comment
        })),
        deliveryInstructions: orderData.Login?.addressInstructions || orderData.deliveryInstructions
      }
      
      // Debug: Log the transformed data
      console.log('Transformed Data:', transformedData)
      console.log('Transformed Items:', transformedData.items)
      
      setOrderDetails(transformedData)
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

  // Format date to DD/mm/yy HH:MM
  const formatDateTime = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear().toString().slice(-2)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateString
    }
  }

  // Calculate total from individual items
  const calculateItemsTotal = (items: any[]) => {
    if (!items || items.length === 0) return 0
    
    return items.reduce((total, item) => {
      const itemTotal = parseFloat(item.TotalPrice || item.UnitPrice || item.Price || item.price || 0)
      
      // Add addon prices
      let addonTotal = 0
      if (item.Addons && Array.isArray(item.Addons)) {
        addonTotal = item.Addons.reduce((addonSum: number, addon: any) => {
          return addonSum + parseFloat(addon.Price || addon.price || 0)
        }, 0)
      }
      
      return total + itemTotal + addonTotal
    }, 0)
  }

  // Get order status based on the actual status
  const getOrderStatuses = (currentStatus: string) => {
    const statusMap: { [key: string]: number } = {
      'Получена': 1,
      'Приготвя се': 2,
      'Готова за доставка': 3,
      'В доставка': 4,
      'Доставена': 5
    }
    
    const currentStep = statusMap[currentStatus] || 1
    
    return [
      { id: 1, name: 'Поръчката е получена', description: 'Вашата поръчка е потвърдена', completed: currentStep >= 1 },
      { id: 2, name: 'Приготвя се', description: 'Готвачите започнаха да приготвят вашата поръчка', completed: currentStep >= 2 },
      { id: 3, name: 'Готова за доставка', description: 'Поръчката е готова и очаква доставка', completed: currentStep >= 3 },
      { id: 4, name: 'В доставка', description: 'Куриерът е на път към вас', completed: currentStep >= 4 },
      { id: 5, name: 'Доставена', description: 'Поръчката е доставена успешно', completed: currentStep >= 5 }
    ]
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
              {getOrderStatuses(orderDetails.status).map((status, index) => (
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
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Клиент</p>
                    <p className="font-medium text-text">{orderDetails.customerName}</p>
                    <p className="text-sm text-muted">{orderDetails.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    {orderDetails.isCollection ? <Store size={20} className="text-white" /> : <MapPin size={20} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm text-muted">
                      {orderDetails.isCollection ? 'Вземане от ресторанта' : 'Адрес за доставка'}
                    </p>
                    <p className="font-medium text-text">{orderDetails.orderLocation}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-white" />
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
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Време за поръчка</p>
                    <p className="font-medium text-text">{formatDateTime(orderDetails.orderTime)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">Статус</p>
                    <p className="font-medium text-text">{orderDetails.status}</p>
                  </div>
                </div>

                {orderDetails.estimatedTime && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                      <Truck size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Очаквано време</p>
                      <p className="font-medium text-text">{formatDateTime(orderDetails.estimatedTime)}</p>
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
              {orderDetails.items && orderDetails.items.length > 0 ? orderDetails.items.map((item, index) => (
                <div key={index} className="p-4 bg-white/6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-text">{item.name}</h4>
                      <p className="text-sm text-muted">
                        {item.size} • {item.quantity}x
                      </p>
                    </div>
                    <p className="font-bold text-orange">{(item.price || 0).toFixed(2)} лв.</p>
                  </div>
                  
                  {/* Display addons if any */}
                  {item.addons && item.addons.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {item.addons.map((addon, addonIndex) => (
                          <span 
                            key={addonIndex}
                            className="text-xs bg-orange/20 text-orange px-2 py-1 rounded-md"
                          >
                            {addon.name || 'Добавка'}
                            {(addon.price || 0) > 0 && ` (+${(addon.price || 0).toFixed(2)} лв.)`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Display comment if any */}
                  {item.comment && (
                    <div className="mt-2">
                      <p className="text-xs text-muted">
                        <span className="font-medium">Коментар:</span> {item.comment}
                      </p>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-8">
                  <Package size={48} className="text-muted mx-auto mb-4" />
                  <p className="text-muted">Няма налични детайли за продуктите</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-white/12 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text mb-6">Обобщение на поръчката</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Сума на продуктите:</span>
                <span className="text-white">{calculateItemsTotal(orderDetails.items || []).toFixed(2)} лв.</span>
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
                    {(calculateItemsTotal(orderDetails.items || []) + (orderDetails.isCollection ? 0 : orderDetails.deliveryCost)).toFixed(2)} лв.
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

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
          <p className="text-text">Зареждане...</p>
        </div>
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  )
}
