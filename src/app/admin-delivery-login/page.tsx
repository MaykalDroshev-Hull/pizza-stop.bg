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

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🚚 Delivery Login Attempt:', { username, provided: '***' })
      
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          type: 'delivery'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Delivery login successful')
        setIsAuthenticated(true)
        return true
      } else {
        console.log('❌ Delivery login failed')
        return false
      }
    } catch (error) {
      console.error('Delivery login error:', error)
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

