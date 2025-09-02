'use client'

import { useState } from 'react'
import { User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react'
import styles from './user.module.css'

export default function UserPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '' 
  })
  const [resetData, setResetData] = useState({ email: '' })
  const [resetPasswordData, setResetPasswordData] = useState({ 
    password: '', 
    confirmPassword: '' 
  })

  const toggleForm = () => {
    setIsLogin(!isLogin)
    setIsResetPassword(false)
    setError('')
    setSuccess('')
  }

  const toggleResetPassword = () => {
    setIsResetPassword(!isResetPassword)
    setIsLogin(false)
    setError('')
    setSuccess('')
  }

  const backToLogin = () => {
    setIsResetPassword(false)
    setIsLogin(true)
    setError('')
    setSuccess('')
  }

  const handleLoginChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }))
  }

  const handleRegisterChange = (field: string, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }))
  }

  const handleResetChange = (field: string, value: string) => {
    setResetData(prev => ({ ...prev, [field]: value }))
  }

  const handleResetPasswordChange = (field: string, value: string) => {
    setResetPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setSuccess('Успешен вход!')
      console.log('Login successful:', data.user)
      // Here you can redirect or set user context
      
    } catch (err: any) {
      setError(err.message || 'Грешка при влизане')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess('Успешна регистрация!')
      console.log('Registration successful:', data.user)
      
      // Clear form and switch to login
      setRegisterData({ name: '', email: '', phone: '', password: '' })
      setTimeout(() => setIsLogin(true), 2000)
      
    } catch (err: any) {
      setError(err.message || 'Грешка при регистрация')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resetData.email) {
      setError('Моля, въведете имейл адреса си')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetData.email)) {
      setError('Моля, въведете валиден имейл адрес')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetData.email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при изпращането на заявката')
      }

      setSuccess(data.message || 'Ако имейл адресът съществува, ще получите линк за възстановяване на паролата')
      setResetData({ email: '' })

    } catch (err: any) {
      setError(err.message || 'Грешка при изпращането на заявката')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.userPage}>
      <div className={`${styles.wrapper} ${!isLogin ? styles.active : ''} ${isResetPassword ? styles.resetActive : ''}`}>
        {/* Rotating background elements */}
        <span className={styles.rotateBg}></span>
        <span className={styles.rotateBg2}></span>

        {/* Login Form */}
        <div className={`${styles.formBox} ${styles.login}`}>
          <h2 className={`${styles.title} ${styles.animation}`} style={{ '--i': 0, '--j': 21 } as React.CSSProperties}>
            Вход
          </h2>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}
          
          <form onSubmit={handleLogin}>
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 1, '--j': 22 } as React.CSSProperties}>
              <input 
                type="email" 
                required 
                placeholder=" " 
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                value={loginData.email}
                onChange={(e) => handleLoginChange('email', e.target.value)}
              />
              <label>Имейл</label>
              <Mail className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 2, '--j': 23 } as React.CSSProperties}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder=" " 
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                value={loginData.password}
                onChange={(e) => handleLoginChange('password', e.target.value)}
              />
              <label>Парола</label>
              <Lock className={styles.inputIcon} size={18} />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button 
              type="submit" 
              className={`${styles.btn} ${styles.animation}`} 
              style={{ '--i': 3, '--j': 24 } as React.CSSProperties}
              disabled={isLoading}
            >
              {isLoading ? 'Влизане...' : 'Влез'}
            </button>

            <div className={`${styles.linkTxt} ${styles.animation}`} style={{ '--i': 5, '--j': 25 } as React.CSSProperties}>
              <p>Нямате акаунт? <button type="button" className={styles.linkBtn} onClick={toggleForm}>Регистрация</button></p>
              <p className={styles.forgotPassword}>
                <button 
                  type="button" 
                  className={styles.forgotLink}
                  onClick={toggleResetPassword}
                >
                  Забравена парола?
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Login Info Text */}
        <div className={`${styles.infoText} ${styles.login}`}>
          <h2 className={styles.animation} style={{ '--i': 0, '--j': 20 } as React.CSSProperties}>
            Добре дошли обратно!
          </h2>
          <p className={styles.animation} style={{ '--i': 1, '--j': 21 } as React.CSSProperties}>
            Влезте в акаунта си за да поръчате любимите си ястия
          </p>
        </div>

        {/* Registration Form */}
        <div className={`${styles.formBox} ${styles.register}`}>
          <h2 className={`${styles.title} ${styles.animation}`} style={{ '--i': 17, '--j': 0 } as React.CSSProperties}>
            Регистрация
          </h2>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}
          
          <form onSubmit={handleRegister}>
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 18, '--j': 1 } as React.CSSProperties}>
              <input 
                type="text" 
                required 
                placeholder=" " 
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                value={registerData.name}
                onChange={(e) => handleRegisterChange('name', e.target.value)}
              />
              <label>Име</label>
              <User className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 19, '--j': 2 } as React.CSSProperties}>
              <input 
                type="email" 
                required 
                placeholder=" " 
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                value={registerData.email}
                onChange={(e) => handleRegisterChange('email', e.target.value)}
              />
              <label>Имейл</label>
              <Mail className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 20, '--j': 3 } as React.CSSProperties}>
              <input 
                type="tel" 
                required 
                placeholder=" " 
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                value={registerData.phone}
                onChange={(e) => handleRegisterChange('phone', e.target.value)}
              />
              <label>Телефон</label>
              <Phone className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 21, '--j': 4 } as React.CSSProperties}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                placeholder=" " 
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                value={registerData.password}
                onChange={(e) => handleRegisterChange('password', e.target.value)}
              />
              <label>Парола</label>
              <Lock className={styles.inputIcon} size={18} />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button 
              type="submit" 
              className={`${styles.btn} ${styles.animation}`} 
              style={{ '--i': 22, '--j': 5 } as React.CSSProperties}
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Регистрация'}
            </button>

            <div className={`${styles.linkTxt} ${styles.animation}`} style={{ '--i': 23, '--j': 6 } as React.CSSProperties}>
              <p>Вече имате акаунт? <button type="button" className={styles.linkBtn} onClick={toggleForm}>Вход</button></p>
            </div>
          </form>
        </div>

        {/* Registration Info Text */}
        <div className={`${styles.infoText} ${styles.register}`}>
          <h2 className={styles.animation} style={{ '--i': 17, '--j': 0 } as React.CSSProperties}>
            Присъединете се!
          </h2>
          <p className={styles.animation} style={{ '--i': 18, '--j': 1 } as React.CSSProperties}>
            Създайте акаунт за бързо поръчане и персонализирани предложения
          </p>
        </div>

        {/* Password Reset Form */}
        <div className={`${styles.formBox} ${styles.resetPassword}`}>
          <h2 className={`${styles.title} ${styles.animation}`} style={{ '--i': 24, '--j': 0 } as React.CSSProperties}>
            Забравена парола
          </h2>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}
          
          <form onSubmit={handleForgotPassword}>
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 25, '--j': 1 } as React.CSSProperties}>
              <input 
                type="email" 
                required 
                placeholder=" " 
                autoComplete="email"
                data-lpignore="true"
                data-form-type="other"
                value={resetData.email}
                onChange={(e) => handleResetChange('email', e.target.value)}
              />
              <label>Имейл адрес</label>
              <Mail className={styles.inputIcon} size={18} />
            </div>

            <button 
              type="submit" 
              className={`${styles.btn} ${styles.animation}`} 
              style={{ '--i': 26, '--j': 2 } as React.CSSProperties}
              disabled={isLoading}
            >
              {isLoading ? 'Изпращам...' : 'Изпрати линк за възстановяване'}
            </button>

            <div className={`${styles.linkTxt} ${styles.animation}`} style={{ '--i': 27, '--j': 3 } as React.CSSProperties}>
              <p>Връщане към <button type="button" className={styles.linkBtn} onClick={backToLogin}>входа</button></p>
            </div>
          </form>
        </div>

        {/* Password Reset Info Text */}
        <div className={`${styles.infoText} ${styles.resetPassword}`}>
          <h2 className={styles.animation} style={{ '--i': 24, '--j': 0 } as React.CSSProperties}>
            Възстановяване на парола
          </h2>
          <p className={styles.animation} style={{ '--i': 25, '--j': 1 } as React.CSSProperties}>
            Въведете имейл адреса си и ще получите линк за възстановяване
          </p>
        </div>
      </div>
    </main>
  )
}
