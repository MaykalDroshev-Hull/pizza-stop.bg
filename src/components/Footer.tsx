import Link from 'next/link'
import { Facebook, Settings, MapPin, Car, Pizza } from 'lucide-react'
import styles from '../styles/Footer.module.css'
import { isRestaurantOpen } from '../utils/openingHours'

export default function Footer() {
  // Business status - should match NavBar component
  const isOpen = isRestaurantOpen()
  
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          {/* Main Footer Grid */}
          <div className={styles.footerGrid}>
            {/* Company Info Section */}
            <div className={styles.footerSection}>
              <h3 className={styles.sectionTitle}>За нас</h3>
              <div className={styles.companyInfo}>
                <p className={styles.companyDescription}>
                  Pizza Stop е вашият надежден партньор за вкусна храна в Ловеч. 
                  Специализираме се в приготвянето на свежи пици, сочни дюнери и 
                  апетитни бургери с най-качествените продукти.
                </p>
                <div className={styles.companyStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>5+</span>
                    <span className={styles.statLabel}>години опит</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>1000+</span>
                    <span className={styles.statLabel}>доволни клиенти</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>24/7</span>
                    <span className={styles.statLabel}>поддръжка</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Order Section */}
            <div className={styles.footerSection}>
              <h3 className={styles.sectionTitle}>Бърза поръчка</h3>
              <div className={styles.quickOrder}>
                <p className={styles.orderText}>Натиснете, за да поръчате:</p>
                <Link href="/order" className={styles.orderButton}>
                  📞 {isOpen ? 'ПОРЪЧАЙ СЕГА' : 'ПОРЪЧАЙ ЗА ПО-КЪСНО'}
                </Link>
                <small className={styles.orderNote}>Работим мобилно — сайтът е оптимизиран за бързо поръчване.</small>
              </div>
            </div>

          </div>

          {/* Social Media Section */}
          <div className={styles.socialSection}>
            <div>
              <h3 className={styles.socialTitle}>Последвайте ни</h3>
              <div className={styles.socialLinks}>
                <a
                  href='https://www.facebook.com/profile.php?id=61556284154831'
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Facebook"
                >
                  <Facebook />
                </a>
                <a
                  href='https://www.google.com/maps/place/?q=place_id:ChIJr9f-_gndq0AR-_mEi-V-yl4'
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Google Maps"
                >
                  <MapPin />
                </a>
              </div>
            </div>
            
            {/* Administration */}
            <div className={styles.adminSection}>
              <h3 className={styles.adminTitle}>Администрация</h3>
              
              <div className={styles.adminLinks}>
                <Link href="/admin" className={styles.adminLink}>
                  <Settings className={styles.adminIcon} />
                  <span>Управление</span>
                </Link>
                <Link href="/delivery" className={styles.adminLink}>
                  <Car className={styles.adminIcon} />
                  <span>Доставка</span>
                </Link>
                <Link href="/kitchen" className={styles.adminLink}>
                  <Pizza className={styles.adminIcon} />
                  <span>Кухня</span>
                </Link>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className={styles.paymentMethods}>
              <span className={styles.paymentLabel}>Приемаме:</span>
              <div className={styles.paymentIcons}>
                                 {/* Visa */}
                 <svg className={styles.paymentIcon} viewBox="0 0 256 256" aria-label="Visa">
                   <rect width="256" height="256" fill="white"/>
                   <g style={{stroke: 'none', strokeWidth: 0, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'none', fillRule: 'nonzero', opacity: 1}} transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                     <path d="M 0 31.418 c 1.209 -0.622 2.591 -0.371 3.889 -0.395 c 2.973 0.078 5.953 -0.072 8.926 0.06 c 1.34 -0.006 2.489 1.107 2.674 2.405 c 0.933 4.523 1.789 9.064 2.704 13.599 c -1.514 -5.313 -5.51 -9.65 -10.207 -12.408 C 5.504 33.189 2.734 32.322 0 31.418 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(244,169,41)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 25.87 31.035 c 2.579 0.03 5.151 0.018 7.724 0 c -3.913 9.351 -7.562 18.81 -11.559 28.125 c -2.513 -0.078 -5.026 -0.042 -7.538 -0.042 c -2.226 -8.131 -4.302 -16.303 -6.509 -24.44 c 4.697 2.758 8.693 7.096 10.207 12.408 c 0.227 1.029 0.389 2.082 0.586 3.123 C 21.125 43.815 23.501 37.425 25.87 31.035 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(27,77,162)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 36.483 31.023 c 2.423 0.018 4.846 0.018 7.269 0 c -1.49 9.369 -3.057 18.726 -4.511 28.101 c -2.411 0.006 -4.822 0.006 -7.239 0 C 33.39 49.744 35.024 40.399 36.483 31.023 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(27,77,162)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 50.645 32.788 c 4.344 -2.854 10.021 -2.77 14.826 -1.191 c -0.221 2.076 -0.568 4.134 -0.927 6.186 c -2.555 -1.226 -5.534 -1.771 -8.31 -1.059 c -1.31 0.311 -2.603 1.938 -1.514 3.159 c 2.238 2.291 5.761 2.812 7.867 5.307 c 2.441 2.387 2.351 6.408 0.688 9.202 c -1.759 2.95 -5.145 4.493 -8.442 4.936 c -3.727 0.389 -7.61 0.156 -11.104 -1.286 c 0.371 -2.094 0.682 -4.2 1.059 -6.294 c 3.021 1.562 6.527 2.345 9.896 1.597 c 1.143 -0.383 2.321 -1.322 2.22 -2.662 c -0.377 -1.597 -2.046 -2.279 -3.344 -3.003 c -2.519 -1.238 -5.229 -2.758 -6.36 -5.48 C 45.793 38.759 47.653 34.733 50.645 32.788 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(27,77,162)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 84.119 31.059 c -2.226 0.042 -4.463 -0.09 -6.689 0.066 c -1.514 0.078 -2.471 1.484 -2.956 2.776 c -3.5 8.424 -7.042 16.83 -10.548 25.248 c 2.537 -0.006 5.073 -0.006 7.61 -0.006 c 0.532 -1.406 1.047 -2.824 1.544 -4.242 c 3.099 0.018 6.198 0.012 9.303 0.012 c 0.287 1.418 0.586 2.83 0.903 4.236 c 2.238 -0.006 4.475 -0.006 6.713 -0.012 C 88.038 49.78 86.111 40.416 84.119 31.059 z M 75.192 49.121 c 1.352 -3.476 2.459 -7.054 3.973 -10.464 c 0.449 3.53 1.328 6.988 2.052 10.47 C 79.207 49.127 77.203 49.127 75.192 49.121 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(27,77,162)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                   </g>
                 </svg>
                
                                 {/* Mastercard */}
                 <svg className={styles.paymentIcon} viewBox="0 0 256 256" aria-label="Mastercard">
                   <rect width="256" height="256" fill="white"/>
                   <g style={{stroke: 'none', strokeWidth: 0, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'none', fillRule: 'nonzero', opacity: 1}} transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                     <path d="M 45 65.105 c 5.651 -5.155 8.865 -12.456 8.851 -20.105 c 0.014 -7.649 -3.2 -14.95 -8.851 -20.105 c -4.779 -4.362 -11.118 -7.021 -18.075 -7.021 C 12.055 17.874 0 30.019 0 45 C 0 59.98 12.055 72.125 26.925 72.125 C 33.882 72.125 40.222 69.467 45 65.105 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(58,155,217)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 63.075 17.874 c -6.957 0 -13.297 2.658 -18.075 7.021 c -0.974 0.89 -1.883 1.85 -2.718 2.872 h 5.435 c 0.746 0.912 1.432 1.871 2.054 2.872 h -9.542 c -0.574 0.926 -1.093 1.885 -1.552 2.872 h 12.644 c 0.435 0.935 0.817 1.894 1.143 2.872 H 37.536 c -0.313 0.942 -0.574 1.901 -0.782 2.872 h 16.491 c 0.404 1.888 0.607 3.814 0.606 5.744 c 0 3.011 -0.489 5.909 -1.388 8.616 H 37.536 c 0.325 0.979 0.705 1.938 1.14 2.872 h 12.644 c -0.459 0.988 -0.976 1.947 -1.55 2.872 h -9.541 c 0.621 1.001 1.307 1.96 2.052 2.872 h 5.435 c -0.834 1.022 -1.742 1.982 -2.717 2.872 c 4.778 4.362 11.118 7.021 18.075 7.021 C 77.944 72.126 90 59.981 90 45 C 90 30.019 77.944 17.874 63.075 17.874 L 63.075 17.874 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(204,33,49)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 23.562 51.754 h -3.351 l 1.992 -10.572 l -4.585 10.572 h -3.056 l -0.559 -10.511 l -1.998 10.511 H 8.963 l 2.599 -13.752 h 5.229 l 0.277 8.514 l 3.687 -8.514 h 5.449 L 23.562 51.754 L 23.562 51.754 z M 61.012 51.617 c -0.917 0.254 -1.634 0.363 -2.408 0.363 c -1.714 0 -2.651 -0.866 -2.651 -2.456 c 0 -0.315 0.035 -0.649 0.099 -1.003 l 0.204 -1.093 l 0.157 -0.885 l 1.553 -8.54 h 3.333 l -0.483 2.568 h 1.71 l -0.459 2.719 H 60.35 l -0.883 4.666 c -0.033 0.152 -0.052 0.307 -0.057 0.463 c 0 0.578 0.347 0.829 1.143 0.829 c 0.381 0 0.677 -0.035 0.904 -0.104 L 61.012 51.617 L 61.012 51.617 z M 70.8 40.662 c -0.281 -0.112 -0.347 -0.112 -0.38 -0.121 c -0.178 -0.039 -0.272 -0.063 -0.289 -0.065 c -0.111 -0.019 -0.224 -0.029 -0.337 -0.028 c -1.1 0 -1.893 0.494 -2.919 1.816 l 0.296 -1.695 h -3.035 l -2.043 11.185 h 3.353 c 1.2 -6.84 1.714 -8.038 3.322 -8.038 c 0.121 0 0.261 0.01 0.424 0.028 l 0.392 0.08 L 70.8 40.662 L 70.8 40.662 z M 47.728 44.104 c 0 1.413 0.79 2.386 2.582 3.117 c 1.373 0.562 1.585 0.726 1.585 1.234 c 0 0.696 -0.605 1.01 -1.946 1.01 c -1.012 0 -1.953 -0.137 -3.038 -0.443 l -0.465 2.58 l 0.15 0.025 l 0.621 0.114 c 0.2 0.035 0.495 0.068 0.886 0.098 c 0.806 0.063 1.43 0.093 1.87 0.093 c 3.577 0 5.23 -1.181 5.23 -3.732 c 0 -1.535 -0.691 -2.435 -2.389 -3.113 c -1.422 -0.566 -1.586 -0.692 -1.586 -1.214 c 0 -0.603 0.564 -0.913 1.659 -0.913 c 0.666 0 1.575 0.063 2.436 0.168 l 0.483 -2.589 c -0.877 -0.12 -2.209 -0.219 -2.983 -0.219 C 49.029 40.322 47.717 42.041 47.728 44.104 z M 34.456 51.754 h -2.785 l 0.065 -1.159 c -0.848 0.918 -1.979 1.353 -3.515 1.353 c -1.816 0 -3.062 -1.246 -3.062 -3.055 c 0 -2.725 2.165 -4.313 5.887 -4.313 c 0.381 0 0.866 0.03 1.365 0.086 c 0.104 -0.368 0.132 -0.526 0.132 -0.726 c 0 -0.74 -0.584 -1.017 -2.149 -1.017 c -0.957 0 -2.038 0.121 -2.785 0.312 l -0.464 0.119 l -0.301 0.072 l 0.465 -2.514 c 1.671 -0.431 2.773 -0.594 4.012 -0.594 c 2.88 0 4.402 1.136 4.402 3.281 c 0 0.552 -0.051 0.971 -0.272 2.216 l -0.7 3.968 l -0.118 0.712 l -0.086 0.569 l -0.057 0.389 L 34.456 51.754 L 34.456 51.754 z M 32.011 46.771 c -0.248 -0.031 -0.499 -0.046 -0.749 -0.046 c -1.899 0 -2.861 0.572 -2.861 1.701 c 0 0.696 0.47 1.141 1.202 1.141 C 30.969 49.568 31.953 48.425 32.011 46.771 L 32.011 46.771 z M 45.449 51.513 c -1.119 0.304 -2.274 0.456 -3.434 0.454 c -3.746 -0.003 -5.699 -1.721 -5.699 -5.011 c 0 -3.839 2.484 -6.666 5.856 -6.666 c 2.759 0 4.52 1.583 4.52 4.065 c 0 0.824 -0.12 1.627 -0.411 2.761 h -6.663 c -0.02 0.116 -0.031 0.233 -0.032 0.351 c 0 1.296 0.993 1.958 2.94 1.958 c 1.197 0 2.279 -0.219 3.48 -0.708 L 45.449 51.513 L 45.449 51.513 z M 43.665 44.858 c 0.018 -0.233 0.028 -0.423 0.028 -0.571 c 0 -0.908 -0.587 -1.441 -1.585 -1.441 c -1.066 0 -1.828 0.715 -2.138 2.005 L 43.665 44.858 z M 81.217 46.683 c -0.502 3.72 -3.081 5.371 -6.509 5.371 c -3.791 0 -5.322 -2.317 -5.322 -5.155 c 0 -3.964 2.593 -6.65 6.599 -6.65 c 3.477 0 5.322 2.209 5.322 5.048 C 81.306 45.987 81.305 46.033 81.217 46.683 L 81.217 46.683 z M 77.766 45.252 c 0 -1.17 -0.471 -2.274 -1.845 -2.274 c -1.71 0 -2.77 2.036 -2.77 3.834 c 0 1.516 0.726 2.535 1.924 2.514 c 0.726 0 2.275 -0.997 2.582 -2.738 C 77.728 46.182 77.766 45.736 77.766 45.252 L 77.766 45.252 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(255,255,255)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                   </g>
                 </svg>
                
                                 {/* Apple Pay */}
                 <svg className={styles.paymentIcon} viewBox="0 0 256 256" aria-label="Apple Pay">
                   <rect width="256" height="256" fill="white"/>
                   <g style={{stroke: 'none', strokeWidth: 0, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'none', fillRule: 'nonzero', opacity: 1}} transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                     <path d="M 16.445 31.287 c -1.055 1.248 -2.743 2.233 -4.43 2.092 c -0.211 -1.688 0.615 -3.481 1.582 -4.588 c 1.055 -1.283 2.901 -2.198 4.395 -2.268 C 18.168 28.281 17.482 30.004 16.445 31.287 M 17.974 33.714 c -2.444 -0.141 -4.536 1.389 -5.696 1.389 c -1.178 0 -2.953 -1.319 -4.887 -1.283 c -2.514 0.035 -4.852 1.459 -6.135 3.727 c -2.637 4.536 -0.686 11.251 1.863 14.943 c 1.248 1.828 2.743 3.832 4.711 3.762 c 1.863 -0.07 2.602 -1.213 4.852 -1.213 c 2.268 0 2.918 1.213 4.887 1.178 c 2.039 -0.035 3.323 -1.828 4.571 -3.657 c 1.424 -2.074 2.004 -4.096 2.039 -4.202 c -0.035 -0.035 -3.938 -1.529 -3.973 -6.03 c -0.035 -3.762 3.077 -5.555 3.217 -5.661 C 21.666 34.065 18.923 33.784 17.974 33.714 M 32.091 28.615 v 27.407 h 4.254 v -9.37 h 5.889 c 5.38 0 9.159 -3.692 9.159 -9.036 s -3.709 -9.001 -9.019 -9.001 L 32.091 28.615 L 32.091 28.615 z M 36.345 32.202 h 4.905 c 3.692 0 5.801 1.969 5.801 5.432 s -2.11 5.45 -5.819 5.45 h -4.887 V 32.202 z M 59.164 56.234 c 2.672 0 5.151 -1.354 6.276 -3.498 h 0.088 v 3.287 h 3.938 V 42.381 c 0 -3.956 -3.164 -6.505 -8.034 -6.505 c -4.518 0 -7.858 2.584 -7.981 6.135 h 3.832 c 0.316 -1.688 1.881 -2.795 4.026 -2.795 c 2.602 0 4.061 1.213 4.061 3.446 v 1.512 l -5.309 0.316 c -4.94 0.299 -7.612 2.321 -7.612 5.837 C 52.449 53.878 55.209 56.234 59.164 56.234 z M 60.307 52.981 c -2.268 0 -3.709 -1.09 -3.709 -2.76 c 0 -1.723 1.389 -2.725 4.043 -2.883 l 4.729 -0.299 v 1.547 C 65.37 51.153 63.19 52.981 60.307 52.981 z M 74.723 63.477 c 4.149 0 6.1 -1.582 7.806 -6.382 L 90 36.14 h -4.325 l -5.01 16.191 h -0.088 l -5.01 -16.191 h -4.448 l 7.208 19.953 l -0.387 1.213 c -0.65 2.057 -1.705 2.848 -3.586 2.848 c -0.334 0 -0.984 -0.035 -1.248 -0.07 v 3.287 C 73.352 63.442 74.406 63.477 74.723 63.477 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(0,0,0)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                   </g>
                 </svg>
                
                                 {/* Google Pay */}
                 <svg className={styles.paymentIcon} viewBox="0 0 256 256" aria-label="Google Pay">
                   <rect width="256" height="256" fill="white"/>
                   <g style={{stroke: 'none', strokeWidth: 0, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'none', fillRule: 'nonzero', opacity: 1}} transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                     <path d="M 42.54 44.553 v 10.459 h -3.374 V 29.145 h 8.772 c 2.137 0 4.161 0.787 5.736 2.249 c 1.575 1.35 2.362 3.374 2.362 5.511 s -0.787 4.049 -2.362 5.511 c -1.575 1.462 -3.486 2.249 -5.736 2.249 L 42.54 44.553 L 42.54 44.553 z M 42.54 32.294 v 8.997 h 5.623 c 1.237 0 2.474 -0.45 3.261 -1.35 c 1.799 -1.687 1.799 -4.499 0.112 -6.186 l -0.112 -0.112 c -0.9 -0.9 -2.024 -1.462 -3.261 -1.35 L 42.54 32.294 L 42.54 32.294 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(95,99,104)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 63.796 36.793 c 2.474 0 4.386 0.675 5.848 2.024 c 1.462 1.35 2.137 3.149 2.137 5.398 v 10.797 h -3.149 v -2.474 h -0.112 c -1.35 2.024 -3.261 3.037 -5.511 3.037 c -1.912 0 -3.599 -0.562 -4.948 -1.687 c -1.237 -1.125 -2.024 -2.699 -2.024 -4.386 c 0 -1.799 0.675 -3.261 2.024 -4.386 c 1.35 -1.125 3.261 -1.575 5.511 -1.575 c 2.024 0 3.599 0.337 4.836 1.125 v -0.787 c 0 -1.125 -0.45 -2.249 -1.35 -2.924 c -0.9 -0.787 -2.024 -1.237 -3.261 -1.237 c -1.912 0 -3.374 0.787 -4.386 2.362 l -2.924 -1.799 C 58.285 37.918 60.647 36.793 63.796 36.793 z M 59.522 49.614 c 0 0.9 0.45 1.687 1.125 2.137 c 0.787 0.562 1.687 0.9 2.587 0.9 c 1.35 0 2.699 -0.562 3.711 -1.575 c 1.125 -1.012 1.687 -2.249 1.687 -3.599 c -1.012 -0.787 -2.474 -1.237 -4.386 -1.237 c -1.35 0 -2.474 0.337 -3.374 1.012 C 59.972 47.815 59.522 48.602 59.522 49.614 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(95,99,104)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 90 37.355 l -11.134 25.53 h -3.374 L 79.653 54 l -7.31 -16.532 h 3.599 l 5.286 12.709 h 0.112 l 5.173 -12.709 H 90 V 37.355 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(95,99,104)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 29.157 42.304 c 0 -1.012 -0.112 -2.024 -0.225 -3.037 H 14.873 v 5.736 h 7.985 c -0.337 1.799 -1.35 3.486 -2.924 4.499 v 3.711 h 4.836 C 27.582 50.626 29.157 46.802 29.157 42.304 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(66,133,244)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 14.873 56.812 c 4.049 0 7.423 -1.35 9.897 -3.599 l -4.836 -3.711 c -1.35 0.9 -3.037 1.462 -5.061 1.462 c -3.824 0 -7.198 -2.587 -8.322 -6.186 H 1.603 v 3.824 C 4.189 53.663 9.25 56.812 14.873 56.812 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(52,168,83)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 6.551 44.778 c -0.675 -1.799 -0.675 -3.824 0 -5.736 v -3.824 H 1.603 c -2.137 4.161 -2.137 9.11 0 13.383 L 6.551 44.778 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(251,188,4)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                     <path d="M 14.873 32.969 c 2.137 0 4.161 0.787 5.736 2.249 l 0 0 l 4.274 -4.274 c -2.699 -2.474 -6.298 -3.936 -9.897 -3.824 c -5.623 0 -10.797 3.149 -13.271 8.21 l 4.948 3.824 C 7.676 35.556 11.05 32.969 14.873 32.969 z" style={{stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(234,67,53)', fillRule: 'nonzero', opacity: 1}} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round"/>
                   </g>
                 </svg>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} Pizza Stop — Всички права запазени.
            </p>
            <div className={styles.creatorSection}>
              <span className={styles.creatorText}>
                Изработка от <a href="https://hm-wspro.vercel.app/bg" target="_blank" rel="noopener noreferrer" className={styles.creatorLink}>H&M WS Pro</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
