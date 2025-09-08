'use client'

import { useState, useEffect } from 'react'
import { Mail, AlertCircle } from 'lucide-react'
import styles from './forgot-password.module.css'
import { useLoginID } from '../../components/LoginIDContext'

export default function ForgotPasswordPage() {
  const { user } = useLoginID()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetData, setResetData] = useState({ email: '' })

  // Email validation states
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    errors: [] as string[],
    showTooltip: false
  })

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = '/dashboard'
    }
  }, [user])

  // Comprehensive email validation function
  const validateEmail = (email: string) => {
    const errors: string[] = []
    
    if (!email) {
      return { isValid: true, errors: [] }
    }

    // Check for exactly one @ symbol
    const atCount = (email.match(/@/g) || []).length
    if (atCount === 0) {
      errors.push('Имейлът трябва да съдържа символ @')
    } else if (atCount > 1) {
      errors.push('Имейлът може да съдържа само един символ @')
    }

    if (atCount === 1) {
      const [localPart, domainPart] = email.split('@')
      
      // Local part validation
      if (!localPart) {
        errors.push('Частта преди @ не може да бъде празна')
      } else {
        // Check for consecutive dots
        if (localPart.includes('..')) {
          errors.push('Не са позволени последователни точки (..)')
        }
        
        // Check if starts or ends with dot
        if (localPart.startsWith('.') || localPart.endsWith('.')) {
          errors.push('Частта преди @ не може да започва или завършва с точка')
        }
        
        // Check allowed characters in local part
        const localPartRegex = /^[a-zA-Z0-9._+-]+$/
        if (!localPartRegex.test(localPart)) {
          errors.push('Частта преди @ може да съдържа само букви, цифри, точки, долни черти, тирета и плюсове')
        }
      }
      
      // Domain part validation
      if (!domainPart) {
        errors.push('Частта след @ не може да бъде празна')
      } else {
        // Check for at least one dot
        if (!domainPart.includes('.')) {
          errors.push('Домейнът трябва да съдържа поне една точка')
        }
        
        // Check for consecutive dots
        if (domainPart.includes('..')) {
          errors.push('Не са позволени последователни точки (..) в домейна')
        }
        
        // Check if starts or ends with dot
        if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
          errors.push('Домейнът не може да започва или завършва с точка')
        }
        
        // Check allowed characters in domain
        const domainRegex = /^[a-zA-Z0-9.-]+$/
        if (!domainRegex.test(domainPart)) {
          errors.push('Домейнът може да съдържа само букви, цифри, тирета и точки')
        }
        
        // Check domain labels don't start/end with -
        const domainLabels = domainPart.split('.')
        for (const label of domainLabels) {
          if (label.startsWith('-') || label.endsWith('-')) {
            errors.push('Частите на домейна не могат да започват или завършва с тире')
            break
          }
        }
        
        // Check top-level domain is at least 2 characters
        const topLevelDomain = domainLabels[domainLabels.length - 1]
        if (topLevelDomain && topLevelDomain.length < 2) {
          errors.push('Домейнът от най-високо ниво трябва да бъде поне 2 символа дълъг')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const handleResetChange = (field: string, value: string) => {
    setResetData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'email') {
      const validation = validateEmail(value)
      setEmailValidation({ ...validation, showTooltip: false })
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any browser validation messages
    const form = e.currentTarget as HTMLFormElement
    form.reportValidity = () => true
    
    if (!resetData.email) {
      setError('Моля, въведете имейл адреса си')
      return
    }

    // Use our comprehensive email validation
    const emailValidation = validateEmail(resetData.email)
    if (!emailValidation.isValid) {
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
    <main className={styles.forgotPasswordPage}>
      <div className={styles.wrapper}>
        {/* Background elements */}
        <span className={styles.rotateBg}></span>
        <span className={styles.rotateBg2}></span>

        {/* Forgot Password Form */}
        <div className={styles.formBox}>
          <h2 className={styles.title}>
            Забравена парола
          </h2>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}
          
          <form onSubmit={handleForgotPassword}>
            <div className={styles.inputBox}>
              <input 
                type="email" 
                required 
                placeholder=" " 
                autoComplete="email"
                data-lpignore="true"
                data-form-type="other"
                value={resetData.email}
                onChange={(e) => handleResetChange('email', e.target.value)}
                onFocus={() => setEmailValidation(prev => ({ ...prev, showTooltip: true }))}
                onBlur={() => setEmailValidation(prev => ({ ...prev, showTooltip: false }))}
                className={!emailValidation.isValid && resetData.email ? styles.invalidInput : ''}
              />
              <label>Имейл адрес</label>
              <Mail className={styles.inputIcon} size={18} />
              {!emailValidation.isValid && resetData.email && (
                <AlertCircle 
                  className={styles.validationIcon} 
                  size={18} 
                  onMouseEnter={() => setEmailValidation(prev => ({ ...prev, showTooltip: true }))}
                  onMouseLeave={() => setEmailValidation(prev => ({ ...prev, showTooltip: false }))}
                />
              )}
              {emailValidation.showTooltip && !emailValidation.isValid && emailValidation.errors.length > 0 && (
                <div className={styles.validationTooltip}>
                  <div className={styles.tooltipContent}>
                    {emailValidation.errors.map((error, index) => (
                      <div key={index} className={styles.tooltipError}>
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className={styles.btn}
              disabled={isLoading}
            >
              {isLoading ? 'Изпращам...' : 'Изпрати линк за възстановяване'}
            </button>

            <div className={styles.linkTxt}>
              <p>Вече имате акаунт? <a href="/user" className={styles.linkBtn}>Вход</a></p>
            </div>
          </form>
        </div>

        {/* Info Text */}
        <div className={styles.infoText}>
          <h2>
            ВЪЗСТАНОВЯВАНЕ НА ПАРОЛА
          </h2>
          <p>
            Въведете имейл адреса си и ще получите линк за възстановяване на паролата си
          </p>
        </div>
      </div>
    </main>
  )
}
