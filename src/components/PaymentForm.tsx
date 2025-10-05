'use client'

import { useState } from 'react'
import { CreditCard, Lock, Eye, EyeOff, Lightbulb } from 'lucide-react'

interface PaymentFormProps {
  isVisible: boolean
  onPaymentDataChange: (data: PaymentData) => void
}

interface PaymentData {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
  isValid: boolean
}

// Custom SVG icons for payment methods
const ApplePayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
)

const GooglePayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function PaymentForm({ isVisible, onPaymentDataChange }: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    isValid: false
  })
  const [errors, setErrors] = useState<Partial<PaymentData>>({})
  const [showCvv, setShowCvv] = useState(false)

  const validateCardNumber = (number: string): boolean => {
    // Remove spaces and non-digits
    const cleaned = number.replace(/\D/g, '')
    return cleaned.length === 16 && /^\d{16}$/.test(cleaned)
  }

  const validateExpiryDate = (date: string): boolean => {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/
    if (!regex.test(date)) return false
    
    const [month, year] = date.split('/')
    const currentYear = new Date().getFullYear() % 100
    const currentMonth = new Date().getMonth() + 1
    
    const cardYear = parseInt(year)
    const cardMonth = parseInt(month)
    
    return cardYear > currentYear || (cardYear === currentYear && cardMonth >= currentMonth)
  }

  const validateCvv = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv)
  }

  const validateCardholderName = (name: string): boolean => {
    return name.trim().length >= 2
  }

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
    return formatted.slice(0, 19) // Max 16 digits + 3 spaces
  }

  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    let formattedValue = value

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value)
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4)
    }

    const newPaymentData = {
      ...paymentData,
      [field]: formattedValue
    }

    // Validate the updated field
    const newErrors = { ...errors }
    
    if (field === 'cardNumber') {
      if (formattedValue && !validateCardNumber(formattedValue)) {
        newErrors.cardNumber = 'Картата трябва да има 16 цифри'
      } else {
        delete newErrors.cardNumber
      }
    } else if (field === 'expiryDate') {
      if (formattedValue && !validateExpiryDate(formattedValue)) {
        newErrors.expiryDate = 'Невалидна дата на изтичане'
      } else {
        delete newErrors.expiryDate
      }
    } else if (field === 'cvv') {
      if (formattedValue && !validateCvv(formattedValue)) {
        newErrors.cvv = 'CVV трябва да има 3-4 цифри'
      } else {
        delete newErrors.cvv
      }
    } else if (field === 'cardholderName') {
      if (formattedValue && !validateCardholderName(formattedValue)) {
        newErrors.cardholderName = 'Името трябва да има поне 2 символа'
      } else {
        delete newErrors.cardholderName
      }
    }

    setErrors(newErrors)

    // Check if all fields are valid
    const isValid = 
      validateCardNumber(newPaymentData.cardNumber) &&
      validateExpiryDate(newPaymentData.expiryDate) &&
      validateCvv(newPaymentData.cvv) &&
      validateCardholderName(newPaymentData.cardholderName)

    newPaymentData.isValid = isValid
    setPaymentData(newPaymentData)
    onPaymentDataChange(newPaymentData)
  }

  const handleApplePay = () => {
    // TODO: Implement Apple Pay integration
    console.log('Apple Pay clicked')
  }

  const handleGooglePay = () => {
    // TODO: Implement Google Pay integration
    console.log('Google Pay clicked')
  }

  if (!isVisible) return null

  return (
    <div className="bg-card border border-white/12 rounded-2xl p-6 mt-6">
      <h3 className="text-xl font-bold text-text mb-6 flex items-center">
        <CreditCard size={20} className="mr-2" />
        Данни за плащане
      </h3>

      {/* Security Notice */}
      <div className="flex items-start gap-3 text-sm text-gray-300 bg-blue-400/10 border border-blue-400/20 rounded-lg p-4 mb-6">
        <Lightbulb size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
           За да осигурим безопасността на вашите данни, ние не запазваме данните на картата.
        </div>
      </div>

      <div className="space-y-6">
        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Номер на картата *
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={paymentData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all ${
                errors.cardNumber ? 'border-red-500' : 'border-white/20'
              }`}
              maxLength={19}
            />
            <CreditCard size={20} className="absolute right-3 top-3 text-gray-400" />
          </div>
          {errors.cardNumber && (
            <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>
          )}
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Име на притежателя *
          </label>
          <input
            type="text"
            placeholder="Иван Петров"
            value={paymentData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all ${
              errors.cardholderName ? 'border-red-500' : 'border-white/20'
            }`}
          />
          {errors.cardholderName && (
            <p className="text-red-400 text-sm mt-1">{errors.cardholderName}</p>
          )}
        </div>

        {/* Expiry Date and CVV */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Дата на изтичане *
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              value={paymentData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all ${
                errors.expiryDate ? 'border-red-500' : 'border-white/20'
              }`}
              maxLength={5}
              autoComplete="off"
              data-lpignore="true"
            />
            {errors.expiryDate && (
              <p className="text-red-400 text-sm mt-1">{errors.expiryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              CVV *
            </label>
            <div className="relative">
              <input
                type={showCvv ? 'text' : 'password'}
                placeholder="123"
                value={paymentData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-all ${
                  errors.cvv ? 'border-red-500' : 'border-white/20'
                }`}
                maxLength={4}
                autoComplete="off"
                data-lpignore="true"
              />
              <button
                type="button"
                onClick={() => setShowCvv(!showCvv)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
              >
                {showCvv ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.cvv && (
              <p className="text-red-400 text-sm mt-1">{errors.cvv}</p>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-green-400/10 border border-green-400/20 rounded-lg p-3">
          <Lock size={16} />
          <span>Вашите данни са защитени с SSL криптиране</span>
        </div>

        {/* Alternative Payment Methods */}
        <div className="space-y-3">
          <div className="text-sm text-gray-400 text-center">или</div>
          
          <div className="grid grid-cols-4 gap-3">
            {/* Apple Pay Button */}
            <button
              type="button"
              onClick={handleApplePay}
              className="w-full py-3 px-4 bg-black border border-gray-600 rounded-xl text-white font-medium transition-all transform hover:scale-105 hover:bg-gray-900 flex items-center justify-center gap-3"
            >
              <ApplePayIcon className="w-5 h-5" />
              <span>Apple Pay</span>
            </button>

            {/* Google Pay Button */}
            <button
              type="button"
              onClick={handleGooglePay}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-xl text-white font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <GooglePayIcon className="w-5 h-5" />
              <span>Google Pay</span>
            </button>
          </div>
        </div>

        {/* TODO: Payment Processing Integration */}
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
          <div className="text-sm text-yellow-400">
            <strong>TODO:</strong> Интегрирайте кода за обработка на плащания тук
          </div>
        </div>
      </div>
    </div>
  )
}

