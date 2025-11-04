'use client'

import { useState } from 'react'
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import styles from '../styles/admin-login.module.css'

interface AdminLoginProps {
  title: string
  subtitle?: string
  onLogin: (username: string, password: string) => Promise<boolean>
  redirectPath?: string
}

export default function AdminLogin({ title, subtitle, onLogin, redirectPath }: AdminLoginProps) {
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
        
        sessionStorage.setItem(storageKey, 'true')
        
        // Small delay to ensure sessionStorage is set before redirect
        setTimeout(() => {
          if (redirectPath) {
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
    <div className={styles.adminLoginPage}>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.container}>
        <div className={styles.loginCard}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <Lock size={32} />
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>
              {subtitle || 'Влезте в административния панел на Pizza Stop'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`${styles.errorMessage} ${styles.error}`}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email Field */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Имейл адрес
              </label>
              <div className={styles.inputWrapperWithIcon}>
                <User className={styles.inputIcon} size={20} />
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.input}
                  placeholder="Въведете имейл адрес"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Парола
              </label>
              <div className={styles.inputWrapperWithIcon}>
                <Lock className={styles.inputIcon} size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${styles.input} ${styles.inputWithPasswordToggle}`}
                  placeholder="Въведете парола"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className={styles.submitButton}
            >
              {isLoading ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  <span>Влизане...</span>
                </>
              ) : (
                <span>Влезте в системата</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              © {new Date().getFullYear()} Pizza Stop — Защитен административен достъп
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className={styles.backLink}>
          <a href="/" className={styles.backLinkButton}>
            ← Обратно към началната страница
          </a>
        </div>
      </div>
    </div>
  )
}
