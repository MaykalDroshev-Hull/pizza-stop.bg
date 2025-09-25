'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import styles from './reset-password.module.css'
import { useLoginID } from '../../components/LoginIDContext'

function ResetPasswordContent() {
  const { user } = useLoginID()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({ 
    password: '', 
    confirmPassword: '' 
  })

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = '/dashboard'
    }
  }, [user])

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError('Невалиден или липсващ токен за възстановяване')
    }
  }, [token])

  const handlePasswordChange = (field: string, value: string) => {
    // Prevent spaces in password field
    if (value.includes(' ')) {
      return
    }
    
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setError('Невалиден или липсващ токен за възстановяване')
      return
    }

    if (!passwordData.password) {
      setError('Моля, въведете нова парола')
      return
    }

    if (passwordData.password.length < 8) {
      setError('Паролата трябва да е поне 8 символа дълга')
      return
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordData.password)) {
      setError('Паролата трябва да съдържа поне една буква и една цифра')
      return
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Паролите не съвпадат')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          password: passwordData.password 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при възстановяването на паролата')
      }

      setSuccess('Паролата е възстановена успешно! Пренасочваме ви към входа...')
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = '/user'
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Грешка при възстановяването на паролата')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.resetPasswordPage}>
      <div className={styles.wrapper}>
        {/* Background elements */}
        <span className={styles.rotateBg}></span>
        <span className={styles.rotateBg2}></span>

        {/* Reset Password Form */}
        <div className={styles.formBox}>
          <h2 className={styles.title}>
            Нова парола
          </h2>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}
          
          <form onSubmit={handleResetPassword}>
            <div className={styles.inputBox}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder=" " 
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                value={passwordData.password}
                onChange={(e) => handlePasswordChange('password', e.target.value)}
              />
              <label>Нова парола</label>
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className={styles.inputBox}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                placeholder=" " 
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              />
              <label>Потвърди паролата</label>
              <button
                type="button"
                className={styles.eyeIcon}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button 
              type="submit" 
              className={styles.btn}
              disabled={isLoading || !token}
            >
              {isLoading ? 'Възстановявам...' : 'Възстанови паролата'}
            </button>

            <div className={styles.linkTxt}>
              <p>Помните си паролата? <a href="/user" className={styles.linkBtn}>Вход</a></p>
            </div>
          </form>
        </div>

        {/* Info Text */}
        <div className={styles.infoText}>
          <h2>
            ВЪЗСТАНОВЯВАНЕ НА ПАРОЛА
          </h2>
          <p>
            Въведете нова парола за вашия акаунт
          </p>
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red/5 via-orange/5 to-yellow/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
          <p className="text-text">Зареждане...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
