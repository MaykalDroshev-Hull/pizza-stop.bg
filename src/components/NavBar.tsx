import CartIcon from './CartIcon'
import { User, Phone, Clock, MapPin } from 'lucide-react'

// Door Sign Component
function DoorSign() {
  // You can make this dynamic based on business hours or API
  const isOpen = true // This can be made dynamic later
  
  return (
    <div className="door-sign">
      <div className={`sign-main ${isOpen ? 'open' : 'closed'}`}>
        <div className="sign-hanger">
          <div className="hanger-ring"></div>
          <div className="hanger-strings"></div>
        </div>
        <span className="sign-text">
          {isOpen ? 'ОТВОРЕНО' : 'ЗАТВОРЕНО'}
        </span>
      </div>
    </div>
  )
}

export default function NavBar() {
  // Get the business status from the DoorSign component
  const isOpen = true // This should match the DoorSign component
  
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
              <a href="tel:+35968670070">068 670070</a>
            </div>
            <div className="contact-item">
              <Clock size={16} className="contact-icon" />
              <span>11:00-23:00</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} className="contact-icon" />
              <span>Ловеч</span>
            </div>
          </div>
          <a className="btn" href="/order">
            {isOpen ? 'ПОРЪЧАЙ СЕГА' : 'ПОРЪЧАЙ ЗА ПО-КЪСНО'}
          </a>
          <a href="/user" className="account-icon" aria-label="Акаунт">
            <User size={20} />
          </a>
          <CartIcon />
        </div>
      </nav>
    </header>
  )
}
