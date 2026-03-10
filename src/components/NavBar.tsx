"use client"

import { useState, useEffect, useRef } from 'react'
import CartIcon from './CartIcon'
import { User, Phone, Clock, MapPin, LogOut, ChevronDown } from 'lucide-react'
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
  const [isHoursOpen, setIsHoursOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const hoursDropdownRef = useRef<HTMLDivElement>(null)
  const hoursButtonRef = useRef<HTMLButtonElement>(null)
  
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
  
  // Position dropdown just below header
  useEffect(() => {
    if (isHoursOpen && hoursButtonRef.current) {
      const header = document.querySelector('header')
      const buttonRect = hoursButtonRef.current.getBoundingClientRect()
      const headerRect = header?.getBoundingClientRect()
      
      if (headerRect) {
        setDropdownStyle({
          position: 'fixed',
          top: `${headerRect.bottom + 1}px`,
          left: `${buttonRect.left}px`,
          transform: 'none'
        })
      }
    }
  }, [isHoursOpen])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isHoursOpen &&
        hoursDropdownRef.current &&
        hoursButtonRef.current &&
        !hoursDropdownRef.current.contains(event.target as Node) &&
        !hoursButtonRef.current.contains(event.target as Node)
      ) {
        setIsHoursOpen(false)
      }
    }
    
    if (isHoursOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isHoursOpen])
  
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
            <div className="contact-item relative">
              <button
                ref={hoursButtonRef}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-black/40 hover:bg-black/70 hover:border-orange text-xs sm:text-sm text-white transition-colors cursor-pointer"
                onClick={() => setIsHoursOpen(prev => !prev)}
                aria-expanded={isHoursOpen}
                aria-controls="working-hours-dropdown"
              >
                <Clock size={14} className="contact-icon" />
                <span className="hidden sm:inline">
                  {workingHours.startsWith('Днес') ? workingHours : `Днес: ${workingHours}`}
                </span>
                <span className="sm:hidden">
                  {isOpen ? 'Отворено' : 'Затворено'}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isHoursOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isHoursOpen && (
                <div
                  ref={hoursDropdownRef}
                  id="working-hours-dropdown"
                  className="fixed w-72 rounded-2xl bg-black/95 backdrop-blur-sm border border-white/20 shadow-2xl p-4 z-50"
                  style={dropdownStyle}
                >
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-orange" />
                    Работно време
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-200">
                    <li>
                      <span className="font-medium text-white">Понеделник – Събота:</span>{' '}
                      <span>11:00 – 21:00</span>
                    </li>
                    <li>
                      <span className="font-medium text-white">Неделя:</span>{' '}
                      <span>почивен ден</span>
                    </li>
                    <li className="pt-2 border-t border-white/10 mt-2">
                      <span className="font-medium text-white">Прием на поръчки:</span>{' '}
                      <span>11:30 – 20:30</span>
                    </li>
                  </ul>
                </div>
              )}
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