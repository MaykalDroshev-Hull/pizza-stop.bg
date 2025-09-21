'use client'

import { useState, useEffect } from 'react'
import AdminLogin from '../../components/AdminLogin'

export default function AdminDeliveryLoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('admin_delivery') === 'true'
    if (isLoggedIn) {
      // Redirect to delivery dashboard
      window.location.href = '/delivery'
    }
  }, [])

  const handleLogin = (username: string, password: string): boolean => {
    // Get credentials from environment variables
    const validUsername = process.env.NEXT_PUBLIC_DELIVERY_USERNAME || '1'
    const validPassword = process.env.NEXT_PUBLIC_DELIVERY_PASSWORD || '1'
    
    console.log('🚚 Delivery Login Attempt:', { username, provided: '***' })
    console.log('🔑 Expected credentials:', { 
      username: validUsername, 
      password: validPassword ? '***' : 'NOT_SET' 
    })

    if (username === validUsername && password === validPassword) {
      console.log('✅ Delivery login successful')
      setIsAuthenticated(true)
      return true
    } else {
      console.log('❌ Delivery login failed')
      return false
    }
  }

  return (
    <AdminLogin 
      title="DELIVERY DASHBOARD" 
      onLogin={handleLogin}
      redirectPath="/delivery"
    />
  )
}
