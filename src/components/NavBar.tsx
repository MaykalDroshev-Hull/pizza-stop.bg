"use client"

import { useState, useEffect } from 'react'
import CartIcon from './CartIcon'
import { User, Phone, Clock, MapPin, LogOut } from 'lucide-react'
import { isRestaurantOpen, getCurrentDayWorkingHours } from '../utils/openingHours'

// Door Sign Component
function DoorSign() {
  const isOpen = isRestaurantOpen()
  
  return (
    <div className="door-sign">
      <div className={`sign-main ${isOpen ? 'open' : 'closed'}`}>
        <div className="sign-hanger">
          <div className="hanger-ring"></div>
          <div className="hanger-strings"></div>
        </div>
        <span className="sign-text">
          {isOpen ? (
            <>
              <span className="hidden sm:inline">ОТВОРЕНО</span>
              <span className="sm:hidden">ОТВ.</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">ЗАТВОРЕНО</span>
              <span className="sm:hidden">ЗАТВ.</span>
            </>
          )}
        </span>
      </div>
    </div>
  )
}

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(isRestaurantOpen())
  const [workingHours, setWorkingHours] = useState(getCurrentDayWorkingHours())
  const [user, setUser] = useState(null)
  
  // Update open/closed status and working hours every minute
  useEffect(() => {
    const updateStatus = () => {
      setIsOpen(isRestaurantOpen())
      setWorkingHours(getCurrentDayWorkingHours())
    }
    
    // Update immediately
    updateStatus()
    
    // Update every minute
    const interval = setInterval(updateStatus, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('user')
      }
    }
  }, [])
  
  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/user'
  }
  
  return (
    <header>
      <nav className="nav container" aria-label="Основна навигация">
        <a className="brand" href="/" aria-label="Към началото">
          <div className="logo" aria-hidden="true">
            <img src="/images/home/logo.png" alt="Pizza Stop Logo" />
          </div>
          <DoorSign />
        </a>
        
        <div className="nav-contact">
          <div className="contact-info">
            <div className="contact-item">
              <Phone size={16} className="contact-icon" />
              <a href="tel:+35968670070">068 670 070</a>
            </div>
            <div className="contact-item">
              <Clock size={16} className="contact-icon" />
              <span>{workingHours}</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} className="contact-icon" />
              <span>Ловеч</span>
            </div>
          </div>
          <a className="btn" href="/order">
            {isOpen ? (
              <>
                <span className="hidden sm:inline">ПОРЪЧАЙ СЕГА</span>
                <span className="sm:hidden">ПОРЪЧАЙ</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">ПОРЪЧАЙ ЗА ПО-КЪСНО</span>
                <span className="sm:hidden">ПОРЪЧАЙ</span>
              </>
            )}
          </a>
          {user ? (
            <div className="user-menu">
              <a href="/dashboard" className="account-icon" aria-label="Dashboard">
                <User size={20} />
              </a>
              <button onClick={handleLogout} className="logout-btn" aria-label="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <a href="/user" className="account-icon" aria-label="Акаунт">
              <User size={20} />
            </a>
          )}
          <CartIcon />
        </div>
      </nav>
    </header>
  )
}