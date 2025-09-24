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

  const handleLogin = (username: string, password: string): boolean => {
    // Get credentials from environment variables
    const validUsername = process.env.NEXT_PUBLIC_KITCHEN_USERNAME || '1'
    const validPassword = process.env.NEXT_PUBLIC_KITCHEN_PASSWORD || '1'
    
    console.log('👨‍🍳 Kitchen Login Attempt:', { username, provided: '***' })
    console.log('🔑 Expected credentials:', { 
      username: validUsername, 
      password: validPassword ? '***' : 'NOT_SET' 
    })

    if (username === validUsername && password === validPassword) {
      console.log('✅ Kitchen login successful')
      setIsAuthenticated(true)
      return true
    } else {
      console.log('❌ Kitchen login failed')
      return false
    }
  }

  return (
    <AdminLogin 
      title="KITCHEN DASHBOARD" 
      onLogin={handleLogin}
      redirectPath="/kitchen"
    />
  )
}

