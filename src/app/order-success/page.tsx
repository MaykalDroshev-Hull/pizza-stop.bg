'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, MapPin, Phone, CreditCard, Home, ArrowLeft, RefreshCw } from 'lucide-react'
import { decryptOrderId } from '../../utils/orderEncryption'

interface OrderItem {
  ProductID: number
  ProductName: string
  ProductSize?: string
  Quantity: number
  UnitPrice: number
  TotalPrice: number
  Addons?: Array<{ name: string; price?: number }> | null
  Comment?: string | null
}

interface OrderDetails {
  orderId: string
  customerName: string
  customerPhone: string
  orderLocation: string
  orderTime: string
  paymentMethod: string
  totalAmount: number
  isCollection: boolean
  estimatedTime?: string
  status: string
  items: OrderItem[]
  expectedDT?: string
  orderType?: number
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const encryptedOrderId = searchParams.get('orderId')
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [estimatedTime, setEstimatedTime] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      if (!encryptedOrderId) {
        setError('Липсва номер на поръчката.')
        setIsLoading(false)
        return
      }

      const decryptedOrderId = decryptOrderId(encryptedOrderId)
      if (!decryptedOrderId) {
        setError('Невалиден или изтекъл линк за поръчката.')
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/order/details?orderId=${decryptedOrderId}`, { cache: 'no-store' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || 'Грешка при зареждане на поръчката')
        }
        const data = await res.json()
        const order = data?.order

        if (!order) throw new Error('Поръчката не е намерена')

        const items: OrderItem[] = (order.items || []).map((it: any) => ({
          ProductID: it.ProductID,
          ProductName: it.ProductName,
          ProductSize: it.ProductSize,
          Quantity: it.Quantity,
          UnitPrice: it.UnitPrice,
          TotalPrice: it.TotalPrice,
          Addons: Array.isArray(it.Addons) ? it.Addons : null,
          Comment: it.Comment || null
        }))

        const total = items.reduce((sum, it) => sum + (Number(it.TotalPrice) || 0), 0)

        const orderTime = order.OrderDT
          ? new Date(order.OrderDT).toLocaleString('bg-BG')
          : new Date().toLocaleString('bg-BG')

        setOrderDetails({
          orderId: String(order.OrderID),
          customerName: order.Login?.Name || '',
          customerPhone: order.Login?.phone || '',
          orderLocation: order.OrderLocation || order.Login?.LocationText || '',
          orderTime,
          paymentMethod: order.PaymentMethod?.PaymentMethodName || '—',
          totalAmount: Number(total) || 0,
          isCollection: Boolean(order.IsCollection) || false,
          status: order.OrderStatus?.StatusName || '—',
          items,
          expectedDT: order.ExpectedDT,
          orderType: order.OrderType
        })

        // Calculate initial estimated time display
        if (order.ExpectedDT) {
          const expectedDateTime = new Date(order.ExpectedDT)
          const now = new Date()
          const diffInMinutes = Math.max(0, Math.floor((expectedDateTime.getTime() - now.getTime()) / (1000 * 60)))
          
          if (diffInMinutes <= 0) {
            setEstimatedTime('Готово за доставка') // This will be handled by the display logic
          } else if (diffInMinutes < 60) {
            // Less than 1 hour: show minutes
            setEstimatedTime(`${diffInMinutes} минути`)
          } else {
            // 1 hour or more: show date and time
            setEstimatedTime(expectedDateTime.toLocaleString('bg-BG', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }))
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Нещо се обърка при зареждане на поръчката')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [encryptedOrderId])

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleBackToOrders = () => {
    window.location.href = '/dashboard'
  }

  const handleRefreshTime = async () => {
    if (!orderDetails?.expectedDT) return
    
    // Start spinning animation
    setIsRefreshing(true)
    
    // Calculate time remaining until expected delivery
    setTimeout(() => {
      const expectedDateTime = new Date(orderDetails.expectedDT!)
      const now = new Date()
      const diffInMinutes = Math.max(0, Math.floor((expectedDateTime.getTime() - now.getTime()) / (1000 * 60)))
      
      if (diffInMinutes <= 0) {
        setEstimatedTime('Готово за доставка') // This will be handled by the display logic
      } else if (diffInMinutes < 60) {
        // Less than 1 hour: show minutes
        setEstimatedTime(`${diffInMinutes} минути`)
      } else {
        // 1 hour or more: show date and time
        setEstimatedTime(expectedDateTime.toLocaleString('bg-BG', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }))
      }
      
      // Stop spinning animation after a short delay
      setTimeout(() => {
        setIsRefreshing(false)
      }, 100)
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          {/* Logo container */}
          <div className="flex flex-col items-center justify-center">
            <img 
              src="https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU2Mzk1NzY5LCJleHAiOjI3MDI0NzU3Njl9.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg"
              alt="PIZZA STOP Logo"
              className="w-32 h-32 object-contain"
              style={{
                animation: 'logoSpin 1s linear forwards'
              }}
            />
            
            {/* Loading text */}
            <div className="mt-6 text-center">
              <p className="text-white text-lg font-semibold mb-2">Зареждане на детайли за поръчката...</p>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle"></div>
                <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-text mb-2">Грешка</h1>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-orange to-red text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-transform"
          >
            <Home size={20} className="inline mr-2" />
            Към началната страница
          </button>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-text mb-2">Поръчката не е намерена</h1>
          <p className="text-muted mb-6">Моля, проверете номера на поръчката и опитайте отново.</p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-orange to-red text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-transform"
          >
            <Home size={20} className="inline mr-2" />
            Към началната страница
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5">
      {/* Header */}
      <div className="bg-card border-b border-white/12 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 max-md:px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 text-text hover:text-orange transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Начало</span>
            </button>
            <h1 className="text-xl font-bold text-text">Поръчка #{orderDetails.orderId}</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 max-md:px-6">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="text-green-400 text-6xl mb-4">
            <CheckCircle size={64} className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Поръчката е потвърдена!</h1>
          <p className="text-muted text-lg">Благодарим ви за поръчката. Ще се свържем с вас скоро.</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6 max-md:p-4">
          <h2 className="text-xl font-bold text-text mb-4">Детайли за поръчката</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:justify-start max-md:w-80 md:w-full">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green/10 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} className="text-green" />
                </div>
                <div>
                  <p className="text-sm text-muted">Статус</p>
                  <p className="font-medium text-text">{orderDetails.status}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center">
                  <Clock size={20} className="text-orange" />
                </div>
                <div>
                  <p className="text-sm text-muted">Време на поръчка</p>
                  <p className="font-medium text-text">{orderDetails.orderTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue/10 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted">
                    {orderDetails.orderType === 1 ? 'Вземане от' : 'Доставка до'}
                  </p>
                  <p className="font-medium text-text">{orderDetails.orderLocation}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple/10 rounded-full flex items-center justify-center">
                  <Phone size={20} className="text-purple" />
                </div>
                <div>
                  <p className="text-sm text-muted">Телефон</p>
                  <p className="font-medium text-text">{orderDetails.customerPhone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow/10 rounded-full flex items-center justify-center">
                  <CreditCard size={20} className="text-yellow" />
                </div>
                <div>
                  <p className="text-sm text-muted">Начин на плащане</p>
                  <p className="font-medium text-text">{orderDetails.paymentMethod}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red/10 rounded-full flex items-center justify-center">
                  <span className="text-red font-bold text-lg">лв</span>
                </div>
                <div>
                  <p className="text-sm text-muted">Обща сума</p>
                  <p className="font-medium text-text">{orderDetails.totalAmount.toFixed(2)} лв.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6 max-md:p-4">
          <h2 className="text-xl font-bold text-text mb-4">Артикули</h2>
          {orderDetails.items && orderDetails.items.length > 0 ? (
            <div className="space-y-4">
              {orderDetails.items.map((item, idx) => (
                <div key={`${item.ProductID}-${idx}`} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/4 border border-white/10">
                  <div className="flex-1">
                    <p className="text-text font-medium">
                      {item.ProductName}
                      {item.ProductSize ? <span className="text-muted ml-2">({item.ProductSize})</span> : null}
                    </p>
                    {item.Addons && item.Addons.length > 0 ? (
                      <p className="text-sm text-muted mt-1">
                        Добавки: {item.Addons.map((a: any) => a?.name).filter(Boolean).join(', ')}
                      </p>
                    ) : null}
                    {item.Comment ? (
                      <p className="text-sm text-muted mt-1">Бележка: {item.Comment}</p>
                    ) : null}
                  </div>
                  <div className="text-right min-w-[140px]">
                    <p className="text-text font-medium">{item.Quantity} × {Number(item.UnitPrice).toFixed(2)} лв.</p>
                    <p className="text-muted text-sm">Общо: {Number(item.TotalPrice).toFixed(2)} лв.</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <p className="text-text font-semibold">Крайна сума</p>
                <p className="text-text font-semibold">{orderDetails.totalAmount.toFixed(2)} лв.</p>
              </div>
            </div>
          ) : (
            <p className="text-muted">Няма артикули за показване.</p>
          )}
        </div>

        {/* Estimated Time Section */}
        <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6 max-md:p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text">Очаквано време</h2>
            <button
              onClick={handleRefreshTime}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 bg-orange/10 border border-orange/20 rounded-lg text-orange hover:bg-orange/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={isRefreshing ? 'refresh-spinning' : ''} />
              <span className="text-sm font-medium">Обнови</span>
            </button>
          </div>
          
          {estimatedTime ? (
            <div className="flex items-center gap-3 p-4 bg-green/10 border border-green/20 rounded-xl">
              <Clock size={24} className="text-green" />
              <div>
                <p className="font-medium text-text">
                  {estimatedTime === 'Готово за доставка' 
                    ? (orderDetails.orderType === 1 ? 'Готово за вземане' : 'Готово за доставка')
                    : estimatedTime.includes(':')
                      ? `Очаквайте на ${estimatedTime}`
                      : orderDetails.orderType === 1 
                        ? `Готово за вземане след около ${estimatedTime}`
                        : `Готово за доставка след около ${estimatedTime}`
                  }
                </p>
                <p className="text-sm text-muted">
                  {orderDetails.orderType === 1 
                    ? 'Можете да вземете поръчката от ресторанта' 
                    : 'Ще доставим поръчката до вашия адрес'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-orange/10 border border-orange/20 rounded-xl">
              <Clock size={24} className="text-orange" />
              <div>
                <p className="font-medium text-text">Изчисляваме времето...</p>
                <p className="text-sm text-muted">
                  Ресторантът ще ви уведоми за очакваното време скоро
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 max-md:gap-3">
          <button
            onClick={handleGoHome}
            className="flex-1 bg-gradient-to-r from-orange to-red text-white py-3 px-6 rounded-xl font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2 max-md:py-4"
          >
            <Home size={20} />
            Към началната страница
          </button>
          
          <button
            onClick={handleBackToOrders}
            className="flex-1 bg-white/6 border border-white/12 text-text py-3 px-6 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 max-md:py-4"
          >
            <CheckCircle size={20} />
            Моите поръчки
          </button>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center">
          <p className="text-muted text-sm">
            Имате въпроси? Свържете се с нас на{' '}
            <a href="tel:+359888123456" className="text-orange hover:underline">
              +359 888 123 456
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          {/* Logo container */}
          <div className="flex flex-col items-center justify-center">
            <img 
              src="https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU2Mzk1NzY5LCJleHAiOjI3MDI0NzU3Njl9.BzjSV5QdUHUyFM8_cf5k1SFWfKqqeRQnCZ09sRjtLvg"
              alt="PIZZA STOP Logo"
              className="w-32 h-32 object-contain"
              style={{
                animation: 'logoSpin 1s linear forwards'
              }}
            />
            
            {/* Loading text */}
            <div className="mt-6 text-center">
              <p className="text-white text-lg font-semibold mb-2">Зареждане...</p>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle"></div>
                <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-orange rounded-full animate-bounce-gentle" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
