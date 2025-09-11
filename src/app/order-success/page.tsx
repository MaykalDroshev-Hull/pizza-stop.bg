'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, MapPin, Phone, CreditCard, Home, ArrowLeft } from 'lucide-react'

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
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [estimatedTime, setEstimatedTime] = useState<string>('')

  useEffect(() => {
    if (orderId) {
      // In a real app, you would fetch order details from the API
      // For now, we'll simulate the order details
      setTimeout(() => {
        setOrderDetails({
          orderId,
          customerName: 'Георги Петров', // This would come from the API
          customerPhone: '+359 88 123 4567',
          orderLocation: 'ул. Витоша 15, Ловеч',
          orderTime: new Date().toLocaleString('bg-BG'),
          paymentMethod: 'В брой на адрес',
          totalAmount: 24.50,
          isCollection: false,
          status: 'Потвърдена'
        })
        setIsLoading(false)
      }, 1000)
    }
  }, [orderId])

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
        <div className="max-w-4xl mx-auto px-4 py-4">
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="text-green-400 text-6xl mb-4">
            <CheckCircle size={64} className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Поръчката е потвърдена!</h1>
          <p className="text-muted text-lg">Благодарим ви за поръчката. Ще се свържем с вас скоро.</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-text mb-4">Детайли за поръчката</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {orderDetails.isCollection ? 'Вземане от' : 'Доставка до'}
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

        {/* Estimated Time Section */}
        <div className="bg-card border border-white/12 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-text mb-4">Очаквано време</h2>
          
          {estimatedTime ? (
            <div className="flex items-center gap-3 p-4 bg-green/10 border border-green/20 rounded-xl">
              <Clock size={24} className="text-green" />
              <div>
                <p className="font-medium text-text">Готово за {estimatedTime}</p>
                <p className="text-sm text-muted">
                  {orderDetails.isCollection 
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
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleGoHome}
            className="flex-1 bg-gradient-to-r from-orange to-red text-white py-3 px-6 rounded-xl font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Към началната страница
          </button>
          
          <button
            onClick={handleBackToOrders}
            className="flex-1 bg-white/6 border border-white/12 text-text py-3 px-6 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
          <p className="text-text">Зареждане...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
