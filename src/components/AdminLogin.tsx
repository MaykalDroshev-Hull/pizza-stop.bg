'use client'

import { useState } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface AdminLoginProps {
  title: string
  onLogin: (username: string, password: string) => Promise<boolean>
  redirectPath?: string
}

export default function AdminLogin({ title, onLogin, redirectPath }: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await onLogin(username, password)
      
      if (success) {
        // Store login state in sessionStorage with correct key
        let storageKey = 'admin_delivery'
        if (title.toLowerCase().includes('kitchen')) {
          storageKey = 'admin_kitchen'
        } else if (title.toLowerCase().includes('delivery')) {
          storageKey = 'admin_delivery'
        }
        
        console.log('🔑 Setting sessionStorage key:', storageKey)
        sessionStorage.setItem(storageKey, 'true')
        
        // Small delay to ensure sessionStorage is set before redirect
        setTimeout(() => {
          if (redirectPath) {
            console.log('🔄 Redirecting to:', redirectPath)
            window.location.href = redirectPath
          } else {
            window.location.reload()
          }
        }, 100)
      } else {
        setError('Невалиден имейл адрес или парола')
      }
    } catch (err) {
      setError('Грешка при влизане')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-10 bg-gray-900 rounded-3xl border-2 border-red-600 shadow-2xl shadow-red-500/10">
        <div className="text-center mb-10">
          <div className="text-5xl font-bold text-red-500 mb-4 animate-pulse">🍕 PIZZA STOP</div>
          <div className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{title}</div>
          <div className="text-gray-400 text-lg">🔒 Влезте в админ панела</div>
          <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-red-700 rounded-full mx-auto mt-4"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded-lg flex items-center space-x-2">
            <AlertCircle size={18} className="text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative">
            <div className="flex items-center space-x-3 mb-2">
              <User className="text-red-400" size={24} />
              <label className="text-lg font-semibold text-white">
              Имейл адрес
              </label>
            </div>
            <input
              type="email"
              required
              placeholder="Въведете имейл адрес..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
            />
          </div>

          <div className="relative">
            <div className="flex items-center space-x-3 mb-2">
              <Lock className="text-red-400" size={24} />
              <label className="text-lg font-semibold text-white">
                Парола
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Въведете парола..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-4 pr-12 bg-gray-800 border-2 border-gray-600 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full py-5 bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white font-bold text-xl rounded-2xl hover:from-red-700 hover:via-red-800 hover:to-red-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center shadow-lg hover:shadow-red-500/25"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Влизам...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🚀</span>
                <span>ВЛЕЗ В СИСТЕМАТА</span>
              </div>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="text-gray-400 text-base mb-2">
            🛡️ Само за упълномощени потребители
          </div>
          <div className="text-gray-500 text-sm">
            Сигурен достъп до админ панела
          </div>
        </div>
      </div>
    </div>
  )
}
