'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, MapPin, Phone, CreditCard, Home, ArrowLeft, RefreshCw, UserPlus } from 'lucide-react'
import { decryptOrderId } from '../../utils/orderEncryption'
import { useCart } from '../../components/CartContext'
import { useLoginID } from '../../components/LoginIDContext'
import { supabase } from '../../lib/supabase'

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
  customerEmail?: string
  orderLocation: string
  orderTime: string
  paymentMethod: string
  totalAmount: number
  deliveryCost: number
  itemsTotal: number
  isCollection: boolean
  estimatedTime?: string
  status: string
  items: OrderItem[]
  expectedDT?: string
  orderType?: number
  comments?: string | null
  addressInstructions?: string | null
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const encryptedOrderId = searchParams.get('orderId')
  const { clearCart } = useCart()
  const { user, isAuthenticated } = useLoginID()
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [estimatedTime, setEstimatedTime] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productsWithSingleSize, setProductsWithSingleSize] = useState<Set<number>>(new Set())

  // Clear cart immediately when component mounts
  useEffect(() => {
    clearCart()
  }, [clearCart])

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
        // Build request WITHOUT auth header – always use orderToken for this page
        // This avoids invalid-session errors when auth token exists but is expired
        const fetchHeaders: Record<string, string> = {}
        const orderTokenParam = `&orderToken=${encryptedOrderId}`
        
        const res = await fetch(`/api/order/details?orderId=${decryptedOrderId}${orderTokenParam}`, { 
          cache: 'no-store',
          headers: fetchHeaders
        })
        
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

        const itemsTotal = items.reduce((sum, it) => sum + (Number(it.TotalPrice) || 0), 0)
        const deliveryCost = Number(order.DeliveryPrice) || 0
        const totalAmount = Number(order.TotalAmount) || (itemsTotal + deliveryCost)

        const orderTime = order.OrderDT
          ? new Date(order.OrderDT).toLocaleString('bg-BG')
          : new Date().toLocaleString('bg-BG')

        setOrderDetails({
          orderId: String(order.OrderID),
          customerName: order.Login?.Name || '',
          customerPhone: order.Login?.phone || '',
          customerEmail: order.Login?.email || '',
          orderLocation: order.OrderLocation || order.Login?.LocationText || '',
          orderTime,
          paymentMethod: order.PaymentMethod?.PaymentMethodName || '—',
          totalAmount,
          deliveryCost,
          itemsTotal,
          isCollection: Boolean(order.IsCollection) || false,
          status: order.OrderStatus?.StatusName || '—',
          items,
          expectedDT: order.ExpectedDT,
          orderType: order.OrderType,
          comments: order.Comments || null,
          addressInstructions: order.Login?.addressInstructions || null
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

        // Check which products have only one size
        const uniqueProductIds = [...new Set(items.filter(it => it.ProductID).map(it => it.ProductID))]
        if (uniqueProductIds.length > 0) {
          checkProductSizes(uniqueProductIds)
        }
      } catch (e: any) {
        setError(e?.message || 'Нещо се обърка при зареждане на поръчката')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [encryptedOrderId])

  // Function to check which products have only one size
  async function checkProductSizes(productIds: number[]) {
    try {
      const { data: products, error } = await supabase
        .from('Product')
        .select('ProductID, SmallPrice, MediumPrice, LargePrice')
        .in('ProductID', productIds)

      if (error || !products) return

      const singleSizeProducts = new Set<number>()
      
      products.forEach((product) => {
        // Count how many sizes have prices > 0
        const availableSizes = [
          product.SmallPrice && product.SmallPrice > 0,
          product.MediumPrice && product.MediumPrice > 0,
          product.LargePrice && product.LargePrice > 0
        ].filter(Boolean).length

        // If only one size is available, add to the set
        if (availableSizes === 1) {
          singleSizeProducts.add(product.ProductID)
        }
      })

      setProductsWithSingleSize(singleSizeProducts)
    } catch (error) {
      // Silently fail - if we can't check, we'll show sizes by default
    }
  }

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
              src="/images/home/logo.png"
              alt="Pizza Stop Logo"
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
          {/* Logo */}
          <div className="mb-6">
            <img 
              src="/images/home/logo.png"
              alt="Pizza Stop Logo"
              className="w-24 h-24 object-contain mx-auto"
            />
          </div>
          
          <div className="text-green-400 text-6xl mb-4">
            <CheckCircle size={64} className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Поръчката е потвърдена! 🍕</h1>
          <p className="text-muted text-lg">Благодарим ви за поръчката. Ще се свържем с вас скоро.</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6 max-md:p-4">
          <h2 className="text-xl font-bold text-text mb-4">Детайли за поръчката</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-md:justify-start max-md:w-80 md:w-full">
            {/* Left Column */}
            <div className="space-y-4">

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
                  <span className="text-red font-bold text-lg">€</span>
                </div>
                <div>
                  <p className="text-sm text-muted">Обща сума</p>
                  <p className="font-medium text-text">{(orderDetails.itemsTotal + (orderDetails.isCollection ? 0 : orderDetails.deliveryCost)).toFixed(2)} €.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Instructions */}
        {(orderDetails.comments || orderDetails.addressInstructions) && (
          <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6 max-md:p-4">
            <h2 className="text-xl font-bold text-text mb-4">Инструкции за доставка</h2>
            
            <div className="space-y-4">
              {orderDetails.comments && (
                <div className="flex items-start gap-3 p-4 bg-orange/10 border border-orange/20 rounded-xl">
                  <div className="w-10 h-10 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange font-bold text-lg">📝</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Допълнителни инструкции</p>
                    <p className="font-medium text-text">{orderDetails.comments}</p>
                  </div>
                </div>
              )}
              
              {orderDetails.addressInstructions && (
                <div className="flex items-start gap-3 p-4 bg-blue/10 border border-blue/20 rounded-xl">
                  <div className="w-10 h-10 bg-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Инструкции за адреса</p>
                    <p className="font-medium text-text">{orderDetails.addressInstructions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                      {item.ProductSize && item.ProductID && !productsWithSingleSize.has(item.ProductID) ? (
                        <span className="text-muted ml-2">({item.ProductSize})</span>
                      ) : null}
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
                    <p className="text-text font-medium">{item.Quantity} × {Number(item.UnitPrice).toFixed(2)} €.</p>
                    <p className="text-muted text-sm">Общо: {Number(item.TotalPrice).toFixed(2)} €.</p>
                  </div>
                </div>
              ))}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-text">Сума на продуктите:</p>
                  <p className="text-text">{orderDetails.itemsTotal.toFixed(2)} €.</p>
                </div>
                {!orderDetails.isCollection && orderDetails.deliveryCost > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-text">Доставка:</p>
                    <p className="text-text">{orderDetails.deliveryCost.toFixed(2)} €.</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <p className="text-text font-semibold">Крайна сума</p>
                  <p className="text-text font-semibold">{(orderDetails.itemsTotal + (orderDetails.isCollection ? 0 : orderDetails.deliveryCost)).toFixed(2)} €.</p>
                </div>
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
          
          {isAuthenticated && user ? (
            <button
              onClick={handleBackToOrders}
              className="flex-1 bg-white/6 border border-white/12 text-text py-3 px-6 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 max-md:py-4"
            >
              <CheckCircle size={20} />
              Моите поръчки
            </button>
          ) : (
            <button
              onClick={() => {
                // Redirect to registration page with email, name, and phone pre-filled
                const email = orderDetails?.customerEmail || ''
                const name = orderDetails?.customerName || ''
                const phone = orderDetails?.customerPhone || ''
                
                const params = new URLSearchParams()
                if (email) params.append('email', email)
                if (name) params.append('name', name)
                if (phone) params.append('phone', phone)
                
                window.location.href = `/user${params.toString() ? `?${params.toString()}` : ''}`
              }}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2 max-md:py-4"
            >
              <UserPlus size={20} />
              Създайте акаунт
            </button>
          )}
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center">
          <p className="text-muted text-sm">
            Имате въпроси? Свържете се с нас на{' '}
            <a href="tel:+35968 670 070" className="text-orange hover:underline">
              068 670 070
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
              src="/images/home/logo.png"
              alt="Pizza Stop Logo"
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
