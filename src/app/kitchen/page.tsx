"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Wifi, Users, TrendingUp, X, RotateCcw } from 'lucide-react';
import { getKitchenOrders, updateOrderStatusInDB, ORDER_STATUS, KitchenOrder } from '../../lib/supabase';

interface Order {
  id: number;
  customerName: string;
  address: string;
  phone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    customizations: string[];
  }>;
  totalPrice: number;
  status: string;
  orderTime: Date;
  workingStartTime: Date | null;
  completedTime: Date | null;
  estimatedTime: number;
  specialInstructions: string;
  isPaid: boolean;
  orderStatusId: number;
}

const KitchenCommandCenter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newOrdersHeight, setNewOrdersHeight] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const [workAreaWidth, setWorkAreaWidth] = useState(60);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; order: Order | null; action: string | null }>({ show: false, order: null, action: null });
  
  // Customization settings
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showColumns, setShowColumns] = useState({ new: true, working: true, completed: true });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundTheme, setSoundTheme] = useState<'classic' | 'modern' | 'kitchen' | 'custom'>('classic');
  const [volume, setVolume] = useState(0.7);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'info' | 'warning' | 'urgent', timestamp: Date}>>([]);
  const [lastActionTime, setLastActionTime] = useState<{[key: string]: number}>({});
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{x: number, y: number, orderId: number} | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 47,
    averageTime: 14,
    activeOrders: 0
  });

  // Convert Supabase data to Order format
  const convertKitchenOrderToOrder = (kitchenOrder: KitchenOrder): Order => {
    const orderTime = new Date(kitchenOrder.OrderDT);
    const status = getStatusFromId(kitchenOrder.OrderStatusID);
    
    return {
      id: kitchenOrder.OrderID,
      customerName: kitchenOrder.CustomerName,
      address: kitchenOrder.OrderLocation || kitchenOrder.CustomerLocation || '',
      phone: kitchenOrder.CustomerPhone,
      items: kitchenOrder.Products.map(product => {
        let customizations: string[] = [];
        
        if (product.Addons) {
          try {
            // Try to parse as JSON array first
            const addonsData = JSON.parse(product.Addons);
            if (Array.isArray(addonsData)) {
              customizations = addonsData.map((addon: any) => addon.Name || addon.name || addon).filter(Boolean);
            } else {
              // Fallback to comma-separated string
              customizations = product.Addons.split(',').map(a => a.trim()).filter(Boolean);
            }
          } catch (error) {
            // If JSON parsing fails, treat as comma-separated string
            customizations = product.Addons.split(',').map(a => a.trim()).filter(Boolean);
          }
        }
        
        return {
          name: `${product.ProductName}${product.ProductSize ? ` (${product.ProductSize})` : ''}`,
          quantity: product.Quantity,
          price: product.UnitPrice,
          customizations
        };
      }),
      totalPrice: kitchenOrder.TotalOrderPrice,
      status,
      orderTime,
      workingStartTime: status === 'working' ? new Date(orderTime.getTime() + 5 * 60 * 1000) : null,
      completedTime: status === 'completed' ? new Date(orderTime.getTime() + 15 * 60 * 1000) : null,
      estimatedTime: 15, // Default estimate
      specialInstructions: kitchenOrder.SpecialInstructions || '',
      isPaid: kitchenOrder.IsPaid,
      orderStatusId: kitchenOrder.OrderStatusID
    };
  };

  const getStatusFromId = (orderStatusId: number): string => {
    switch (orderStatusId) {
      case ORDER_STATUS.ACCEPTED: return 'new';           // ID 1 - Приета → НОВИ ПОРЪЧКИ
      case ORDER_STATUS.IN_PREPARATION: return 'working'; // ID 2 - В процес на приготвяне → РАБОТИ СЕ
      case ORDER_STATUS.READY: return 'completed';        // ID 3 - Приготвена → ЗАВЪРШЕНИ
      case ORDER_STATUS.WITH_DRIVER: return 'delivery';   // ID 4 - При шофьора → Delivery page
      case ORDER_STATUS.IN_DELIVERY: return 'delivery';   // ID 5 - В процес на доставка → Delivery page
      case ORDER_STATUS.DELIVERED: return 'delivered';    // ID 6 - Доставена → Delivered (not shown in kitchen)
      default: return 'new';
    }
  };

  const getStatusIdFromStatus = (status: string): number => {
    switch (status) {
      case 'new': return ORDER_STATUS.ACCEPTED;           // ID 1 - Приета → НОВИ ПОРЪЧКИ
      case 'working': return ORDER_STATUS.IN_PREPARATION; // ID 2 - В процес на приготвяне → РАБОТИ СЕ
      case 'completed': return ORDER_STATUS.READY;        // ID 3 - Приготвена → ЗАВЪРШЕНИ
      case 'delivery': return ORDER_STATUS.WITH_DRIVER;   // ID 4 - При шофьора → Delivery page
      case 'delivered': return ORDER_STATUS.DELIVERED;    // ID 6 - Доставена → Delivered
      case 'cancelled': return ORDER_STATUS.DELIVERED;    // Use DELIVERED as cancelled
      default: return ORDER_STATUS.ACCEPTED;
    }
  };

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const kitchenOrders = await getKitchenOrders();
      
      // Update orders: remove orders no longer in DB, update existing ones, add new ones
      setOrders(prevOrders => {
        const dbOrderIds = new Set(kitchenOrders.map(ko => ko.OrderID));
        const dbOrdersMap = new Map(kitchenOrders.map(ko => [ko.OrderID, ko]));
        
        // Remove orders that are no longer in the database (sent to delivery, etc.)
        const remainingOrders = prevOrders.filter(order => dbOrderIds.has(order.id));
        
        // Update existing orders with fresh data from database
        const updatedOrders = remainingOrders.map(order => {
          const dbOrder = dbOrdersMap.get(order.id);
          if (dbOrder) {
            return convertKitchenOrderToOrder(dbOrder);
          }
          return order;
        });
        
        // Add new orders that don't exist locally
        const existingOrderIds = new Set(remainingOrders.map(o => o.id));
        const newKitchenOrders = kitchenOrders.filter(ko => !existingOrderIds.has(ko.OrderID));
        const newOrders = newKitchenOrders.map(convertKitchenOrderToOrder);
        
        console.log('Refresh - Previous orders:', prevOrders.length);
        console.log('Refresh - Remaining orders:', remainingOrders.length);
        console.log('Refresh - New orders from DB:', newOrders.length);
        console.log('Refresh - Total orders after update:', updatedOrders.length + newOrders.length);
        
        return [...updatedOrders, ...newOrders];
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Refresh orders every 60 seconds
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const activeCount = orders.filter(o => o.status !== 'completed').length;
    setStats(prev => ({ ...prev, activeOrders: activeCount }));
  }, [orders]);


  // Sound library with different themes
  const soundLibrary = {
    classic: {
      new: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      },
      urgent: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.5 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      },
      complete: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.4 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      }
    },
    modern: {
      new: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      },
      urgent: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.setValueAtTime(1108, audioContext.currentTime + 0.05); // C#6
        gainNode.gain.setValueAtTime(0.4 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      },
      complete: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3); // C6
        gainNode.gain.setValueAtTime(0.4 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    },
    kitchen: {
      new: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1); // C#5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2); // E5
        gainNode.gain.setValueAtTime(0.3 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      },
      urgent: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.5 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      },
      complete: () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3); // C6
        gainNode.gain.setValueAtTime(0.4 * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    }
  };

  const playNotificationSound = (type: 'new' | 'urgent' | 'complete' = 'new') => {
    if (!soundEnabled) return;
    
    const theme = soundLibrary[soundTheme];
    if (theme && theme[type]) {
      theme[type]();
    }
  };

  // Special function for new order arrivals (2-second continuous sound)
  const playNewOrderArrivalSound = () => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Continuous 2-second sound for new order arrivals
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.5);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 1.0);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1.5);
    
    gainNode.gain.setValueAtTime(0.3 * volume, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4 * volume, audioContext.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.3 * volume, audioContext.currentTime + 1.0);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2.0);
  };

  const playSoundPreview = (type: 'new' | 'urgent' | 'complete' = 'new') => {
    playNotificationSound(type);
  };

  const addNotification = (message: string, type: 'info' | 'warning' | 'urgent' = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const getTotalTime = (orderTime: Date) => {
    const now = new Date();
    
    // Simple calculation - both dates should be in the same timezone context
    const diffMs = now.getTime() - orderTime.getTime();
    const minutes = Math.floor(diffMs / 1000 / 60);
    
    // Ensure we don't get negative values and cap at reasonable maximum
    return Math.max(0, Math.min(minutes, 9999));
  };

  // Format time for display in Bulgarian timezone
  const formatTimeForDisplay = (date: Date) => {
    return date.toLocaleString('bg-BG', {
      timeZone: 'Europe/Sofia',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getWorkingTime = (workingStartTime: Date | null) => {
    if (!workingStartTime) return 0;
    return Math.floor((new Date().getTime() - workingStartTime.getTime()) / 1000 / 60);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, showConfirm = false) => {
    const actionKey = `${orderId}-${newStatus}`;
    const now = Date.now();
    
    // Prevent rapid duplicate actions (within 2 seconds)
    if (lastActionTime[actionKey] && now - lastActionTime[actionKey] < 2000) {
      console.log(`Preventing duplicate action: ${actionKey}`);
      return;
    }
    
    setLastActionTime(prev => ({ ...prev, [actionKey]: now }));
    
    if (showConfirm) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setConfirmDialog({
          show: true,
          order,
          action: newStatus
        });
      }
      return;
    }

    try {
      const statusId = getStatusIdFromStatus(newStatus);
      const success = await updateOrderStatusInDB(orderId, statusId);
      
      if (success) {
        console.log(`Successfully updated order ${orderId} in database`);
        
        // Update local state immediately
        setOrders(prevOrders => 
          prevOrders.map(order => {
            if (order.id === orderId) {
              const updatedOrder = { ...order };
              const now = new Date();
              
              updatedOrder.status = newStatus;
              updatedOrder.orderStatusId = statusId;
              
              if (newStatus === 'working' && !updatedOrder.workingStartTime) {
                updatedOrder.workingStartTime = now;
                addNotification(`Order #${orderId} started`, 'info');
                playNotificationSound('new');
              } else if (newStatus === 'completed' && !updatedOrder.completedTime) {
                updatedOrder.completedTime = now;
                addNotification(`Order #${orderId} completed!`, 'info');
                playNotificationSound('complete');
              }
              
              return updatedOrder;
            }
            return order;
          })
        );
      } else {
        addNotification(`Failed to update order #${orderId}`, 'warning');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      addNotification(`Error updating order #${orderId}`, 'urgent');
    }
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent, orderId: number) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, orderId });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Swipe detection
    if (distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          // Swipe right - start order
          updateOrderStatus(touchStart.orderId, 'working');
        } else {
          // Swipe left - disabled to prevent duplicate completion
          console.log('Swipe left disabled to prevent duplicate completion');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          // Swipe down - return to new
          const order = orders.find(o => o.id === touchStart.orderId);
          if (order) returnOrderToNew(order);
        }
      }
    }
    
    setTouchStart(null);
  };

  const returnOrderToNew = (order: Order) => {
    setConfirmDialog({
      show: true,
      order,
      action: 'return_new'
    });
  };

  const sendToDriver = (order: Order) => {
    setConfirmDialog({
      show: true,
      order,
      action: 'send_to_driver'
    });
  };

  const handleConfirmAction = async () => {
    const { order, action } = confirmDialog;
    
    if (!order || !action) return;
    
    if (action === 'return_new') {
      try {
        // Update database first
        const statusId = getStatusIdFromStatus('new');
        const success = await updateOrderStatusInDB(order.id, statusId);
        
        if (success) {
          // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => {
          if (o.id === order.id) {
                return { 
                  ...o, 
                  status: 'new',
                  workingStartTime: null,
                  completedTime: null
                };
          }
          return o;
        })
      );
          console.log(`Successfully reverted order ${order.id} to new status in database`);
        } else {
          console.error(`Failed to revert order ${order.id} to new status in database`);
        }
      } catch (error) {
        console.error('Error reverting order to new status:', error);
      }
    } else if (action === 'working') {
      try {
        // Update database first
        const statusId = getStatusIdFromStatus('working');
        const success = await updateOrderStatusInDB(order.id, statusId);
        
        if (success) {
          // Update local state
          setOrders(prevOrders => 
            prevOrders.map(o => {
              if (o.id === order.id) {
                return { 
                  ...o, 
                  status: 'working',
                  workingStartTime: new Date(),
                  completedTime: null
                };
              }
              return o;
            })
          );
          console.log(`Successfully reverted order ${order.id} to working status in database`);
        } else {
          console.error(`Failed to revert order ${order.id} to working status in database`);
        }
      } catch (error) {
        console.error('Error reverting order to working status:', error);
      }
    } else if (action === 'send_to_driver') {
      try {
        // Update database to WITH_DRIVER status (OrderStatusID = 4)
        const success = await updateOrderStatusInDB(order.id, ORDER_STATUS.WITH_DRIVER);
        
        if (success) {
          // Remove order from local state immediately (it will appear on delivery page)
          setOrders(prevOrders => 
            prevOrders.filter(o => o.id !== order.id)
          );
          console.log(`Successfully sent order ${order.id} to driver with OrderStatusID = ${ORDER_STATUS.WITH_DRIVER}`);
          addNotification(`Order #${order.id} sent to delivery page`, 'info');
          playNotificationSound('complete');
        } else {
          console.error(`Failed to send order ${order.id} to driver in database`);
          addNotification(`Failed to send order #${order.id} to delivery page`, 'warning');
        }
      } catch (error) {
        console.error('Error sending order to driver:', error);
        addNotification(`Error sending order #${order.id} to delivery page`, 'urgent');
      }
    } else {
      updateOrderStatus(order.id, action, false);
    }
    
    setConfirmDialog({ show: false, order: null, action: null });
  };

  const getFilteredOrders = (status: string) => {
    return orders
      .filter(order => order.status === status)
      .sort((a, b) => new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime());
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('.main-work-area');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const mouseY = e.clientY - containerRect.top;
    
    const newPercentage = Math.max(30, Math.min(85, (mouseY / containerHeight) * 100));
    setNewOrdersHeight(newPercentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Vertical resizer functions
  const handleVerticalMouseDown = (e: React.MouseEvent) => {
    setIsDraggingVertical(true);
    e.preventDefault();
  };

  const handleVerticalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingVertical) return;
    
    const container = document.querySelector('.main-content-area');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    const newPercentage = Math.max(30, Math.min(80, (mouseX / containerWidth) * 100));
    setWorkAreaWidth(newPercentage);
  }, [isDraggingVertical]);

  const handleVerticalMouseUp = useCallback(() => {
    setIsDraggingVertical(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isDraggingVertical) {
      document.addEventListener('mousemove', handleVerticalMouseMove);
      document.addEventListener('mouseup', handleVerticalMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleVerticalMouseMove);
        document.removeEventListener('mouseup', handleVerticalMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDraggingVertical, handleVerticalMouseMove, handleVerticalMouseUp]);

  const NewOrderCard = ({ order }: { order: Order }) => {
    const totalTime = getTotalTime(order.orderTime);
    const isUrgent = totalTime > 10;
    
    const cardSizeClasses = {
      small: 'p-1 text-xs',        // Minimal padding
      medium: 'p-3 text-sm',       // Real medium: more padding and larger text
      large: 'p-5 text-base'       // Large: even more padding and text
    };
    
    return (
      <div 
        className={`bg-gray-800 border-2 ${isUrgent ? 'border-red-500' : 'border-blue-500'} rounded-lg transition-all duration-300 hover:bg-gray-700 animate-pulse touch-manipulation select-none ${cardSizeClasses[cardSize]}`}
        onTouchStart={(e) => handleTouchStart(e, order.id)}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xl font-bold text-white flex items-center space-x-2">
              <span>#{order.id}</span>
              <span className="text-sm text-blue-400 bg-blue-900 px-2 py-1 rounded">
                НОВА
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Получена преди: {totalTime}мин
            </div>
            <div className="text-xs text-gray-500">
              Време: {formatTimeForDisplay(order.orderTime)}
            </div>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <div className="text-blue-400 font-semibold">👤 {order.customerName}</div>
          <div className="text-gray-400 text-sm">📞 {order.phone}</div>
          <div className="text-gray-400 text-sm">📍 {order.address}</div>
        </div>

        <div className="space-y-1 mb-3">
          {order.items.map((item, index) => (
            <div key={index} className="text-sm">
              <span className="text-white font-medium">
                {item.quantity}x {item.name}
              </span>
              {item.customizations.length > 0 && (
                <div className="text-yellow-400 text-xs ml-2 mt-1">
                  🧂 {item.customizations.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="bg-yellow-900 border border-yellow-600 rounded p-2 mb-3">
            <div className="text-yellow-200 text-xs">
              📝 {order.specialInstructions}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-green-400 font-bold">
            {order.totalPrice.toFixed(2)} лв
          </span>
          <button
            onClick={() => updateOrderStatus(order.id, 'working')}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-1 px-3 rounded text-sm hover:from-orange-600 hover:to-red-600 transition-all"
          >
            🔥 Започвам
          </button>
        </div>
      </div>
    );
  };

  const WorkingOrderCard = ({ order }: { order: Order }) => {
    const totalTime = getTotalTime(order.orderTime);
    const workingTime = getWorkingTime(order.workingStartTime);
    
    const workingCardSizeClasses = {
      small: 'p-1.5 min-w-40',    // Minimal padding and width
      medium: 'p-4 min-w-72',     // Real medium: more padding and width
      large: 'p-5 min-w-96'       // Large: even more padding and width
    };
    
    return (
      <div className={`bg-orange-900 border-2 border-orange-500 rounded-lg transition-all duration-300 hover:bg-orange-800 ${workingCardSizeClasses[cardSize]}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-lg font-bold text-white flex items-center space-x-2">
              <span>#{order.id}</span>
              <span className="text-xs text-orange-200 bg-orange-700 px-2 py-1 rounded">
                РАБОТИ СЕ
              </span>
            </div>
            <div className="text-orange-200 font-semibold text-sm">{order.customerName}</div>
            <div className="text-orange-300 text-xs">📞 {order.phone}</div>
            <div className="text-orange-300 text-xs">📍 {order.address}</div>
          </div>
          <button
            onClick={() => updateOrderStatus(order.id, 'new', true)}
            className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
            title="Върни към нови поръчки"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-orange-300 mb-2">
          Общо: {totalTime}мин | Работи: {workingTime}мин
        </div>
        <div className="text-xs text-orange-400 mb-2">
          Време: {formatTimeForDisplay(order.orderTime)}
        </div>

        <div className="mb-2">
          {order.items.map((item, index) => (
            <div key={index} className="text-xs text-white">
              <div>{item.quantity}x {item.name}</div>
              {item.customizations.length > 0 && (
                <div className="text-yellow-300 text-xs ml-2 mt-1">
                  🧂 {item.customizations.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="text-xs text-yellow-300 mb-2">
            📝 {order.specialInstructions}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-green-400 font-bold text-sm">
            {order.totalPrice.toFixed(2)} лв
          </span>
          <button
            onClick={() => updateOrderStatus(order.id, 'completed', true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-1 px-2 rounded text-xs hover:from-green-600 hover:to-green-700 transition-all"
          >
            ✅ Готова
          </button>
        </div>
      </div>
    );
  };

  const HistoryOrderCard = ({ order, cardSize }: { order: Order, cardSize: 'small' | 'medium' | 'large' }) => {
    const totalTime = getTotalTime(order.orderTime);
    const workingTime = getWorkingTime(order.workingStartTime);
    
    const historyCardSizeClasses = {
      small: 'p-1.5 text-xs',     // Minimal padding
      medium: 'p-4 text-sm',      // Real medium: more padding
      large: 'p-5 text-base'      // Large: even more padding
    };
    
    const buttonSizeClasses = {
      small: 'p-2 text-sm',
      medium: 'p-4 text-lg', 
      large: 'p-6 text-xl'
    };
    
    const emojiSizeClasses = {
      small: 'text-2xl',   // 24px (40% smaller than 36px)
      medium: 'text-4xl',  // 36px (40% smaller than 60px)
      large: 'text-5xl'    // 48px (40% smaller than 72px)
    };
    
    const iconSizes = {
      small: 24,  // px
      medium: 36,
      large: 48,
    };
    
    console.log('HistoryOrderCard cardSize:', cardSize, 'emojiClass:', emojiSizeClasses[cardSize]);
    console.log('CARD SIZE DEBUG:', cardSize, 'EMOJI SIZE:', emojiSizeClasses[cardSize]);
    
    return (
      <div className={`bg-gray-700 border border-gray-600 rounded mb-2 ${historyCardSizeClasses[cardSize]}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-white font-bold">#{order.id}</div>
            <div className="text-gray-300">{order.customerName}</div>
            <div className="text-gray-400 text-xs">📞 {order.phone}</div>
            <div className="text-gray-400 text-xs">📍 {order.address}</div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => updateOrderStatus(order.id, 'working', true)}
              className={`text-orange-400 hover:text-orange-300 ${buttonSizeClasses[cardSize]} rounded-lg transition-colors hover:bg-orange-900/20`}
              title="Върни към работни поръчки"
            >
              <span className={`${emojiSizeClasses[cardSize]} text-red-500 bg-yellow-200 border-2 border-black`}>🔄</span>
            </button>
          <button
            onClick={() => returnOrderToNew(order)}
              className={`text-blue-400 hover:text-blue-300 ${buttonSizeClasses[cardSize]} rounded-lg transition-colors hover:bg-blue-900/20`}
            title="Върни към нови поръчки"
          >
            <span className={`${emojiSizeClasses[cardSize]} text-red-500`}>🔄</span>
          </button>
            <button
              onClick={() => sendToDriver(order)}
              className={`text-green-400 hover:text-green-300 ${buttonSizeClasses[cardSize]} rounded-lg transition-colors hover:bg-green-900/20`}
              title="Препрати към доставка"
            >
              <span className={`${emojiSizeClasses[cardSize]} text-green-500`}>🚗</span>
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mb-1">
          Общо време: {totalTime}мин | Работено: {workingTime}мин
        </div>
        
        <div className="text-xs text-gray-400 mb-2">
          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
        </div>
        
        <div className="text-green-400 font-bold text-xs">
          {order.totalPrice.toFixed(2)} лв
        </div>
      </div>
    );
  };

  const newOrders = getFilteredOrders('new');
  const workingOrders = getFilteredOrders('working');
  const completedOrders = getFilteredOrders('completed');

  if (loading) {
    return (
      <div className="h-screen bg-black text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍕</div>
          <div className="text-2xl font-bold text-red-500 mb-2">PIZZA STOP</div>
          <div className="text-lg text-gray-400">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white font-sans flex flex-col">
      {/* Main Header Bar */}
      <div className="h-16 bg-gray-900 border-b-2 border-red-600 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold text-red-500">🍕 PIZZA STOP</div>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="text-2xl font-mono">
            {formatTimeForDisplay(currentTime)}
          </div>
          
          <div className="flex items-center space-x-2">
            <Wifi className="text-green-500" />
            <span className="text-green-500">Online</span>
          </div>
          
          {/* Customization Controls */}
          <div className="flex items-center space-x-4">
            <select 
              value={cardSize} 
              onChange={(e) => setCardSize(e.target.value as 'small' | 'medium' | 'large')}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
            >
              <option value="small">Small Cards</option>
              <option value="medium">Medium Cards</option>
              <option value="large">Large Cards</option>
            </select>
            
            <select 
              value={soundTheme} 
              onChange={(e) => setSoundTheme(e.target.value as 'classic' | 'modern' | 'kitchen' | 'custom')}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
            >
              <option value="classic">Classic Sounds</option>
              <option value="modern">Modern Sounds</option>
              <option value="kitchen">Kitchen Sounds</option>
              <option value="custom">Custom Sounds</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16"
              />
              <span className="text-xs text-gray-400">{Math.round(volume * 100)}%</span>
            </div>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1 rounded text-sm ${soundEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            
            {/* Sound Preview Buttons */}
            {soundEnabled && (
              <div className="flex space-x-1">
                <button
                  onClick={() => playSoundPreview('new')}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  title="Preview New Order Sound"
                >
                  🆕
                </button>
                <button
                  onClick={() => playSoundPreview('urgent')}
                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  title="Preview Urgent Sound"
                >
                  ⚠️
                </button>
                <button
                  onClick={() => playSoundPreview('complete')}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  title="Preview Complete Sound"
                >
                  ✅
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden main-content-area">
        {/* Left Work Area - Resizable */}
        <div 
          className="flex flex-col main-work-area"
          style={{ width: `${workAreaWidth}%` }}
        >
          {/* New Orders Grid - Resizable */}
          <div 
            className="bg-gray-900 p-4 overflow-hidden"
            style={{ height: `${newOrdersHeight}%` }}
          >
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center">
                📋 НОВИ ПОРЪЧКИ ({newOrders.length})
              </h2>
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {newOrders.map(order => (
                    <NewOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resizable Divider */}
          <div 
            className={`h-2 bg-gray-700 border-y-2 border-orange-600 cursor-ns-resize hover:bg-orange-600 transition-colors flex items-center justify-center ${
              isDragging ? 'bg-orange-600' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="w-12 h-1 bg-gray-400 rounded"></div>
          </div>

          {/* Working Orders Strip - Resizable */}
          <div 
            className="bg-orange-950 p-4 overflow-hidden"
            style={{ height: `${100 - newOrdersHeight}%` }}
          >
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center">
                🔥 РАБОТИ СЕ ({workingOrders.length})
              </h3>
              <div className="flex-1 overflow-x-auto">
                <div className="flex space-x-4 h-full">
                  {workingOrders.map(order => (
                    <WorkingOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Resizable Divider */}
        <div 
          className={`w-2 bg-gray-700 border-x-2 border-blue-600 cursor-ew-resize hover:bg-blue-600 transition-colors flex items-center justify-center ${
            isDraggingVertical ? 'bg-blue-600' : ''
          }`}
          onMouseDown={handleVerticalMouseDown}
        >
          <div className="h-12 w-1 bg-gray-400 rounded"></div>
        </div>

        {/* Right History Panel - Resizable */}
        <div 
          className="bg-gray-800 flex flex-col"
          style={{ width: `${100 - workAreaWidth}%` }}
        >
          <div className="p-4 border-b border-gray-600">
            <h2 className="text-xl font-bold text-gray-300 flex items-center">
              📜 ЗАВЪРШЕНИ ({completedOrders.length})
            </h2>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {completedOrders.map(order => (
              <HistoryOrderCard key={order.id} order={order} cardSize={cardSize} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="h-16 bg-gray-900 border-t-2 border-red-600 flex items-center justify-around px-8 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Users className="text-blue-400" />
          <span className="text-lg">Днешни: <strong>{stats.totalOrders}</strong></span>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className="text-green-400" />
          <span className="text-lg">Средно: <strong>{stats.averageTime}мин</strong></span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="text-orange-400" />
          <span className="text-lg">Активни: <strong>{stats.activeOrders}</strong></span>
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-40 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
                notification.type === 'urgent' 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : notification.type === 'warning'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="text-white hover:text-gray-200 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Потвърждение</h3>
              <button
                onClick={() => setConfirmDialog({ show: false, order: null, action: null })}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-300 mb-6">
              {confirmDialog.action === 'return_new' 
                ? `Върни поръчка #${confirmDialog.order?.id} към нови поръчки?`
                : confirmDialog.action === 'working'
                ? `Върни поръчка #${confirmDialog.order?.id} към работни поръчки?`
                : confirmDialog.action === 'send_to_driver'
                ? `Препрати поръчка #${confirmDialog.order?.id} към доставка?`
                : `Отбележи поръчка #${confirmDialog.order?.id} като завършена?`
              }
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={handleConfirmAction}
                className="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Да, потвърждавам
              </button>
              <button
                onClick={() => setConfirmDialog({ show: false, order: null, action: null })}
                className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-700 transition-colors"
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

export default KitchenCommandCenter;
