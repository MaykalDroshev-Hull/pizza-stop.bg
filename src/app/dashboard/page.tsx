'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Lock, 
  MapPin, 
  Pizza, 
  Clock, 
  Heart, 
  Settings,
  LogOut,
  ArrowRight,
  Plus,
  Edit3
} from 'lucide-react'
import { isRestaurantOpen } from '@/utils/openingHours'
import styles from './dashboard.module.css'

interface User {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

interface Order {
  OrderID: string
  OrderDate: string
  TotalAmount: number
  Status: string
  DeliveryAddress: string
  Products: Array<{
    ProductName: string
    Quantity: number
    Price: number
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('orders')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [favouriteOrder, setFavouriteOrder] = useState<Order | null>(null)
  
  // Form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [addressData, setAddressData] = useState({
    address: '',
    phone: '',
    addressInstructions: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [hasFetchedData, setHasFetchedData] = useState(false)
  const [isOpen, setIsOpen] = useState(isRestaurantOpen())

  useEffect(() => {
    checkAuth()
  }, []) // Only run once on mount

  useEffect(() => {
    if (user && !hasFetchedData) {
      fetchUserData()
      setHasFetchedData(true)
    }
  }, [user, hasFetchedData]) // Run when user changes and data hasn't been fetched

  // Update restaurant open/closed status every minute
  useEffect(() => {
    const updateStatus = () => {
      setIsOpen(isRestaurantOpen())
    }
    
    // Update immediately
    updateStatus()
    
    // Update every minute
    const interval = setInterval(updateStatus, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
    try {
      // Check if user is logged in (you might want to use a more robust auth check)
      const userData = localStorage.getItem('user')
      if (!userData) {
        router.push('/user')
        return
      }
      
      const userObj = JSON.parse(userData)
      setUser(userObj)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/user')
    }
  }

  const fetchUserData = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      
      // Fetch user's orders
      const ordersResponse = await fetch(`/api/user/orders?userId=${user.id}`)
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.orders || [])
        
        // Find favourite order (most ordered)
        if (ordersData.orders && ordersData.orders.length > 0) {
          const orderCounts = new Map<string, number>()
          ordersData.orders.forEach((order: Order) => {
            const key = JSON.stringify(order.Products.map(p => p.ProductName).sort())
            orderCounts.set(key, (orderCounts.get(key) || 0) + 1)
          })
          
          let maxCount = 0
          let favourite: Order | null = null
          
          ordersData.orders.forEach((order: Order) => {
            const key = JSON.stringify(order.Products.map(p => p.ProductName).sort())
            const count = orderCounts.get(key) || 0
            if (count > maxCount) {
              maxCount = count
              favourite = order
            }
          })
          
          setFavouriteOrder(favourite)
        }
      }
      
      // Fetch user profile data
      const profileResponse = await fetch(`/api/user/profile?userId=${user.id}`)
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.user) {
          // Update address data with existing user data
          setAddressData({
            address: profileData.user.address || '',
            phone: profileData.user.phone || '',
            addressInstructions: profileData.user.addressInstructions || ''
          })
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setError('Грешка при зареждане на данните')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/user')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Новите пароли не съвпадат')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Паролата трябва да е поне 6 символа дълга')
      return
    }
    
    setIsUpdating(true)
    setError('')
    setUpdateSuccess('')
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Грешка при промяна на паролата')
      }
      
      setUpdateSuccess('Паролата е променена успешно!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      
    } catch (err: any) {
      setError(err.message || 'Грешка при промяна на паролата')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddressUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsUpdating(true)
    setError('')
    setUpdateSuccess('')
    
    try {
      const response = await fetch('/api/user/update-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          address: addressData
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Грешка при обновяване на адреса')
      }
      
      setUpdateSuccess('Адресът е обновен успешно!')
      
    } catch (err: any) {
      setError(err.message || 'Грешка при обновяване на адреса')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOrderAgain = (order: Order) => {
    // Add order items to cart (you'll need to implement this)
    console.log('Ordering again:', order)
    router.push('/order')
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Зареждане на вашия панел...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <User size={24} />
            </div>
            <div>
              <h1>Добре дошли обратно, {user.name}!</h1>
              <p>{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            Изход
          </button>
        </header>

        {/* Navigation Tabs */}
        <nav className={styles.tabs}>
                     <button
             className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
             onClick={() => setActiveTab('orders')}
           >
             <Pizza size={20} />
             Поръчки
           </button>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            Профил
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            Настройки
          </button>
        </nav>

        {/* Error and Success Messages */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {updateSuccess && <div className={styles.successMessage}>{updateSuccess}</div>}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>
            {/* Favourite Order */}
            {favouriteOrder && (
              <section className={styles.favouriteOrder}>
                <div className={styles.sectionHeader}>
                  <Heart className={styles.sectionIcon} size={24} />
                  <h2>Вашата любима поръчка</h2>
                </div>
                <div className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <h3>Order #{favouriteOrder.OrderID}</h3>
                      <p className={styles.orderDate}>
                        <Clock size={16} />
                        {new Date(favouriteOrder.OrderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={styles.orderTotal}>
                      ${favouriteOrder.TotalAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className={styles.orderProducts}>
                    {favouriteOrder.Products.map((product, index) => (
                      <div key={index} className={styles.productItem}>
                        <span>{product.ProductName}</span>
                        <span>x{product.Quantity}</span>
                        <span>${product.Price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                                     <button 
                     onClick={() => handleOrderAgain(favouriteOrder)}
                     className={styles.orderAgainBtn}
                   >
                     <Plus size={20} />
                     Поръчай отново
                   </button>
                </div>
              </section>
            )}

            {/* Recent Orders */}
            <section className={styles.recentOrders}>
              <div className={styles.sectionHeader}>
                <Clock className={styles.sectionIcon} size={24} />
                                 <h2>Последни поръчки</h2>
              </div>
              {orders.length > 0 ? (
                <div className={styles.ordersList}>
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.OrderID} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div>
                          <h3>Order #{order.OrderID}</h3>
                          <p className={styles.orderDate}>
                            <Clock size={16} />
                            {new Date(order.OrderDate).toLocaleDateString()}
                          </p>
                          <p className={styles.orderStatus}>{order.Status}</p>
                        </div>
                        <div className={styles.orderTotal}>
                          ${order.TotalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className={styles.orderProducts}>
                        {order.Products.slice(0, 3).map((product, index) => (
                          <div key={index} className={styles.productItem}>
                            <span>{product.ProductName}</span>
                            <span>x{product.Quantity}</span>
                            <span>${product.Price.toFixed(2)}</span>
                          </div>
                        ))}
                        {order.Products.length > 3 && (
                          <p className={styles.moreItems}>+{order.Products.length - 3} още продукти</p>
                        )}
                      </div>
                                             <button 
                         onClick={() => handleOrderAgain(order)}
                         className={styles.orderAgainBtn}
                       >
                         <Plus size={20} />
                         Поръчай отново
                       </button>
                    </div>
                  ))}
                </div>
              ) : (
                                 <div className={styles.emptyState}>
                   <h3>Все още нямате поръчки</h3>
                   <p>Започнете първата си поръчка и ще я покажем тук!</p>
                   <button 
                     onClick={() => router.push('/order')}
                     className={styles.primaryBtn}
                   >
                     {isOpen ? 'Поръчай сега' : 'Поръчай за по-късно'}
                     <ArrowRight size={20} />
                   </button>
                 </div>
              )}
            </section>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            <section className={styles.profileSection}>
              <div className={styles.sectionHeader}>
                <User className={styles.sectionIcon} size={24} />
                                 <h2>Лична информация</h2>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.infoRow}>
                                     <label>Име:</label>
                  <span>{user.name}</span>
                </div>
                <div className={styles.infoRow}>
                                     <label>Имейл:</label>
                  <span>{user.email}</span>
                </div>
                <div className={styles.infoRow}>
                                     <label>Телефон:</label>
                                     <span>{user.phone || 'Не е предоставен'}</span>
                </div>
                <div className={styles.infoRow}>
                                     <label>Член от:</label>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            {/* Change Password */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <Lock className={styles.sectionIcon} size={24} />
                                 <h2>Промяна на парола</h2>
              </div>
              <form onSubmit={handlePasswordChange} className={styles.form}>
                <div className={styles.formGroup}>
                                       <label htmlFor="currentPassword">Текуща парола</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                                       <label htmlFor="newPassword">Нова парола</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                                       <label htmlFor="confirmPassword">Потвърди нова парола</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className={styles.primaryBtn}
                  disabled={isUpdating}
                >
                                     {isUpdating ? 'Обновяване...' : 'Промени парола'}
                </button>
              </form>
            </section>

            {/* Update Address */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <MapPin className={styles.sectionIcon} size={24} />
                                 <h2>Адрес за доставка</h2>
              </div>
                             <form onSubmit={handleAddressUpdate} className={styles.form}>
                 <div className={styles.formGroup}>
                   <label htmlFor="address">Адрес</label>
                   <input
                     type="text"
                     id="address"
                     value={addressData.address}
                     onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
                     placeholder="Улица, номер, град, пощенски код"
                     required
                   />
                 </div>
                 <div className={styles.formGroup}>
                   <label htmlFor="phone">Телефон</label>
                   <input
                     type="tel"
                     id="phone"
                     value={addressData.phone}
                     onChange={(e) => setAddressData(prev => ({ ...prev, phone: e.target.value }))}
                     required
                   />
                 </div>
                 <div className={styles.formGroup}>
                   <label htmlFor="addressInstructions">Инструкции за доставка</label>
                   <textarea
                     id="addressInstructions"
                     value={addressData.addressInstructions}
                     onChange={(e) => setAddressData(prev => ({ ...prev, addressInstructions: e.target.value }))}
                     placeholder="Допълнителни инструкции за доставка (например: код на входа, етаж, апартамент)"
                     rows={3}
                   />
                 </div>
                <button 
                  type="submit" 
                  className={styles.primaryBtn}
                  disabled={isUpdating}
                >
                                     {isUpdating ? 'Обновяване...' : 'Обнови адрес'}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
