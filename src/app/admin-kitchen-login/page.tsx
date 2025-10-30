'use client'

import { useState, useEffect } from 'react'
import AdminLogin from '../../components/AdminLogin'

export default function AdminKitchenLoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('admin_kitchen') === 'true'
    if (isLoggedIn) {
      // Redirect to kitchen dashboard
      window.location.href = '/kitchen'
    }
  }, [])

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('👨‍🍳 Kitchen Login Attempt:', { username, provided: '***' })

      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          type: 'kitchen'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Kitchen login successful')
        // Set sessionStorage immediately for authentication check
        sessionStorage.setItem('admin_kitchen', 'true')
        setIsAuthenticated(true)

        // Redirect to kitchen after successful login
        setTimeout(() => {
          window.location.href = '/kitchen'
        }, 100)

        return true
      } else {
        console.log('❌ Kitchen login failed')
        return false
      }
    } catch (error) {
      console.error('Kitchen login error:', error)
      return false
    }
  }

  return (
    <AdminLogin
      title="Кухня"
      subtitle="Влезте в административния панел на кухнята"
      onLogin={handleLogin}
    />
  )
}

