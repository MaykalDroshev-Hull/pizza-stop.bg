'use client'

import React from 'react'
import { X, Clock, CheckCircle } from 'lucide-react'

interface ETASelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmETA: (minutes: number) => void
  isLoading?: boolean
  orderId?: number
}

export default function ETASelectionModal({ 
  isOpen, 
  onClose, 
  onConfirmETA, 
  isLoading = false,
  orderId 
}: ETASelectionModalProps) {
  const [selectedMinutes, setSelectedMinutes] = React.useState<number | null>(null)

  if (!isOpen) return null

  const timeOptions = [
    { minutes: 15, label: '15 минути' },
    { minutes: 30, label: '30 минути'},
    { minutes: 45, label: '45 минути' },
    { minutes: 60, label: '60 минути' }
  ]

  const handleTimeSelection = (minutes: number) => {
    setSelectedMinutes(minutes)
  }

  const handleConfirm = () => {
    if (selectedMinutes) {
      onConfirmETA(selectedMinutes)
    }
  }

  const handleClose = () => {
    setSelectedMinutes(null)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-card border border-white/12 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red to-orange rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">Избери време за доставка</h2>
                <p className="text-sm text-muted">Кога ще пристигне поръчката?</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Time Options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {timeOptions.map((option) => (
              <button
                key={option.minutes}
                onClick={() => handleTimeSelection(option.minutes)}
                disabled={isLoading}
                className={`group relative p-4 border rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedMinutes === option.minutes
                    ? 'bg-orange/20 border-orange text-orange'
                    : 'bg-white/5 border-white/10 hover:border-orange/50 hover:bg-orange/10'
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl mb-2 transition-transform ${
                    selectedMinutes === option.minutes ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {option.icon}
                  </div>
                  <div className={`text-lg font-semibold transition-colors ${
                    selectedMinutes === option.minutes 
                      ? 'text-orange' 
                      : 'text-text group-hover:text-orange'
                  }`}>
                    {option.label}
                  </div>
                </div>
                
                {/* Hover effect */}
                {selectedMinutes !== option.minutes && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red/20 to-orange/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Клиентът ще получи имейл с очакваното време за доставка.</p>
                <p className="text-blue-300/80">Поръчката ще се маркира като "В доставка".</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin" />
                <span className="text-muted">Изпращане на имейл...</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-white/10 text-text font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Отказ
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !selectedMinutes}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red to-orange text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Изпращане...' : 'Потвърди'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
