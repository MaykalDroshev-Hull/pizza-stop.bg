"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  User,
  Car,
  TrendingUp,
  History,
  Menu,
  X,
  RotateCcw,
  Star,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getKitchenOrders, updateOrderStatusInDB, testDatabaseConnection, ORDER_STATUS, KitchenOrder } from '../../lib/supabase';

interface DeliveryOrder {
  id: number;
  customerName: string;
  address: string;
  phone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  deliveryFee: number;
  status: 'ready' | 'picked_up' | 'en_route' | 'delivered' | 'issue';
  orderTime: Date;
  pickupTime?: Date;
  deliveredTime?: Date;
  specialInstructions: string;
  distance: number; // in km
  estimatedTime: number; // in minutes
  coordinates: { lat: number; lng: number };
  priority: 'normal' | 'rush' | 'vip';
  customerRating?: number;
  deliveryPhoto?: string;
  signature?: string;
  issueReason?: string;
  tips?: number;
}

// Convert KitchenOrder to DeliveryOrder format
const convertToDeliveryOrder = (kitchenOrder: KitchenOrder): DeliveryOrder => {
  const orderTime = new Date(kitchenOrder.OrderDT);
  
  // Parse coordinates if available (using default for now)
  let coordinates = { lat: 42.7339, lng: 25.4858 }; // Default to Lovech
  // Note: OrderLocationCoordinates is not available in current KitchenOrder interface
  // In a real implementation, you would add this field to the interface
  
  // Calculate distance (simplified - in real app you'd use proper distance calculation)
  const distance = Math.random() * 5 + 1; // 1-6 km
  
  // Determine status based on OrderStatusID
  let status: DeliveryOrder['status'] = 'ready';
  if (kitchenOrder.OrderStatusID === ORDER_STATUS.WITH_DRIVER) { // OrderStatusID = 4, Със Шофьора
    status = 'ready';
  } else if (kitchenOrder.OrderStatusID === ORDER_STATUS.ON_WAY) { // OrderStatusID = 8, На път
    status = 'en_route';
  }

  return {
    id: kitchenOrder.OrderID,
    customerName: kitchenOrder.CustomerName,
    address: kitchenOrder.OrderLocation || kitchenOrder.CustomerLocation || '',
    phone: kitchenOrder.CustomerPhone,
    items: kitchenOrder.Products.map(product => ({
      name: product.ProductName,
      quantity: product.Quantity,
      price: product.UnitPrice
    })),
    totalPrice: kitchenOrder.Products.reduce((sum, product) => sum + product.TotalPrice, 0),
    deliveryFee: 3.00, // Fixed delivery fee
    status,
    orderTime,
    specialInstructions: kitchenOrder.SpecialInstructions || '',
    distance,
    estimatedTime: Math.round(distance * 3 + 5), // Rough estimate
    coordinates,
    priority: 'normal' as const
  };
};

const DeliveryDashboard = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'map'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [issueReason, setIssueReason] = useState<string>('');
  const [driverLocation, setDriverLocation] = useState({ lat: 42.7339, lng: 25.4858 }); // Lovech coordinates
  
  const [stats, setStats] = useState({
    todaysDeliveries: 12,
    todaysEarnings: 156.50,
    averageTime: 18,
    rating: 4.8,
    totalTips: 45.20
  });

  // Real delivery orders from database
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch delivery orders from database
  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      const kitchenOrders = await getKitchenOrders();
      
      // Filter orders that are ready for delivery (status = WITH_DRIVER or ON_WAY)
      const deliveryOrders = kitchenOrders
        .filter(order => order.OrderStatusID === ORDER_STATUS.WITH_DRIVER || order.OrderStatusID === ORDER_STATUS.ON_WAY)
        .map(convertToDeliveryOrder);
      
      setOrders(deliveryOrders);
      console.log(`Fetched ${deliveryOrders.length} delivery orders`);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize time on client side to prevent hydration mismatch
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Test database connection first
    testDatabaseConnection().then((isConnected) => {
      if (!isConnected) {
        console.error('Database connection failed - check environment variables');
        alert('Грешка при свързване с базата данни. Моля проверете настройките.');
      }
    });
    
    // Fetch orders on component mount
    fetchDeliveryOrders();
    
    // Refresh orders every 30 seconds
    const refreshInterval = setInterval(fetchDeliveryOrders, 30000);
    
    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
    };
  }, []);

  const updateOrderStatus = async (orderId: number, newStatus: DeliveryOrder['status']) => {
    const now = new Date();
    
    // Update database for picked up orders (change from WITH_DRIVER to ON_WAY status)
    if (newStatus === 'en_route') {
      try {
        console.log(`Updating order ${orderId} from WITH_DRIVER (${ORDER_STATUS.WITH_DRIVER}) to ON_WAY status (${ORDER_STATUS.ON_WAY})`);
        const success = await updateOrderStatusInDB(orderId, ORDER_STATUS.ON_WAY);
        if (!success) {
          console.error(`Failed to update order ${orderId} status to ON_WAY in database`);
          alert('Грешка при обновяване на статуса на поръчката. Моля опитайте отново.');
          return;
        }
        console.log(`Successfully updated order ${orderId} to ON_WAY status (OrderStatusID = ${ORDER_STATUS.ON_WAY})`);
      } catch (error) {
        console.error('Error updating order status to ON_WAY:', error);
        alert('Грешка при обновяване на статуса на поръчката. Моля опитайте отново.');
        return;
      }
    }
    
    // Update database for delivered orders
    if (newStatus === 'delivered') {
      try {
        const success = await updateOrderStatusInDB(orderId, ORDER_STATUS.DELIVERED);
        if (!success) {
          console.error('Failed to update order status in database');
          return;
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        return;
      }
    }
    
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, status: newStatus };
          
          if (newStatus === 'en_route') {
            updatedOrder.pickupTime = now;
          } else if (newStatus === 'delivered') {
            updatedOrder.deliveredTime = now;
            updatedOrder.deliveryPhoto = deliveryPhoto;
            updatedOrder.signature = signature;
            updatedOrder.customerRating = 5; // Default rating
            
            // Move to history and remove from active orders
            setDeliveryHistory(prev => [updatedOrder, ...prev]);
            setTimeout(() => {
              setOrders(current => current.filter(o => o.id !== orderId));
            }, 1000);
            
            // Update stats
            setStats(prev => ({
              ...prev,
              todaysDeliveries: prev.todaysDeliveries + 1,
              todaysEarnings: prev.todaysEarnings + order.totalPrice + order.deliveryFee + (order.tips || 0)
            }));
          } else if (newStatus === 'issue') {
            updatedOrder.issueReason = issueReason;
          }
          
          return updatedOrder;
        }
        return order;
      })
    );
    
    // Reset dialog states
    setDeliveryPhoto('');
    setSignature('');
    setIssueReason('');
    setShowDeliveryDialog(false);
    setShowIssueDialog(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string, priority: string) => {
    if (priority === 'rush') return 'border-yellow-500 bg-yellow-900';
    if (priority === 'vip') return 'border-purple-500 bg-purple-900';
    
    switch (status) {
      case 'ready': return 'border-blue-500 bg-blue-900';
      case 'picked_up': return 'border-orange-500 bg-orange-900';
      case 'en_route': return 'border-orange-500 bg-orange-900';
      case 'delivered': return 'border-green-500 bg-green-900';
      case 'issue': return 'border-red-500 bg-red-900';
      default: return 'border-gray-500 bg-gray-900';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'ГОТОВА ЗА ВЗЕМАНЕ';
      case 'picked_up': return 'ВЗЕТА';
      case 'en_route': return 'НА ПЪТ';
      case 'delivered': return 'ДОСТАВЕНА';
      case 'issue': return 'ПРОБЛЕМ';
      default: return status.toUpperCase();
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'rush': return '⚡';
      case 'vip': return '👑';
      default: return '';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('bg-BG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeSince = (date: Date) => {
    const minutes = Math.floor((new Date().getTime() - date.getTime()) / 1000 / 60);
    return minutes;
  };

  const OrderCard = ({ order }: { order: DeliveryOrder }) => {
    const timeSince = getTimeSince(order.orderTime);
    const isUrgent = timeSince > 20;
    
    return (
      <div className={`rounded-lg p-4 mb-3 border-2 transition-all duration-300 hover:bg-opacity-80 ${getStatusColor(order.status, order.priority)} ${isUrgent ? 'animate-pulse' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">#{order.id}</span>
            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-200">
              {getStatusText(order.status)}
            </span>
            {order.priority !== 'normal' && (
              <span className="text-lg">{getPriorityIcon(order.priority)}</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold">
              {(order.totalPrice + order.deliveryFee).toFixed(2)} лв
            </div>
            <div className="text-xs text-gray-400">
              {order.distance.toFixed(1)}км • {order.estimatedTime}мин
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-2">
            <User size={16} className="text-blue-400" />
            <span className="text-white font-medium">{order.customerName}</span>
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin size={16} className="text-red-400 mt-0.5" />
            <span className="text-gray-300 text-sm flex-1">{order.address}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Phone size={16} className="text-green-400" />
            <a href={`tel:${order.phone}`} className="text-green-400 hover:text-green-300">
              {order.phone}
            </a>
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-3">
          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
        </div>

        {order.specialInstructions && (
          <div className="bg-yellow-900 border border-yellow-600 rounded p-2 mb-3">
            <div className="text-yellow-200 text-xs">
              📝 {order.specialInstructions}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {order.status === 'ready' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'en_route')}
              className="flex-1 bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              📦 Взех поръчката
            </button>
          )}
          
          {order.status === 'en_route' && (
            <>
              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setShowDeliveryDialog(true);
                }}
                className="flex-1 bg-green-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
              >
                ✅ Доставена
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setShowIssueDialog(true);
                }}
                className="bg-red-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors"
              >
                ⚠️
              </button>
            </>
          )}
          
          <a
            href={`https://www.google.com/maps/dir/${driverLocation.lat},${driverLocation.lng}/${order.coordinates.lat},${order.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            🗺️
          </a>
        </div>
      </div>
    );
  };

  const HistoryCard = ({ order }: { order: DeliveryOrder }) => {
    const deliveryTime = order.deliveredTime ? getTimeSince(order.deliveredTime) : 0;
    
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-white">#{order.id}</span>
            <span className="text-xs px-2 py-1 rounded bg-green-700 text-green-200">
              ДОСТАВЕНА
            </span>
            {order.customerRating && (
              <div className="flex items-center space-x-1">
                <Star size={14} className="text-yellow-400 fill-current" />
                <span className="text-yellow-400 text-sm">{order.customerRating}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold">
              {(order.totalPrice + order.deliveryFee + (order.tips || 0)).toFixed(2)} лв
            </div>
            {order.tips && (
              <div className="text-xs text-yellow-400">
                +{order.tips.toFixed(2)} лв бакшиш
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-2">
          <div>{order.customerName} • {order.address}</div>
          <div>
            Доставено преди {deliveryTime} минути ({formatTime(order.deliveredTime!)})
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
        </div>
      </div>
    );
  };

  const readyOrders = orders.filter(o => o.status === 'ready').sort((a, b) => a.distance - b.distance);
  const activeOrders = orders.filter(o => o.status === 'en_route');

  return (
    <div className="h-screen bg-black text-white font-sans flex flex-col">
      {/* Header */}
      <div className="h-16 bg-gray-900 border-b-2 border-red-600 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-red-500">🍕 PIZZA STOP</div>
          <div className="text-lg text-gray-400">Доставчик</div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-xl font-mono">
            {currentTime ? currentTime.toLocaleTimeString('bg-BG', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            }) : '--:--:--'}
          </div>
          
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center space-x-2 px-3 py-1 rounded ${
              isOnline ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-sm">{isOnline ? 'Онлайн' : 'Офлайн'}</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-600 flex">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex-1 py-3 px-4 text-center ${
            currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📋 Активни
        </button>
        <button
          onClick={() => setCurrentView('history')}
          className={`flex-1 py-3 px-4 text-center ${
            currentView === 'history' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📜 История
        </button>
        <button
          onClick={() => setCurrentView('map')}
          className={`flex-1 py-3 px-4 text-center ${
            currentView === 'map' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          🗺️ Карта
        </button>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-600">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-1">
            <CheckCircle size={16} className="text-green-400" />
            <span>Днес: <strong>{stats.todaysDeliveries}</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign size={16} className="text-green-400" />
            <span><strong>{stats.todaysEarnings.toFixed(2)} лв</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={16} className="text-orange-400" />
            <span>Средно: <strong>{stats.averageTime}мин</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <Star size={16} className="text-yellow-400" />
            <span><strong>{stats.rating}</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp size={16} className="text-purple-400" />
            <span>Бакшиши: <strong>{stats.totalTips.toFixed(2)} лв</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'dashboard' && (
          <div className="h-full flex">
            {/* Orders List */}
            <div className="w-full lg:w-1/2 p-4 overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-400 mt-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <div className="text-xl">Зареждане на поръчки...</div>
                </div>
              ) : (
                <>
                  {readyOrders.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-blue-400 mb-3">
                        📦 Готови за вземане ({readyOrders.length})
                      </h2>
                      {readyOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                  
                  {activeOrders.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-orange-400 mb-3">
                        🚗 Активни доставки ({activeOrders.length})
                      </h2>
                      {activeOrders.map(order => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                  
                  {readyOrders.length === 0 && activeOrders.length === 0 && (
                    <div className="text-center text-gray-400 mt-20">
                      <Car size={64} className="mx-auto mb-4 opacity-50" />
                      <div className="text-xl">Няма активни поръчки</div>
                      <div className="text-sm">Чакайте нови поръчки...</div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Map Placeholder */}
            <div className="hidden lg:block w-1/2 bg-gray-800 p-4">
              <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center border border-gray-600">
                <div className="text-center text-gray-400">
                  <MapPin size={64} className="mx-auto mb-4 opacity-50" />
                  <div className="text-lg">Карта на доставките</div>
                  <div className="text-sm">Интеграция с Google Maps</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-300 mb-4">
              📜 История на доставките ({deliveryHistory.length})
            </h2>
            {deliveryHistory.map(order => (
              <HistoryCard key={order.id} order={order} />
            ))}
            
            {deliveryHistory.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <History size={64} className="mx-auto mb-4 opacity-50" />
                <div className="text-xl">Няма доставени поръчки</div>
                <div className="text-sm">Историята ще се появи тук след първите доставки</div>
              </div>
            )}
          </div>
        )}

        {currentView === 'map' && (
          <div className="p-4 h-full">
            <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center border border-gray-600">
              <div className="text-center text-gray-400">
                <MapPin size={64} className="mx-auto mb-4 opacity-50" />
                <div className="text-lg">Интерактивна карта</div>
                <div className="text-sm">Google Maps интеграция с всички доставки</div>
                <div className="text-sm mt-2 text-blue-400">Оптимизирани маршрути • Движение в реално време</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Confirmation Dialog */}
      {showDeliveryDialog && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Потвърди доставка</h3>
              <button
                onClick={() => setShowDeliveryDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                Поръчка #{selectedOrder.id} за {selectedOrder.customerName}
              </p>
              <p className="text-sm text-gray-400">
                {selectedOrder.address}
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Снимка на доставката (опционално)
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                  <Camera size={32} className="mx-auto mb-2 text-gray-400" />
                  <button className="text-blue-400 hover:text-blue-300">
                    Снимай доставката
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Подпис на клиента (опционално)
                </label>
                <div className="border border-gray-600 rounded-lg p-4 h-24 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Докоснете тук за подпис</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded hover:bg-green-700 transition-colors"
              >
                ✅ Потвърди доставката
              </button>
              <button
                onClick={() => setShowDeliveryDialog(false)}
                className="bg-gray-600 text-white font-bold py-3 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Отказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Dialog */}
      {showIssueDialog && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Докладвай проблем</h3>
              <button
                onClick={() => setShowIssueDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                Поръчка #{selectedOrder.id} за {selectedOrder.customerName}
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="issue"
                  value="customer_not_home"
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="text-red-600"
                />
                <span className="text-gray-300">Клиентът не е вкъщи</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="issue"
                  value="wrong_address"
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="text-red-600"
                />
                <span className="text-gray-300">Грешен адрес</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="issue"
                  value="customer_refused"
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="text-red-600"
                />
                <span className="text-gray-300">Клиентът отказа поръчката</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="issue"
                  value="payment_issue"
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="text-red-600"
                />
                <span className="text-gray-300">Проблем с плащането</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="issue"
                  value="accident"
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="text-red-600"
                />
                <span className="text-gray-300">Инцидент/Авария</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="issue"
                  value="other"
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="text-red-600"
                />
                <span className="text-gray-300">Друго</span>
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, 'issue')}
                disabled={!issueReason}
                className="flex-1 bg-red-600 text-white font-bold py-3 px-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚨 Докладвай проблема
              </button>
              <button
                onClick={() => setShowIssueDialog(false)}
                className="bg-gray-600 text-white font-bold py-3 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Отказ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
