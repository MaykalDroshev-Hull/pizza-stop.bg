"use client";

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  User,
  Car,
  X
} from 'lucide-react';
import { updateOrderStatusInDB, ORDER_STATUS, KitchenOrder, LkOrderProducts } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import ETASelectionModal from '../../components/ETASelectionModal';
// AdminLogin moved to separate page at /admin-delivery-login

interface DeliveryOrder {
  id: number;
  customerName: string;
  address: string;
  phone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    customizations?: string[];
    comment?: string;
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

// Helper function to convert issue reason to readable text
const getIssueReasonText = (reason: string): string => {
  const reasonMap: { [key: string]: string } = {
    'customer_not_home': 'Клиентът не е вкъщи',
    'wrong_address': 'Грешен адрес',
    'customer_refused': 'Клиентът отказа поръчката',
    'payment_issue': 'Проблем с плащането',
    'accident': 'Инцидент/Авария',
    'other': 'Друго'
  };
  return reasonMap[reason] || reason;
};

// Convert KitchenOrder to DeliveryOrder format
const convertToDeliveryOrder = (kitchenOrder: KitchenOrder): DeliveryOrder => {
  const orderTime = new Date(kitchenOrder.OrderDT);
  
  // Parse coordinates from OrderLocationCoordinates
  let coordinates = { lat: 0, lng: 0 }; // Default to 0,0 if no valid coordinates
  if (kitchenOrder.OrderLocationCoordinates) {
    try {
      const parsedCoords = JSON.parse(kitchenOrder.OrderLocationCoordinates);
      if (parsedCoords.lat !== undefined && parsedCoords.lng !== undefined) {
        coordinates = { lat: parsedCoords.lat, lng: parsedCoords.lng };
      }
    } catch (error) {
      console.error('Error parsing OrderLocationCoordinates:', error);
    }
  }
  
  // Calculate distance (simplified - in real app you'd use proper distance calculation)
  const distance = Math.random() * 5 + 1; // 1-6 km
  
  // Determine status based on OrderStatusID
  let status: DeliveryOrder['status'] = 'ready';
  if (kitchenOrder.OrderStatusID === ORDER_STATUS.WITH_DRIVER) { // OrderStatusID = 4, Със Шофьора
    status = 'ready';
  } else if (kitchenOrder.OrderStatusID === ORDER_STATUS.IN_DELIVERY) { // OrderStatusID = 5, В процес на доставка
    status = 'en_route';
  } else if (kitchenOrder.OrderStatusID === ORDER_STATUS.DELIVERED) { // OrderStatusID = 6, Доставена
    status = 'delivered';
  }

  return {
    id: kitchenOrder.OrderID,
    customerName: kitchenOrder.CustomerName,
    address: kitchenOrder.OrderLocation || kitchenOrder.CustomerLocation || '',
    phone: kitchenOrder.CustomerPhone,
    items: kitchenOrder.Products.map(product => ({
      name: product.ProductName,
      quantity: product.Quantity,
      price: product.UnitPrice,
      customizations: product.Addons ? (() => {
        try {
          const addons = JSON.parse(product.Addons);
          return Array.isArray(addons) ? addons.map(addon => addon.Name || addon.name).filter(Boolean) : [];
        } catch {
          // Fallback to comma-separated string if JSON parsing fails
          return product.Addons.split(',').map(c => c.trim()).filter(c => c);
        }
      })() : [],
      comment: product.Comment || undefined
    })),
    totalPrice: kitchenOrder.Products.reduce((sum, product) => sum + product.TotalPrice, 0),
    deliveryFee: 3.00, // Fixed delivery fee
    status,
    orderTime,
    deliveredTime: status === 'delivered' ? orderTime : undefined, // Set deliveredTime for delivered orders
    specialInstructions: kitchenOrder.SpecialInstructions || '',
    distance,
    estimatedTime: Math.round(distance * 3 + 5), // Rough estimate
    coordinates,
    priority: 'normal' as const
  };
};

const DeliveryDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [issueReason, setIssueReason] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  
  // ETA Modal State
  const [showETAModal, setShowETAModal] = useState(false);
  const [selectedOrderForETA, setSelectedOrderForETA] = useState<DeliveryOrder | null>(null);
  const [isETALoading, setIsETALoading] = useState(false);
  
  const [stats, setStats] = useState({
    todaysDeliveries: 12,
    todaysEarnings: 156.50,
    averageTime: 18,
    rating: 4.8,
    totalTips: 45.20
  });

  // Real delivery orders from database
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Mobile detection and maps deeplink function
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Override body padding for delivery page
  useEffect(() => {
    // Store original padding
    const originalPadding = document.body.style.paddingTop;
    
    // Apply custom padding for delivery page
    const applyCustomPadding = () => {
      document.body.style.paddingTop = '0px'; // Always 0px for delivery page
    };
    
    // Apply initially
    applyCustomPadding();
    
    // Listen for resize
    window.addEventListener('resize', applyCustomPadding);
    
    // Cleanup function
    return () => {
      document.body.style.paddingTop = originalPadding;
      window.removeEventListener('resize', applyCustomPadding);
    };
  }, []);

  // Function to open address in maps app (mobile only)
  const openAddressInMaps = (address: string) => {
    if (!isMobile) return; // Only work on mobile devices

    const encodedAddress = encodeURIComponent(address);

    // Detect platform and use appropriate deeplink
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    let mapsUrl = '';

    if (isIOS) {
      // Try Apple Maps first, fallback to Google Maps
      mapsUrl = `maps://?q=${encodedAddress}`;
      // Fallback URL for Google Maps
      const fallbackUrl = `https://maps.google.com/?q=${encodedAddress}`;

      // Try to open Apple Maps, if it fails, open Google Maps
      window.location.href = mapsUrl;
      setTimeout(() => {
        window.open(fallbackUrl, '_blank');
      }, 1000);
    } else if (isAndroid) {
      // Try Google Maps app first, fallback to web
      mapsUrl = `geo:0,0?q=${encodedAddress}`;
      const fallbackUrl = `https://maps.google.com/?q=${encodedAddress}`;

      window.location.href = mapsUrl;
      setTimeout(() => {
        window.open(fallbackUrl, '_blank');
      }, 1000);
    } else {
      // Universal fallback for other mobile browsers
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(mapsUrl, '_blank');
    }
  };

  // Function to open coordinates in Google Maps (works on all devices)
  const openCoordinatesInMaps = (lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
  };

  // Driver geolocation and map have been removed for a simplified delivery view


  // Fetch delivery orders from database
  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      
      // Use client-side Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Fetch active orders with status 4 or 5, excluding pickup orders (OrderType = 1)
      const { data: orders, error: ordersError } = await supabase
        .from('Order')
        .select(`
          OrderID,
          LoginID,
          OrderDT,
          ExpectedDT,
          ReadyTime,
          OrderLocation,
          OrderLocationCoordinates,
          OrderStatusID,
          IsPaid,
          OrderType,
          DeliveryPrice,
          Comments,
          RfPaymentMethodID
        `)
        .in('OrderStatusID', [ORDER_STATUS.WITH_DRIVER, ORDER_STATUS.IN_DELIVERY])
        .neq('OrderType', 1) // Exclude pickup orders (OrderType = 1)
        .order('OrderDT', { ascending: false });

      console.log('🔍 Active orders query result:', { orders, ordersError, ORDER_STATUS_WITH_DRIVER: ORDER_STATUS.WITH_DRIVER, ORDER_STATUS_IN_DELIVERY: ORDER_STATUS.IN_DELIVERY });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
      }

      // Process active orders (status 4 and 5)
      let ordersWithDetails: DeliveryOrder[] = [];
      if (orders && orders.length > 0) {
        ordersWithDetails = await Promise.all(
          orders.map(async (order) => {
            let customer: { Name: string; phone: string; email: string } | null = null;
            if (order.LoginID) {
              const { data: customerData } = await supabase
                .from('Login')
                .select('Name, phone, email')
                .eq('LoginID', order.LoginID)
                .single();
              customer = customerData || null;
            }

            // Get products for this order
            const { data: products } = await supabase
              .from('LkOrderProduct')
              .select(`
                LkOrderProductID,
                OrderID,
                ProductID,
                ProductName,
                ProductSize,
                Quantity,
                UnitPrice,
                TotalPrice,
                Addons,
                Comment
              `)
              .eq('OrderID', order.OrderID);

            const kitchenOrder: KitchenOrder = {
              OrderID: order.OrderID,
              OrderDT: order.OrderDT,
              ExpectedDT: order.ExpectedDT,
              ReadyTime: order.ReadyTime,
              OrderLocation: order.OrderLocation,
              OrderLocationCoordinates: order.OrderLocationCoordinates,
              OrderStatusID: order.OrderStatusID,
              OrderType: order.OrderType,
              RfPaymentMethodID: order.RfPaymentMethodID || 0,
              IsPaid: order.IsPaid,
              CustomerName: customer?.Name || 'Unknown',
              CustomerPhone: customer?.phone || '',
              CustomerEmail: customer?.email || '',
              CustomerLocation: order.OrderLocation,
              Products: (products as LkOrderProducts[]) || [],
              TotalOrderPrice: (products as LkOrderProducts[])?.reduce((sum, product) => sum + product.TotalPrice, 0) || 0,
              DeliveryPrice: order.DeliveryPrice || 0,
              SpecialInstructions: '',
              Comments: order.Comments || null
            };

            return convertToDeliveryOrder(kitchenOrder);
          })
        );
      }
      
      setOrders(ordersWithDetails);
      console.log(`Fetched ${ordersWithDetails.length} delivery orders`);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('admin_delivery') === 'true';
    if (!isLoggedIn) {
      // Redirect to separate login page
      window.location.href = '/admin-delivery-login';
      return;
    }
    setIsAuthenticated(isLoggedIn);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch orders on component mount
      fetchDeliveryOrders();

      // Refresh orders every 30 seconds
      const refreshInterval = setInterval(fetchDeliveryOrders, 30000);

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [isAuthenticated]);

  const updateOrderStatus = async (orderId: number, newStatus: DeliveryOrder['status']) => {
    const now = new Date();
    
    // Update database for picked up orders (change from WITH_DRIVER to IN_DELIVERY status)
    if (newStatus === 'en_route') {
      try {
        console.log(`Updating order ${orderId} from WITH_DRIVER (${ORDER_STATUS.WITH_DRIVER}) to IN_DELIVERY status (${ORDER_STATUS.IN_DELIVERY})`);
        const success = await updateOrderStatusInDB(orderId, ORDER_STATUS.IN_DELIVERY);
        if (!success) {
          console.error(`Failed to update order ${orderId} status to IN_DELIVERY in database`);
          alert('Грешка при обновяване на статуса на поръчката. Моля опитайте отново.');
          return;
        }
        console.log(`Successfully updated order ${orderId} to IN_DELIVERY status (OrderStatusID = ${ORDER_STATUS.IN_DELIVERY})`);
      } catch (error) {
        console.error('Error updating order status to IN_DELIVERY:', error);
        alert('Грешка при обновяване на статуса на поръчката. Моля опитайте отново.');
        return;
      }
    }
    
    // Update database for reverting back to WITH_DRIVER status
    if (newStatus === 'ready') {
      try {
        console.log(`Reverting order ${orderId} from IN_DELIVERY to WITH_DRIVER status (${ORDER_STATUS.WITH_DRIVER})`);
        const success = await updateOrderStatusInDB(orderId, ORDER_STATUS.WITH_DRIVER);
        if (!success) {
          console.error(`Failed to revert order ${orderId} status to WITH_DRIVER in database`);
          alert('Грешка при обновяване на статуса на поръчката. Моля опитайте отново.');
          return;
        }
        console.log(`Successfully reverted order ${orderId} to WITH_DRIVER status (OrderStatusID = ${ORDER_STATUS.WITH_DRIVER})`);
      } catch (error) {
        console.error('Error reverting order status to WITH_DRIVER:', error);
        alert('Грешка при обновяване на статуса на поръчката. Моля опитайте отново.');
        return;
      }
    }
    
    // Note: Database update for delivered orders moved after UI update

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

            // Remove from active orders
            setTimeout(() => {
              setOrders(current => current.filter(o => o.id !== orderId));
            }, 1000);

            // Show success message
            console.log(`Order #${orderId} marked as delivered`);

            // Update stats
            setStats(prev => ({
              ...prev,
              todaysDeliveries: prev.todaysDeliveries + 1,
              todaysEarnings: prev.todaysEarnings + order.totalPrice + order.deliveryFee + (order.tips || 0)
            }));
          } else if (newStatus === 'issue') {
            updatedOrder.issueReason = issueReason;
            // Remove from active orders immediately for cancelled orders
            setTimeout(() => {
              setOrders(current => current.filter(o => o.id !== orderId));
            }, 1000);
          }

          return updatedOrder;
        }
        return order;
      })
    );
    
    // Update database for delivered orders (after UI update)
    if (newStatus === 'delivered') {
      try {
        const success = await updateOrderStatusInDB(orderId, ORDER_STATUS.DELIVERED);
        if (!success) {
          console.error('Failed to update order status in database, but order moved to history');
        } else {
          console.log(`Successfully updated order ${orderId} to DELIVERED status in database`);
        }
      } catch (error) {
        console.error('Error updating order status in database:', error);
        // Order is still moved to history even if database update fails
      }
    }

    // Update database for cancelled orders (issue reports)
    if (newStatus === 'issue') {
      try {
        // Create a comment with the issue reason
        const issueComments = getIssueReasonText(issueReason);

        // Update order to CANCELLED status with issue comment
        const response = await fetch('/api/kitchen-and-delivery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            statusId: ORDER_STATUS.CANCELLED,
            comments: issueComments
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update order status to CANCELLED in database:', errorData);
          alert('Грешка при обновяване на статуса на поръчката в базата данни, но поръчката е премахната от списъка.');
        } else {
          console.log(`Successfully updated order ${orderId} to CANCELLED status with issue: ${issueComments}`);
        }
      } catch (error) {
        console.error('Error updating order status to CANCELLED in database:', error);
        alert('Грешка при обновяване на статуса на поръчката в базата данни, но поръчката е премахната от списъка.');
      }
    }
    
    // Reset dialog states
    setDeliveryPhoto('');
    setSignature('');
    setIssueReason('');
    setShowDeliveryDialog(false);
    setShowIssueDialog(false);
    setSelectedOrder(null);
  };

  // Handle ETA selection from modal
  const handleETASelection = async (etaMinutes: number) => {
    if (!selectedOrderForETA) return;

    setIsETALoading(true);
    
    try {
      console.log(`🚗 Setting ETA for order ${selectedOrderForETA.id} to ${etaMinutes} minutes`);
      console.log('🔍 Order details:', selectedOrderForETA);
      
      const requestBody = {
        orderId: selectedOrderForETA.id,
        etaMinutes,
        driverId: 'driver-1' // You can get this from authentication context
      };
      
      console.log('🔍 Request body:', requestBody);
      
      const response = await fetch('/api/delivery/update-eta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update ETA');
      }

      const result = await response.json();
      console.log('✅ ETA updated successfully:', result);

      // Update local order state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrderForETA.id 
            ? { ...order, status: 'en_route' as const }
            : order
        )
      );

      // Close modal and reset state
      setShowETAModal(false);
      setSelectedOrderForETA(null);
      
      // Show success message
      alert(`✅ ETA зададен успешно! Клиентът ще получи имейл с очакваното време: ${etaMinutes} минути`);
      
    } catch (error) {
      console.error('❌ Error updating ETA:', error);
      alert(`❌ Грешка при задаване на ETA: ${error instanceof Error ? error.message : 'Неизвестна грешка'}`);
    } finally {
      setIsETALoading(false);
    }
  };

  // Handle pickup button click - show ETA modal
  const handlePickupClick = (order: DeliveryOrder) => {
    setSelectedOrderForETA(order);
    setShowETAModal(true);
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

  const OrderCard = ({ order }: { order: DeliveryOrder }) => {
    return (
      <div className={`rounded-lg p-3 sm:p-4 mb-3 border-2 transition-all duration-300 hover:bg-opacity-80 ${getStatusColor(order.status, order.priority)}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span className="text-lg sm:text-xl font-bold text-white">#{order.id}</span>
            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-200 truncate">
              {getStatusText(order.status)}
            </span>
            {order.priority !== 'normal' && (
              <span className="text-base sm:text-lg">{getPriorityIcon(order.priority)}</span>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-green-400 font-bold text-sm sm:text-base">
              {(order.totalPrice + order.deliveryFee).toFixed(2)} лв
            </div>
            <div className="text-xs text-gray-400">
              {order.distance.toFixed(1)}км • {order.estimatedTime}мин
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-2">
            <User size={14} className="text-blue-400 flex-shrink-0" />
            <span className="text-white font-medium text-sm sm:text-base truncate">{order.customerName}</span>
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <span 
              className={`text-gray-300 text-xs sm:text-sm flex-1 leading-relaxed ${
                isMobile ? 'cursor-pointer hover:text-white transition-colors' : ''
              }`}
              onClick={() => isMobile && openAddressInMaps(order.address)}
              title={isMobile ? 'Tap to open in Maps' : undefined}
            >
              {order.address}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Phone size={14} className="text-green-400 flex-shrink-0" />
            <a href={`tel:${order.phone}`} className="text-green-400 hover:text-green-300 text-sm">
              {order.phone}
            </a>
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-2">
          Поръчана: {order.orderTime.toLocaleString('bg-BG', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        <div className="mb-3">
          {order.items.slice(0, 3).map((item, index) => (
            <div key={index} className="text-xs text-white mb-1">
              <div>{item.quantity}x {item.name}</div>
              {item.customizations && item.customizations.length > 0 && (
                <div className="text-yellow-300 text-xs ml-2 mt-1">
                  🧂 {item.customizations.join(', ')}
                </div>
              )}
              {item.comment && (
                <div className="text-blue-300 text-xs ml-2 mt-1 bg-blue-800/30 px-2 py-1 rounded">
                  💬 {item.comment}
                </div>
              )}
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-xs text-gray-400 mt-2">
              +{order.items.length - 3} още артикула
            </div>
          )}
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
              onClick={() => handlePickupClick(order)}
              className="flex-1 bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              📦 Взех поръчката
            </button>
          )}
          
          {order.status === 'en_route' && (
            <>
              <button
                onClick={() => {
                  console.log(`🗺️ Google Maps button clicked for order ${order.id}: lat=${order.coordinates.lat}, lng=${order.coordinates.lng}, address="${order.address}"`);
                  if (order.coordinates.lat === 0 && order.coordinates.lng === 0) {
                    // Use address search when coordinates are 0,0
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
                    window.open(mapsUrl, '_blank');
                  } else {
                    // Use coordinates for navigation
                    openCoordinatesInMaps(order.coordinates.lat, order.coordinates.lng);
                  }
                }}
                className="bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                title="Отвори в Google Maps"
              >
                🗺️
              </button>
              <button
                onClick={() => {
                  window.location.href = `tel:${order.phone}`;
                }}
                className="bg-cyan-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-cyan-700 transition-colors"
                title="Позвъни на клиента"
              >
                📞
              </button>
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
                onClick={() => updateOrderStatus(order.id, 'ready')}
                className="bg-orange-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-orange-700 transition-colors"
                title="Върни към готови за вземане"
              >
                ↩️
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
          
        </div>
      </div>
    );
  };


  // Redirect to login page if not authenticated (handled in useEffect above)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">🔄 Redirecting to login...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  const readyOrders = orders.filter(o => o.status === 'ready').sort((a, b) => a.distance - b.distance);
  const activeOrders = orders.filter(o => o.status === 'en_route');

  return (
    <div className="h-screen bg-black text-white font-sans flex flex-col">

      {/* Main Content - Mobile Optimized */}
      <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Orders List */}
            <div className="w-full p-2 sm:p-4 overflow-y-auto">
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
            
            {/* Map section removed */}
          </div>
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
            
            {/* Photo and signature requirements removed - no longer needed for delivery confirmation */}
            
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
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, 'issue');
                  alert(`✅ Проблемът е докладван успешно! Поръчка #${selectedOrder.id} е отменена.`);
                }}
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

      {/* ETA Selection Modal */}
      <ETASelectionModal
        isOpen={showETAModal}
        onClose={() => {
          setShowETAModal(false);
          setSelectedOrderForETA(null);
        }}
        onConfirmETA={handleETASelection}
        isLoading={isETALoading}
        orderId={selectedOrderForETA?.id}
      />
    </div>
  );
};

export default DeliveryDashboard;
