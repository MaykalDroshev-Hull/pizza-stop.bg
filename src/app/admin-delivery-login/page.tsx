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
        // Set sessionStorage immediately for authentication check
        sessionStorage.setItem('admin_delivery', 'true')
        setIsAuthenticated(true)

        // Redirect to delivery after successful login
        setTimeout(() => {
          window.location.href = '/delivery'
        }, 100)

        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Delivery login error:', error)
      return false
    }
  }

  return (
    <AdminLogin
      title="Доставки"
      subtitle="Влезте в административния панел за доставки"
      onLogin={handleLogin}
    />
  )
}

