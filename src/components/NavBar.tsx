import CartIcon from './CartIcon'

export default function NavBar() {
  return (
    <header>
      <nav className="nav container" aria-label="Основна навигация">
        <a className="brand" href="/" aria-label="Към началото">
          <div className="logo" aria-hidden="true">
            <img src="/images/home/logo.png" alt="Pizza Stop Logo" />
          </div>
          <div>
            <h1>Pizza Stop</h1>
            <small>🔥 Свежи • Бързи • Вкусни</small>
          </div>
        </a>
        
        <div className="nav-contact">
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <a href="tel:+35968670070">068 670070</a>
            </div>
            <div className="contact-item">
              <span className="contact-icon">⏰</span>
              <span>11:00-23:00</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span>Ловеч</span>
            </div>
          </div>
          <a className="btn" href="/order">ПОРЪЧАЙ СЕГА</a>
          <CartIcon />
        </div>
      </nav>
    </header>
  )
}
