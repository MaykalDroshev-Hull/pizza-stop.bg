'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react'
import styles from './user.module.css'
import { useLoginID } from '../../components/LoginIDContext'

export default function UserPage() {
  const { login, user } = useLoginID()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  // Get return URL from query parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const returnUrlParam = urlParams.get('returnUrl')
      if (returnUrlParam) {
        setReturnUrl(decodeURIComponent(returnUrlParam))
      }
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to dashboard
      window.location.href = '/dashboard'
    }
  }, [user])

  // Prevent browser validation tooltips
  useEffect(() => {
    const preventBrowserValidation = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' && target.hasAttribute('required')) {
        target.addEventListener('invalid', (e) => {
          e.preventDefault()
        })
      }
    }

    document.addEventListener('focusin', preventBrowserValidation)
    return () => {
      document.removeEventListener('focusin', preventBrowserValidation)
    }
  }, [])

  // Form state
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '' 
  })

  // Email validation states
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    errors: [] as string[],
    showTooltip: false
  })

  // Loading overlay state
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)

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
            errors.push('Частите на домейна не могат да започват или завършват с тире')
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

  const toggleForm = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setEmailValidation({ isValid: true, errors: [], showTooltip: false })
  }

  const handleLoginChange = (field: string, value: string) => {
    // Prevent spaces in password field
    if (field === 'password' && value.includes(' ')) {
      return
    }
    
    setLoginData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'email') {
      const validation = validateEmail(value)
      setEmailValidation({ ...validation, showTooltip: false })
    }
  }

  const handleRegisterChange = (field: string, value: string) => {
    // Prevent spaces in password field
    if (field === 'password' && value.includes(' ')) {
      return
    }
    
    setRegisterData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'email') {
      const validation = validateEmail(value)
      setEmailValidation({ ...validation, showTooltip: false })
    }
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any browser validation messages
    const form = e.currentTarget as HTMLFormElement
    form.reportValidity = () => true
    
    // Check email validation before proceeding
    if (loginData.email) {
      const emailValidation = validateEmail(loginData.email)
      if (!emailValidation.isValid) {
        setError('Моля, въведете валиден имейл адрес')
        // Show tooltip briefly - force it to show
        setEmailValidation({ ...emailValidation, showTooltip: true })
        // Clear any existing timeout
        setTimeout(() => {
          setEmailValidation(prev => ({ ...prev, showTooltip: false }))
        }, 3000)
        return
      }
    }
    
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

      console.log('Login successful:', data.user)
      
      // Show loading overlay
      setShowLoadingOverlay(true)
      
      // Fetch complete profile data including coordinates
      try {
        const profileResponse = await fetch(`/api/user/profile?userId=${data.user.id}`)
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.user) {
            // Use the complete profile data for login
            login(profileData.user)
          } else {
            // Fallback to basic login data
            login(data.user)
          }
        } else {
          // Fallback to basic login data
          login(data.user)
        }
      } catch (profileError) {
        console.error('Error fetching profile data:', profileError)
        // Fallback to basic login data
        login(data.user)
      }
      
      // Redirect as soon as profile data is ready
      if (returnUrl) {
        window.location.href = returnUrl
      } else {
        window.location.href = '/dashboard'
      }
      
    } catch (err: any) {
      setError(err.message || 'Невалиден имейл или парола')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any browser validation messages
    const form = e.currentTarget as HTMLFormElement
    form.reportValidity = () => true
    
    // Check email validation before proceeding
    if (registerData.email) {
      const emailValidation = validateEmail(registerData.email)
      if (!emailValidation.isValid) {
        setError('Моля, въведете валиден имейл адрес')
        return
      }
    }
    
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
      
      // If there's a return URL, show message about logging in to continue
      if (returnUrl) {
        setSuccess('Успешна регистрация! Сега влезте в акаунта си за да продължите с поръчката.')
      }
      
      setTimeout(() => setIsLogin(true), 2000)
      
    } catch (err: any) {
      setError(err.message || 'Грешка при регистрация')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <main className={styles.userPage}>
      <div className={`${styles.wrapper} ${!isLogin ? styles.active : ''}`}>
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
                onFocus={() => {
                  if (!emailValidation.isValid && loginData.email) {
                    setEmailValidation(prev => ({ ...prev, showTooltip: true }))
                  }
                }}
                onBlur={() => {
                  // Don't hide tooltip immediately on blur, let timeout handle it
                  setTimeout(() => {
                    setEmailValidation(prev => ({ ...prev, showTooltip: false }))
                  }, 100)
                }}
                className={!emailValidation.isValid && loginData.email ? styles.invalidInput : ''}
              />
              <label>Имейл</label>
              <Mail className={styles.inputIcon} size={18} />
              {!emailValidation.isValid && loginData.email && (
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
                <a 
                  href="/forgot-password"
                  className={styles.forgotLink}
                >
                  Забравена парола?
                </a>
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
        <div className={`${styles.formBox} ${styles.register} ${!isLogin ? styles.active : ''}`}>
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
                onFocus={() => setEmailValidation(prev => ({ ...prev, showTooltip: true }))}
                onBlur={() => setEmailValidation(prev => ({ ...prev, showTooltip: false }))}
                className={!emailValidation.isValid && registerData.email ? styles.invalidInput : ''}
              />
              <label>Имейл</label>
              <Mail className={styles.inputIcon} size={18} />
              {!emailValidation.isValid && registerData.email && (
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

      </div>

      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingText}>Моля Изчакайте</div>
            <div className={styles.loaderContainer}>
              <div className={styles.loader}></div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
