'use client'

import { useState } from 'react'
import { User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react'
import styles from './user.module.css'

export default function UserPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const toggleForm = () => {
    setIsLogin(!isLogin)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', isLogin ? 'login' : 'register')
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

          <form onSubmit={handleSubmit}>
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 1, '--j': 22 } as React.CSSProperties}>
              <input type="email" required placeholder=" " />
              <label>Имейл</label>
              <Mail className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 2, '--j': 23 } as React.CSSProperties}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder=" " 
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

            <button type="submit" className={`${styles.btn} ${styles.animation}`} style={{ '--i': 3, '--j': 24 } as React.CSSProperties}>
              Влез
            </button>

            <div className={`${styles.linkTxt} ${styles.animation}`} style={{ '--i': 5, '--j': 25 } as React.CSSProperties}>
              <p>Нямате акаунт? <button type="button" className={styles.linkBtn} onClick={toggleForm}>Регистрация</button></p>
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

          <form onSubmit={handleSubmit}>
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 18, '--j': 1 } as React.CSSProperties}>
              <input type="text" required placeholder=" " />
              <label>Име</label>
              <User className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 19, '--j': 2 } as React.CSSProperties}>
              <input type="email" required placeholder=" " />
              <label>Имейл</label>
              <Mail className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 20, '--j': 3 } as React.CSSProperties}>
              <input type="tel" required placeholder=" " />
              <label>Телефон</label>
              <Phone className={styles.inputIcon} size={18} />
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--i': 21, '--j': 4 } as React.CSSProperties}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                placeholder=" " 
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

            <button type="submit" className={`${styles.btn} ${styles.animation}`} style={{ '--i': 22, '--j': 5 } as React.CSSProperties}>
              Регистрация
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
    </main>
  )
}
