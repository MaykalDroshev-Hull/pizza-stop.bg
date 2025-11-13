"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clock, Wifi, WifiOff, Users, TrendingUp, X, RotateCcw, Printer, Eye, RefreshCw, Settings, Scissors, LogOut } from 'lucide-react';
import { getKitchenOrders, updateOrderStatusInDB, updateOrderReadyTime, ORDER_STATUS, KitchenOrder } from '../../lib/supabase';
import { printOrderTicket, downloadOrderTicket } from '../../utils/ticketGenerator';
import PrinterConfigModal from '../../components/PrinterConfigModal';
import { useSerialPrinter } from '../../contexts/SerialPrinterContext';
import { buildDatecsFrame, DatecsCommands, toHex, parseDatecsResponse, parseStatusBytes } from '../../utils/datecsFiscalProtocol';
import { OrderData, ESCPOSCommands } from '../../utils/escposCommands';
import { webSerialPrinter } from '../../utils/webSerialPrinter';
// AdminLogin moved to separate page at /admin-kitchen-login

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  address: string;
  phone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string; // Product size (e.g., "30cm", "60cm")
    customizations: string[];
    comment?: string;
  }>;
  totalPrice: number;
  deliveryPrice: number;
  status: string;
  orderTime: Date;
  expectedTime: Date | null;
  readyTime: Date | null;
  workingStartTime: Date | null;
  completedTime: Date | null;
  estimatedTime: number;
  specialInstructions: string;
  comments: string | null;
  addressInstructions?: string | null;
  isPaid: boolean;
  orderStatusId: number;
  orderType: number; // 1 = Restaurant collection, 2 = Delivery
  paymentMethodId?: number;
}

const KitchenCommandCenter = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [printedOrderIds, setPrintedOrderIds] = useState<Set<number>>(new Set());
  
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; order: Order | null; action: string | null }>({ show: false, order: null, action: null });
  const [readyTimeModal, setReadyTimeModal] = useState<{ show: boolean; order: Order | null; selectedMinutes: number | null }>({ show: false, order: null, selectedMinutes: null });
  const [orderDetailsModal, setOrderDetailsModal] = useState<{ show: boolean; order: Order | null }>({ show: false, order: null });
  const [printerConfigModal, setPrinterConfigModal] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  // Customization settings
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('small');
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

  // Serial printer integration
  const { printOrder, defaultPrinter: webSerialDefaultPrinter, connectedPrinters } = useSerialPrinter();

  // Load printed order IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('printedOrderIds');
      if (stored) {
        const ids = JSON.parse(stored);
        setPrintedOrderIds(new Set(ids));
      }
    } catch (error) {
    }
  }, []);

  // Save printed order IDs to localStorage whenever it changes
  useEffect(() => {
    try {
      if (printedOrderIds.size > 0) {
        localStorage.setItem('printedOrderIds', JSON.stringify([...printedOrderIds]));
      }
    } catch (error) {
    }
  }, [printedOrderIds]);

  // Convert Supabase data to Order format
  const convertKitchenOrderToOrder = (kitchenOrder: KitchenOrder): Order => {
    const orderTime = new Date(kitchenOrder.OrderDT);
    const expectedTime = kitchenOrder.ExpectedDT ? new Date(kitchenOrder.ExpectedDT) : null;
    const readyTime = kitchenOrder.ReadyTime ? new Date(kitchenOrder.ReadyTime) : null;
    const status = getStatusFromId(kitchenOrder.OrderStatusID);
    
    return {
      id: kitchenOrder.OrderID,
      customerName: kitchenOrder.CustomerName,
      customerEmail: kitchenOrder.CustomerEmail,
      address: kitchenOrder.OrderLocation || kitchenOrder.CustomerLocation || '',
      phone: kitchenOrder.CustomerPhone,
      items: kitchenOrder.Products.map(product => {
        let customizations: string[] = [];
        
        // Handle CompositeProduct (50/50 pizza) customizations
        if (product.CompositeProduct) {
          // Add pizza halves information
          if (product.CompositeProduct.Parts && Array.isArray(product.CompositeProduct.Parts)) {
            product.CompositeProduct.Parts.forEach((part: any) => {
              customizations.push(`${part.Portion === 'left' ? 'Лява половина' : 'Дясна половина'}: ${part.Name}`);
            });
          }
          
          // Add composite product addons
          if (product.CompositeProduct.Addons && Array.isArray(product.CompositeProduct.Addons)) {
            product.CompositeProduct.Addons.forEach((addon: any) => {
              customizations.push(addon.Name || addon.name || addon);
            });
          }
        } else if (product.Addons) {
          // Handle regular product addons
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
        
        // Format product name for display - convert sizes based on product category
        let displayName = product.ProductName;
        let productSize = product.ProductSize;
        
        // Helper function to determine product category from name
        const getProductCategory = (name: string): 'pizza' | 'kebab' | 'other' => {
          const nameLower = name.toLowerCase();
          // Check for kebabs/doners first
          if (nameLower.includes('кебап') || nameLower.includes('дюнер') || 
              nameLower.includes('kebab') || nameLower.includes('doner')) {
            return 'kebab';
          }
          // Check for pizzas (common pizza names or the word pizza)
          if (nameLower.includes('пица') || nameLower.includes('pizza') ||
              nameLower.includes('маргарита') || nameLower.includes('капричоза') ||
              nameLower.includes('кватро') || nameLower.includes('формаджо')) {
            return 'pizza';
          }
          // Everything else (burgers, drinks, sauces, etc.)
          return 'other';
        };
        
        const category = getProductCategory(product.ProductName);
        
        if (product.CompositeProduct) {
          // For 50/50 pizzas, add "50/50" prefix and convert size for pizzas
          let sizeDisplay: string | null = null;
          
          // Convert pizza sizes: Малка -> (30), Голяма -> (60), or Small -> (30), Large -> (60)
          if (productSize && category === 'pizza') {
            const sizeLower = productSize.toLowerCase();
            if (sizeLower.includes('малка') || sizeLower.includes('small')) {
              sizeDisplay = '30';
            } else if (sizeLower.includes('голяма') || sizeLower.includes('large')) {
              sizeDisplay = '60';
            }
          }
          
          // Add "50/50" prefix before the product name
          displayName = `50/50 ${product.ProductName}${sizeDisplay ? ` (${sizeDisplay})` : ''}`;
        } else {
          // For regular products - format size based on category
          let sizeDisplay: string | null = null;
          
          if (productSize) {
            const sizeLower = productSize.toLowerCase();
            
            if (category === 'pizza') {
              // Pizzas: Convert Малка -> (30), Голяма -> (60), or Small -> (30), Large -> (60)
              if (sizeLower.includes('малка') || sizeLower.includes('small')) {
                sizeDisplay = '30';
              } else if (sizeLower.includes('голяма') || sizeLower.includes('large')) {
                sizeDisplay = '60';
              }
            } else if (category === 'kebab') {
              // Kebabs: Keep the size as-is (Small, Medium, Large)
              sizeDisplay = productSize;
            }
            // For 'other' category: Don't show size at all (sizeDisplay stays null)
          }
          
          // Build display name with size only if sizeDisplay is set
          displayName = `${product.ProductName}${sizeDisplay ? ` (${sizeDisplay})` : ''}`;
        }
        
        // Calculate correct unit price including add-ons
        // TotalPrice already includes addons and is multiplied by quantity
        const unitPriceWithAddons = product.TotalPrice / product.Quantity;
        
        return {
          name: displayName,
          quantity: product.Quantity,
          price: unitPriceWithAddons, // Price per unit including add-ons
          customizations,
          comment: product.Comment || undefined
        };
      }),
      totalPrice: kitchenOrder.TotalOrderPrice,
      deliveryPrice: kitchenOrder.DeliveryPrice,
      status,
      orderTime,
      expectedTime,
      readyTime,
      workingStartTime: status === 'working' ? new Date(orderTime.getTime() + 5 * 60 * 1000) : null,
      completedTime: status === 'completed' ? new Date(orderTime.getTime() + 15 * 60 * 1000) : null,
      estimatedTime: 15, // Default estimate
      specialInstructions: kitchenOrder.SpecialInstructions || '', // Contains user's addressInstructions
      comments: kitchenOrder.Comments, // Contains order-level comments
      addressInstructions: kitchenOrder.SpecialInstructions || null, // Same as specialInstructions for ticket generation
      isPaid: kitchenOrder.IsPaid,
      orderStatusId: kitchenOrder.OrderStatusID,
      orderType: kitchenOrder.OrderType,
      paymentMethodId: kitchenOrder.RfPaymentMethodID
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
      setIsRefreshing(true);
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
        
        
        // Auto-print new orders (only if not already printed)
        for (const newOrder of newOrders) {
          if (newOrder.status === 'new' && !printedOrderIds.has(newOrder.id)) {
            // Mark as printed immediately to prevent duplicates
            setPrintedOrderIds(prev => new Set(prev).add(newOrder.id));
            
            // Delay auto-print to ensure UI updates first
            setTimeout(() => {
              autoPrintNewOrder(newOrder);
            }, 1000);
          }
        }
        
        // Clean up old printed order IDs (keep only current order IDs)
        const currentOrderIds = new Set([...updatedOrders, ...newOrders].map(o => o.id));
        setPrintedOrderIds(prev => {
          const cleaned = new Set([...prev].filter(id => currentOrderIds.has(id)));
          return cleaned;
        });
        
        return [...updatedOrders, ...newOrders];
      });
    } catch (error) {
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastRefreshTime(new Date());
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('admin_kitchen') === 'true';
    if (!isLoggedIn) {
      // Redirect to separate login page
      window.location.href = '/admin-kitchen-login';
      return;
    }
    setIsAuthenticated(isLoggedIn);
  }, []);

  // Logout function
  const handleLogout = () => {
    // Clear authentication from session storage
    sessionStorage.removeItem('admin_kitchen');
    // Redirect to login page
    window.location.href = '/admin-kitchen-login';
  };

  useEffect(() => {
    if (isAuthenticated && !debugMode) {
      fetchOrders();
      
      // Refresh orders every 60 seconds (only if auto-refresh is enabled)
      if (autoRefreshEnabled) {
        const interval = setInterval(fetchOrders, 60000);
        return () => clearInterval(interval);
      }
    }
  }, [isAuthenticated, autoRefreshEnabled, debugMode]);

  useEffect(() => {
    // Only update time once per minute to avoid constant re-renders
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute instead of every 5 seconds
    return () => clearInterval(timer);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cleanup listeners
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);


  useEffect(() => {
    if (debugMode) return; // Stop stats updates in debug mode
    
    const activeCount = orders.filter(o => o.status !== 'completed').length;
    setStats(prev => ({ ...prev, activeOrders: activeCount }));
  }, [orders, debugMode]);


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

  // Format scheduled time for display
  const formatScheduledTime = (expectedTime: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const expectedDate = new Date(expectedTime.getFullYear(), expectedTime.getMonth(), expectedTime.getDate());
    
    const timeStr = expectedTime.toLocaleString('bg-BG', {
      timeZone: 'Europe/Sofia',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (expectedDate.getTime() === today.getTime()) {
      return `Днес в ${timeStr}`;
    } else if (expectedDate.getTime() === tomorrow.getTime()) {
      return `Утре в ${timeStr}`;
    } else {
      return expectedTime.toLocaleString('bg-BG', {
        timeZone: 'Europe/Sofia',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Helper functions for header stats
  const getOrderCounts = () => {
    const newOrders = orders.filter(o => o.orderStatusId === ORDER_STATUS.ACCEPTED);
    const workingOrders = orders.filter(o => o.orderStatusId === ORDER_STATUS.IN_PREPARATION);
    const completedOrders = orders.filter(o => o.orderStatusId === ORDER_STATUS.READY);
    return { newOrders, workingOrders, completedOrders };
  };

  const getOverdueOrders = () => {
    const now = new Date();
    return orders.filter(order => {
      if (order.readyTime) {
        return now > order.readyTime;
      }
      // If no ready time set, consider overdue after 30 minutes
      const orderAge = getTotalTime(order.orderTime);
      return orderAge > 30;
    });
  };

  const getAveragePrepTime = () => {
    const completedOrders = orders.filter(o => o.orderStatusId === ORDER_STATUS.READY && o.workingStartTime);
    if (completedOrders.length === 0) return 0;
    
    const totalTime = completedOrders.reduce((sum, order) => {
      if (order.workingStartTime) {
        const prepTime = getTotalTime(order.workingStartTime);
        return sum + prepTime;
      }
      return sum;
    }, 0);
    
    return Math.round(totalTime / completedOrders.length);
  };

  const getTodaysOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter(order => {
      const orderDate = new Date(order.orderTime);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
  };

  const formatLastRefreshTime = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}с`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}м`;
    } else {
      return `${Math.floor(diffSeconds / 3600)}ч`;
    }
  };

  const getWorkingTime = (workingStartTime: Date | null) => {
    if (!workingStartTime) return 0;
    return Math.floor((new Date().getTime() - workingStartTime.getTime()) / 1000 / 60);
  };

  const getReadyTimeRemaining = (readyTime: Date | null) => {
    if (!readyTime) return null;
    const now = new Date();
    const diffMs = readyTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes;
  };

  const formatReadyTimeRemaining = (readyTime: Date | null) => {
    const remaining = getReadyTimeRemaining(readyTime);
    if (remaining === null) return null;
    
    if (remaining <= 0) {
      return { text: 'Готова!', color: 'text-green-400' };
    } else if (remaining < 30) {
      return { text: `Готова след: ${remaining}мин`, color: 'text-red-400' };
    } else if (remaining < 60) {
      return { text: `Готова след: ${remaining}мин`, color: 'text-yellow-400' };
    } else {
      const hours = Math.floor(remaining / 60);
      const minutes = remaining % 60;
      return { 
        text: `Готова след: ${hours}ч ${minutes}мин`, 
        color: 'text-green-400' 
      };
    }
  };

  // Order Details Modal Component - Completely isolated from parent state
  const OrderDetailsModal = React.memo(({ order, onClose }: { order: Order; onClose: () => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [localScrollPosition, setLocalScrollPosition] = useState(0);

    // Only track scroll position, don't interfere with scrolling
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      setLocalScrollPosition(target.scrollTop);
    }, []);

    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
        <div
          ref={scrollRef}
          className="modal-content bg-gray-900 border border-white/12 rounded-2xl max-w-[95vw] w-full max-h-[95vh] overflow-y-auto"
          onScroll={handleScroll}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/12">
            <div>
              <h2 className="text-lg font-bold text-white">Поръчка #{order.id}</h2>
              <p className="text-sm text-gray-400">{order.customerName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Customer Info */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Информация за клиента</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Име:</span> <span className="text-white">{order.customerName}</span></div>
                <div><span className="text-gray-400">Телефон:</span> <span className="text-white">{order.phone}</span></div>
                <div><span className="text-gray-400">Имейл:</span> <span className="text-white">{order.customerEmail}</span></div>
                <div><span className="text-gray-400">Адрес:</span> <span className="text-white">{order.address}</span></div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Артикули в поръчката</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-medium">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-orange font-semibold">
                        {(item.price * item.quantity).toFixed(2)} лв.
                      </span>
                    </div>
                    
                    {item.customizations.length > 0 && (
                      <div className="text-yellow-400 text-sm mb-2">
                        🧂 Добавки: {item.customizations.join(', ')}
                      </div>
                    )}
                    
                    {item.comment && (
                      <div className="text-blue-400 text-sm bg-blue-900/30 px-2 py-1 rounded">
                        💬 Коментар: {item.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Детайли за поръчката</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Време на поръчка:</span> <span className="text-white">{order.orderTime.toLocaleString('bg-BG')}</span></div>
                {order.expectedTime && (
                  <div><span className="text-gray-400">Очаквано време:</span> <span className="text-white">{order.expectedTime.toLocaleString('bg-BG')}</span></div>
                )}
                {order.readyTime && (
                  <div><span className="text-gray-400">Готово в:</span> <span className="text-white">{order.readyTime.toLocaleString('bg-BG')}</span></div>
                )}
                <div><span className="text-gray-400">Статус:</span> <span className="text-white">{order.status}</span></div>
                <div><span className="text-gray-400">Артикули:</span> <span className="text-orange font-semibold">{order.totalPrice.toFixed(2)} лв.</span></div>
                {order.deliveryPrice > 0 && (
                  <div className="flex items-center space-x-2 bg-blue-900/40 border border-blue-500/30 rounded-lg px-3 py-2">
                    <span className="text-blue-300 text-sm">🚚</span>
                    <span className="text-blue-300 text-sm font-medium">Доставка: {order.deliveryPrice.toFixed(2)} лв.</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-gray-400">Обща сума:</span> <span className="text-green-400 font-bold text-lg">{(order.totalPrice + order.deliveryPrice).toFixed(2)} лв.</span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-yellow-200 mb-2">Специални инструкции</h3>
                <p className="text-yellow-200">{order.specialInstructions}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/12">
            <button
              onClick={onClose}
              className="w-full bg-orange text-white py-3 rounded-xl font-semibold hover:bg-orange/90 transition-colors"
            >
              Затвори
            </button>
          </div>
        </div>
      </div>
    );
  });

  const updateOrderStatus = async (orderId: number, newStatus: string, showConfirm = false) => {
    const actionKey = `${orderId}-${newStatus}`;
    const now = Date.now();
    
    // Prevent rapid duplicate actions (within 2 seconds)
    if (lastActionTime[actionKey] && now - lastActionTime[actionKey] < 2000) {
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
      addNotification(`Error updating order #${orderId}`, 'urgent');
    }
  };

  const startOrderWithReadyTime = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setReadyTimeModal({
        show: true,
        order,
        selectedMinutes: null
      });
    }
  };

  const selectReadyTime = (minutes: number) => {
    setReadyTimeModal(prev => ({
      ...prev,
      selectedMinutes: minutes
    }));
  };

  // Helper function to get payment method name for printing
  const getPaymentMethodName = (paymentMethodId: number): string => {
    // For printing: 1,3 = Card, 2,4 = Cash, 5 = Paid online
    if (paymentMethodId === 1 || paymentMethodId === 3) {
      return 'Карта';
    } else if (paymentMethodId === 2 || paymentMethodId === 4) {
      return 'В брой';
    } else if (paymentMethodId === 5) {
      return 'Платено онлайн';
    }
    return 'Неизвестен метод';
  }

  // Helper function to format pizza names with diameter for printing
  const formatPizzaNameForPrint = (itemName: string, isComposite: boolean): string => {
    // Check if it's a pizza (contains common pizza keywords or is composite/50-50)
    const nameLower = itemName.toLowerCase();
    const isPizza = isComposite || 
                    nameLower.includes('пица') || 
                    nameLower.includes('pizza') ||
                    nameLower.includes('маргарита') || 
                    nameLower.includes('капричоза') ||
                    nameLower.includes('кватро') || 
                    nameLower.includes('формаджо') ||
                    nameLower.includes('bbq') ||
                    nameLower.includes('специал');
    
    if (!isPizza) {
      return itemName; // Not a pizza, return as-is
    }

    // Check if name already has size format (30) or (60)
    if (nameLower.includes('(30)') || nameLower.includes('(60)')) {
      // Already has diameter format, just normalize it
      return itemName.replace(/\(\s*30\s*\)/gi, '(30)').replace(/\(\s*60\s*\)/gi, '(60)');
    }

    // For 50/50 pizzas, they're always large (60)
    if (isComposite || nameLower.includes('50/50')) {
      // Remove any existing size/diameter info
      let cleanName = itemName
        .replace(/\s*\(?\s*(small|large|малка|голяма|средна)\s*\)?/gi, '')
        .replace(/\s*\(?\s*\d+\s*cm\s*\)?/gi, '')
        .replace(/\s*\(?\s*\d+\s*\)?/gi, '') // Remove (30) or (60) if present
        .trim();
      
      // Add diameter
      return `${cleanName} (60)`;
    }

    // For regular pizzas, check for size indicators
    if (nameLower.includes('small') || nameLower.includes('малка')) {
      // Remove size indicator and add diameter
      let cleanName = itemName
        .replace(/\s*\(?\s*(small|малка)\s*\)?/gi, '')
        .replace(/\s*\(?\s*\d+\s*cm\s*\)?/gi, '')
        .replace(/\s*\(?\s*\d+\s*\)?/gi, '') // Remove (30) or (60) if present
        .trim();
      return `${cleanName} (30)`;
    } else if (nameLower.includes('large') || nameLower.includes('голяма')) {
      // Remove size indicator and add diameter
      let cleanName = itemName
        .replace(/\s*\(?\s*(large|голяма)\s*\)?/gi, '')
        .replace(/\s*\(?\s*\d+\s*cm\s*\)?/gi, '')
        .replace(/\s*\(?\s*\d+\s*\)?/gi, '') // Remove (30) or (60) if present
        .trim();
      return `${cleanName} (60)`;
    } else if (nameLower.includes('30cm')) {
      // Has 30cm format, convert to (30)
      let cleanName = itemName.replace(/30\s*cm/gi, '').trim();
      return `${cleanName} (30)`;
    } else if (nameLower.includes('60cm')) {
      // Has 60cm format, convert to (60)
      let cleanName = itemName.replace(/60\s*cm/gi, '').trim();
      return `${cleanName} (60)`;
    }

    // Default: if no size info found, assume it's a standard size item
    return itemName;
  }

  // Handle print order with COM port or Web Serial fallback
  const handlePrintOrder = async (order: Order) => {
    try {
      // Determine order type: 1 = Collection, 2 = Delivery
      const orderTypeText = order.orderType === 1 ? 'ВЗИМАНЕ' : 'ДОСТАВКА';
      
      // Fetch daily order number from API
      let dailyOrderNumber: number | undefined;
      try {
        const response = await fetch(`/api/order/daily-number?orderId=${order.id}`);
        if (response.ok) {
          const data = await response.json();
          dailyOrderNumber = data.dailyOrderNumber;
        }
      } catch (error) {
      }
      
      // Convert Order to OrderData format with formatted pizza names
      const orderData: OrderData = {
        orderId: order.id,
        dailyOrderNumber,
        orderType: orderTypeText,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        items: order.items.map(item => {
          // Check if item is composite (50/50) by looking at customizations or name
          const isComposite = item.name.includes('50/50') || 
                             (item.customizations && item.customizations.some(c => 
                               c.includes('Лява половина') || c.includes('Дясна половина')
                             ));
          
          // Format the name for printing (pizza names get diameter)
          const formattedName = formatPizzaNameForPrint(item.name, isComposite);
          
          return {
            name: formattedName,
            quantity: item.quantity,
            price: item.price,
            size: item.size, // Include size (e.g., "30cm", "60cm")
            addons: item.customizations,
            comment: item.comment
          };
        }),
        subtotal: order.totalPrice,
        deliveryCharge: order.deliveryPrice,
        total: order.totalPrice + order.deliveryPrice,
        paymentMethod: order.paymentMethodId ? getPaymentMethodName(order.paymentMethodId) : 'Неопределен',
        paymentMethodId: order.paymentMethodId, // Add payment method ID for status determination
        isPaid: order.isPaid,
        placedTime: order.orderTime.toLocaleString('bg-BG'),
        restaurantPhone: '068 670 070'
      };

      // Use Web Serial printer if configured
      if (webSerialDefaultPrinter && connectedPrinters.length > 0) {
        await printOrder(orderData);
        addNotification(`Поръчка #${order.id} отпечатана на Web Serial принтер`, 'info');
      } else {
        addNotification('Няма конфигуриран принтер. Моля конфигурирайте принтер от настройките.', 'warning');
        return;
      }
    } catch (error) {
      addNotification(`Грешка при печат на поръчка #${order.id}`, 'warning');
    }
  };

  // Print Cyrillic test page
  const handlePrintCyrillicTest = async () => {
    try {
      if (webSerialDefaultPrinter && connectedPrinters.length > 0) {
        const port = webSerialDefaultPrinter;
        const testData = ESCPOSCommands.generateCyrillicTestPage();
        await webSerialPrinter.print(port, testData);
        addNotification('Тестова страница с кирилски букви отпечатана', 'info');
      } else {
        addNotification('Няма конфигуриран принтер. Моля конфигурирайте принтер от настройките.', 'warning');
      }
    } catch (error) {
      addNotification('Грешка при печат на тестова страница', 'warning');
    }
  };

  // Handle cut command using proper Datecs fiscal protocol
  const handleCutPaper = async () => {
    try {
      
      if (webSerialDefaultPrinter && connectedPrinters.length > 0) {
        const port = webSerialDefaultPrinter;
        
        // According to FP-2000 manual (line 536-537):
        // "The program must advance the paper with at least two lines or the document will not be cut off correctly"
        // Step 1: Advance paper (0x2C) with 3 lines
        // Step 2: Cut paper (0x2D) with NO parameters
        
        const advanceFrame = buildDatecsFrame(DatecsCommands.ADVANCE_PAPER, [0x33, 0x2C, 0x31]); // "3,1" = 3 lines, receipt paper
        const cutFrame = buildDatecsFrame(DatecsCommands.CUT); // NO parameters for cut
        
        const writer = port.writable?.getWriter();
        if (!writer) {
          throw new Error('Не може да се запише в Web Serial принтер');
        }
        
        // Send advance paper frame
        await writer.write(advanceFrame);
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for paper advance
        
        // Send cut frame
        await writer.write(cutFrame);
        writer.releaseLock();
        
        // Read responses from printer
        const reader = port.readable?.getReader();
        if (reader) {
          try {
            // Read response for advance command
            const advanceTimeout = new Promise<Uint8Array>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout on advance')), 1000)
            );
            
            const advanceRead = (async () => {
              const { value, done } = await reader.read();
              if (done) throw new Error('Stream closed');
              return value || new Uint8Array();
            })();
            
            const advanceResponse = await Promise.race([advanceRead, advanceTimeout]);
            
            // Wait a bit before reading cut response
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Read response for cut command
            const cutTimeout = new Promise<Uint8Array>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout on cut')), 1000)
            );
            
            const cutRead = (async () => {
              const { value, done } = await reader.read();
              if (done) throw new Error('Stream closed');
              return value || new Uint8Array();
            })();
            
            const cutResponse = await Promise.race([cutRead, cutTimeout]);
            
            reader.releaseLock();
            
            // Parse cut response - should be "P" for success or "F" for blocked
            const parsed = parseDatecsResponse(cutResponse);
            if (parsed.valid && parsed.payload && parsed.payload.length > 0) {
              const result = String.fromCharCode(parsed.payload[0]);
              if (result === 'P') {
                addNotification('✅ Хартията е изрязана успешно!', 'info');
              } else if (result === 'F') {
                addNotification('⚠️ Механизмът за рязане е блокиран', 'warning');
              }
            } else {
              addNotification('✅ Команди за рязане изпратени', 'info');
            }
          } catch (readError) {
            reader.releaseLock();
            addNotification('✅ Команди изпратени (принтерът може да не върне пълен отговор)', 'info');
          }
        }
      } else {
        addNotification('Няма конфигуриран принтер. Моля конфигурирайте принтер от настройките.', 'warning');
        return;
      }
    } catch (error) {
      addNotification('Грешка при изпращане на команда за рязане', 'warning');
    }
  };

  // Browser print (like Ctrl+P) for preview
  const handleBrowserPrint = (order: Order) => {
    // Determine order type text
    const orderTypeText = order.orderType === 1 ? 'ВЗИМАНЕ' : 'ДОСТАВКА';
    
    // Format items with pizza diameter
    const formattedItems = order.items.map(item => {
      // Check if item is composite (50/50) by looking at customizations or name
      const isComposite = item.name.includes('50/50') || 
                         (item.customizations && item.customizations.some(c => 
                           c.includes('Лява половина') || c.includes('Дясна половина')
                         ));
      
      // Format the name for printing (pizza names get diameter)
      const formattedName = formatPizzaNameForPrint(item.name, isComposite);
      
      return {
        ...item,
        name: formattedName
      };
    });
    
    // Create HTML ticket
    const ticketHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Поръчка #${order.id}</title>
  <style>
    @media print {
      @page { 
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 10mm;
      }
    }
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 10mm;
      background: white;
      color: black;
      font-size: 12pt;
      line-height: 1.4;
    }
    .center {
      text-align: center;
    }
    .bold {
      font-weight: bold;
    }
    .large {
      font-size: 24pt;
    }
    .separator {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .separator-solid {
      border-top: 2px solid #000;
      margin: 8px 0;
    }
    .item {
      margin: 8px 0;
    }
    .addons {
      font-size: 10pt;
      margin-left: 15px;
      margin-top: 2px;
    }
    .comment {
      font-size: 10pt;
      margin-left: 15px;
      margin-top: 2px;
      font-style: italic;
    }
    .address {
      font-family: 'Arial', sans-serif;
      font-size: 10pt;
    }
    .no-payment {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="center large bold">${orderTypeText}</div>
  <br>
  
  <div class="center large bold">PIZZA STOP</div>
  <div class="center">www.pizza-stop.bg</div>
  <div class="center">тел: 068 670 070</div>
  <br><br>
  
  <div class="separator-solid"></div>
  
  <div class="center bold">ПОРЪЧКА #${order.id}</div>
  
  <div class="separator-solid"></div>
  
  <div>Дата/Час: ${order.orderTime.toLocaleString('bg-BG')}</div>
  
  <div class="separator"></div>
  
  <div class="bold">КЛИЕНТ:</div>
  <div>Име: ${order.customerName}</div>
  <div>Тел: ${order.phone}</div>
  <div class="address">Адрес: ${order.address}</div>
  ${order.comments ? `<div>Коментар: ${order.comments}</div>` : ''}
  
  <div class="separator-solid"></div>
  
  <div class="bold">АРТИКУЛИ:</div>
  <div class="separator"></div>
  
  ${formattedItems.map(item => `
    <div class="item">
      <div>${item.quantity}x ${item.name}</div>
      ${item.customizations.length > 0 ? `<div class="addons">+ ${item.customizations.join(', ')}</div>` : ''}
      ${item.comment ? `<div class="comment">Забележка: ${item.comment}</div>` : ''}
    </div>
  `).join('')}
  
  <div class="separator-solid"></div>
  
  ${order.specialInstructions ? `
    <div class="bold">СПЕЦИАЛНИ ИНСТРУКЦИИ:</div>
    <div>${order.specialInstructions}</div>
    <br>
  ` : ''}
  
  <div class="no-payment">НЕ СЕ ИЗИСКВА ПЛАЩАНЕ</div>
  
  <div class="separator-solid"></div>
  <br><br>
  
  <div class="center">Благодарим Ви!</div>
  <div class="center">Приятен апетит!</div>
  
</body>
</html>
    `;
    
    // Open in new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ticketHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Auto-print new orders
  const autoPrintNewOrder = async (order: Order) => {
    try {
      // Determine order type: 1 = Collection, 2 = Delivery
      const orderTypeText = order.orderType === 1 ? 'ВЗИМАНЕ' : 'ДОСТАВКА';
      
      // Fetch daily order number from API
      let dailyOrderNumber: number | undefined;
      try {
        const response = await fetch(`/api/order/daily-number?orderId=${order.id}`);
        if (response.ok) {
          const data = await response.json();
          dailyOrderNumber = data.dailyOrderNumber;
        }
      } catch (error) {
      }
      
      // Convert Order to OrderData format for COM port printer with formatted pizza names
      const orderData: OrderData = {
        orderId: order.id,
        dailyOrderNumber,
        orderType: orderTypeText,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        items: order.items.map(item => {
          // Check if item is composite (50/50) by looking at customizations or name
          const isComposite = item.name.includes('50/50') || 
                             (item.customizations && item.customizations.some(c => 
                               c.includes('Лява половина') || c.includes('Дясна половина')
                             ));
          
          // Format the name for printing (pizza names get diameter)
          const formattedName = formatPizzaNameForPrint(item.name, isComposite);
          
          return {
            name: formattedName,
            quantity: item.quantity,
            price: item.price,
            size: item.size, // Include size (e.g., "30cm", "60cm")
            addons: item.customizations,
            comment: item.comment
          };
        }),
        subtotal: order.totalPrice,
        deliveryCharge: order.deliveryPrice,
        total: order.totalPrice + order.deliveryPrice,
        paymentMethod: order.paymentMethodId ? getPaymentMethodName(order.paymentMethodId) : 'Неопределен',
        paymentMethodId: order.paymentMethodId, // Add payment method ID for status determination
        isPaid: order.isPaid,
        placedTime: order.orderTime.toLocaleString('bg-BG'),
        restaurantPhone: '068 670 070'
      };

      // Use Web Serial printer if configured
      if (webSerialDefaultPrinter && connectedPrinters.length > 0) {
        await printOrder(orderData);
      } else {
      }
    } catch (error) {
    }
  };

  const confirmReadyTime = async () => {
    if (!readyTimeModal.order || !readyTimeModal.selectedMinutes) return;
    
    const orderId = readyTimeModal.order.id;
    const minutes = readyTimeModal.selectedMinutes;
    const order = readyTimeModal.order;
    
    // Close modal immediately for instant feedback
    setReadyTimeModal({ show: false, order: null, selectedMinutes: null });
    
    // Calculate ready time
    const readyTime = new Date();
    readyTime.setMinutes(readyTime.getMinutes() + minutes);
    
    // Update local state immediately (optimistic UI)
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          return { 
            ...order, 
            status: 'working',
            readyTime: readyTime,
            workingStartTime: new Date(),
            orderStatusId: getStatusIdFromStatus('working')
          };
        }
        return order;
      })
    );
    
    // Show immediate success notification
    addNotification(`Поръчка #${orderId} започна приготвяне и ще е готова след ${minutes} минути`, 'info');
    playNotificationSound('new');
    
    // Process database updates and email in background
    setTimeout(async () => {
      try {
        // Update ready time in database
        const success = await updateOrderReadyTime(orderId, readyTime);
        
        if (success) {
          // Update order status to working
          const statusId = getStatusIdFromStatus('working');
          await updateOrderStatusInDB(orderId, statusId);
          
          // Send email notification in background
          try {
            const emailResponse = await fetch('/api/send-ready-time-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: order.customerEmail,
                name: order.customerName,
                orderId: orderId.toString(),
                readyTimeMinutes: minutes,
                orderDetails: {
                  items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    addons: item.customizations.map(custom => ({ name: custom, price: 0 })),
                    comment: ''
                  })),
                  totalAmount: order.totalPrice,
                  orderTime: order.orderTime.toLocaleString('bg-BG'),
                  orderType: order.address.includes('Lovech Center') ? 'Вземане от ресторанта' : 'Доставка',
                  paymentMethod: getPaymentMethodName(1), // Default to method 1, could be improved
                  location: order.address
                }
              })
            });

            if (emailResponse.ok) {
            } else {
              throw new Error('Email API returned error');
            }
          } catch (emailError) {
            addNotification(`Email failed for order #${orderId} (order processed successfully)`, 'warning');
          }
        } else {
          // If database update fails, revert the optimistic update
          setOrders(prevOrders => 
            prevOrders.map(order => {
              if (order.id === orderId) {
                return { 
                  ...order, 
                  status: 'new',
                  readyTime: null,
                  workingStartTime: null,
                  orderStatusId: getStatusIdFromStatus('new')
                };
              }
              return order;
            })
          );
          addNotification(`Failed to start order #${orderId}`, 'urgent');
        }
      } catch (error) {
        // Revert optimistic update on error
        setOrders(prevOrders => 
          prevOrders.map(order => {
            if (order.id === orderId) {
              return { 
                ...order, 
                status: 'new',
                readyTime: null,
                workingStartTime: null,
                orderStatusId: getStatusIdFromStatus('new')
              };
            }
            return order;
          })
        );
        addNotification(`Error setting ready time for order #${orderId}`, 'urgent');
      }
    }, 100); // Small delay to ensure UI updates first
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

  const markPickupAsTaken = (order: Order) => {
    setConfirmDialog({
      show: true,
      order,
      action: 'mark_pickup_taken'
    });
  };

  const bulkSendToDriver = async (orders: Order[]) => {
    try {
      // Send all orders to driver without individual confirmations
      const promises = orders.map(async (order) => {
        const statusId = getStatusIdFromStatus('delivery');
        return await updateOrderStatusInDB(order.id, statusId);
      });
      
      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        // Refresh orders to reflect changes
        await fetchOrders();
        addNotification(`Изпратени ${successCount} поръчки към доставката`, 'info');
      } else {
        addNotification('Грешка при изпращане на поръчките', 'warning');
      }
    } catch (error) {
      addNotification('Грешка при изпращане на поръчките', 'urgent');
    }
  };

  const handleConfirmAction = async () => {
    const { order, action } = confirmDialog;
    
    if (!order || !action) return;
    
    if (action === 'return_new') {
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
      }
    } else if (action === 'working') {
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
          addNotification(`Поръчка #${order.id} препратена към шофьора`, 'info');
          playNotificationSound('complete');
        } else {
          addNotification(`Failed to send order #${order.id} to delivery page`, 'warning');
        }
      } catch (error) {
        addNotification(`Error sending order #${order.id} to delivery page`, 'urgent');
      }
    } else if (action === 'mark_pickup_taken') {
      try {
        // Update database to DELIVERED status (OrderStatusID = 6) for pickup orders
        const success = await updateOrderStatusInDB(order.id, ORDER_STATUS.DELIVERED);
        
        if (success) {
          // Remove order from local state immediately (it will appear in history)
          setOrders(prevOrders =>
            prevOrders.filter(o => o.id !== order.id)
          );
          addNotification(`Поръчка #${order.id} маркирана като взета`, 'info');
          playNotificationSound('complete');
        } else {
          addNotification(`Failed to mark order #${order.id} as taken`, 'warning');
        }
      } catch (error) {
        addNotification(`Error marking order #${order.id} as taken`, 'urgent');
      }
    } else if (action === 'completed') {
      try {
        // Update database to READY status (OrderStatusID = 3)
        const statusId = getStatusIdFromStatus('completed');
        const success = await updateOrderStatusInDB(order.id, statusId);
        
        if (success) {
          // Update local state
          setOrders(prevOrders =>
            prevOrders.map(o => {
              if (o.id === order.id) {
                return {
                  ...o,
                  status: 'completed',
                  completedTime: new Date()
                };
              }
              return o;
            })
          );
          addNotification(`Поръчка #${order.id} завършена!`, 'info');
          playNotificationSound('complete');
        } else {
          addNotification(`Failed to complete order #${order.id}`, 'warning');
        }
      } catch (error) {
        addNotification(`Error completing order #${order.id}`, 'urgent');
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


  const NewOrderCard = ({ order }: { order: Order }) => {
    const totalTime = getTotalTime(order.orderTime);
    const isUrgent = totalTime > 10;
    
    const cardSizeClasses = {
      small: 'p-2 text-sm',        // Optimized for 1024x768 - no responsive scaling
      medium: 'p-3 text-base',       // Larger text for touchscreen readability
      large: 'p-4 text-lg'       // Even larger for maximum readability
    };
    
    return (
      <div
        className={`bg-gray-800 border-2 ${isUrgent ? 'border-red-500' : 'border-blue-500'} rounded-lg transition-all duration-300 hover:bg-gray-700 touch-manipulation select-none ${cardSizeClasses[cardSize]} min-h-[88px] cursor-pointer`}
        onTouchStart={(e) => handleTouchStart(e, order.id)}
        onTouchEnd={handleTouchEnd}
        onClick={() => setOrderDetailsModal({ show: true, order })}
      >
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>#{order.id}</span>
              <span className="text-[10px] text-blue-400 bg-blue-900 px-1 py-0.5 rounded truncate">
                НОВА
              </span>
            </div>
            <div className="text-[10px] text-gray-400">
              Получена преди: {totalTime}мин
            </div>
            <div className="text-[9px] text-gray-500 hidden sm:block">
              Време: {formatTimeForDisplay(order.orderTime)}
            </div>
          </div>
        </div>

        <div className="space-y-0.5 mb-1.5">
          <div className="text-blue-400 font-semibold text-xs truncate">👤 {order.customerName}</div>
          <div className="text-gray-400 text-xs sm:text-sm">📞 {order.phone}</div>
          <div className="text-gray-400 text-xs sm:text-sm truncate">📍 {order.address}</div>
          {order.comments && (
            <div className="ml-5 text-xs text-gray-400 italic">
              {order.comments}
            </div>
          )}
          {order.expectedTime && (
            <div className="text-green-400 text-xs sm:text-sm font-medium">
              📅 Поръчана за: {formatScheduledTime(order.expectedTime)}
            </div>
          )}
        </div>

        <div className="space-y-0.5 mb-1.5">
          {order.items.slice(0, 3).map((item, index) => (
            <div key={index} className="text-xs">
              <span className="text-white font-medium">
                {item.quantity}x {item.name}
              </span>
              {item.customizations.length > 0 && (
                <div className="text-yellow-400 text-[10px] ml-1 mt-0.5">
                  🧂 {item.customizations.join(', ')}
                </div>
              )}
              {item.comment && (
                <div className="text-blue-400 text-[10px] ml-1 mt-0.5 bg-blue-900/30 px-1 py-0.5 rounded">
                  💬 {item.comment}
                </div>
              )}
            </div>
          ))}
          {order.items.length > 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOrderDetailsModal({ show: true, order });
              }}
              className="flex items-center justify-center space-x-1 text-blue-400 hover:text-blue-300 text-xs mt-2 px-2 py-1.5 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 transition-colors min-w-[40px] min-h-[40px] touch-manipulation"
            >
              <Eye size={14} />
              <span>Покажи всички ({order.items.length})</span>
            </button>
          )}
        </div>

        {order.specialInstructions && (
          <div className="bg-yellow-900 border border-yellow-600 rounded p-1 mb-1.5">
            <div className="text-yellow-200 text-[10px]">
              📝 {order.specialInstructions}
            </div>
          </div>
        )}

        {order.deliveryPrice > 0 && (
          <div className="flex items-center space-x-1 bg-blue-900/40 border border-blue-500/30 rounded px-1 py-0.5 mb-1">
            <span className="text-blue-300 text-[10px]">🚚</span>
            <span className="text-blue-300 text-[10px] font-medium">
              Доставка: {order.deliveryPrice.toFixed(2)} лв
            </span>
          </div>
        )}

          <div className="flex justify-between items-center">
          <span className="text-green-400 font-bold text-xs">
            Общо: {(order.totalPrice + order.deliveryPrice).toFixed(2)} лв
          </span>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startOrderWithReadyTime(order.id);
              }}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-1.5 px-2 rounded-lg text-xs hover:from-orange-600 hover:to-red-600 transition-all min-w-[40px] min-h-[40px] touch-manipulation flex items-center justify-center"
            >
              🔥 Започвам
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintOrder(order);
              }}
                className="bg-gray-600 text-white font-bold py-1 px-1.5 rounded-lg text-xs hover:bg-gray-700 transition-all flex items-center justify-center min-w-[40px] min-h-[40px] touch-manipulation"
              title="Принтирай на термален принтер"
            >
                <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBrowserPrint(order);
              }}
                className="bg-blue-600 text-white font-bold py-1 px-1.5 rounded-lg text-xs hover:bg-blue-700 transition-all min-w-[40px] min-h-[40px] touch-manipulation"
              title="Преглед за печат (Ctrl+P)"
            >
              👁️
            </button>
          </div>
        </div>
      </div>
    );
  };

  const WorkingOrderCard = ({ order }: { order: Order }) => {
    const totalTime = getTotalTime(order.orderTime);
    const workingTime = getWorkingTime(order.workingStartTime);
    
    const workingCardSizeClasses = {
      small: 'p-2 text-sm',        // Optimized for 1024x768 - no responsive scaling
      medium: 'p-3 text-base',       // Larger text for touchscreen readability
      large: 'p-4 text-lg'       // Even larger for maximum readability
    };
    
    return (
      <div className={`bg-orange-900 border-2 border-orange-500 rounded-lg transition-all duration-300 hover:bg-orange-800 ${workingCardSizeClasses[cardSize]} min-h-[88px] cursor-pointer touch-manipulation select-none`}
        onClick={() => setOrderDetailsModal({ show: true, order })}
        onTouchStart={(e) => handleTouchStart(e, order.id)}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-wrap justify-between items-start mb-2">
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
            {order.comments && (
              <div className="ml-5 text-xs text-gray-400 italic">
                {order.comments}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateOrderStatus(order.id, 'new', true);
            }}
            className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors min-w-[40px] min-h-[40px] touch-manipulation flex items-center justify-center"
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
        {order.readyTime && (
          <div className={`text-xs font-bold mb-2 ${formatReadyTimeRemaining(order.readyTime)?.color}`}>
            ⏰ {formatReadyTimeRemaining(order.readyTime)?.text}
          </div>
        )}

        <div className="mb-2">
          {order.items.slice(0, 3).map((item, index) => (
            <div key={index} className="text-xs text-white">
              <div>{item.quantity}x {item.name}</div>
              {item.customizations.length > 0 && (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOrderDetailsModal({ show: true, order });
              }}
              className="flex items-center justify-center space-x-1 text-orange-400 hover:text-orange-300 text-xs mt-2 px-2 py-1.5 rounded-lg bg-orange-800/20 hover:bg-orange-800/40 transition-colors min-w-[40px] min-h-[40px] touch-manipulation"
            >
              <Eye size={14} />
              <span>Покажи всички ({order.items.length})</span>
            </button>
          )}
        </div>

        {order.specialInstructions && (
          <div className="text-xs text-yellow-300 mb-2">
            📝 {order.specialInstructions}
          </div>
        )}

        {order.deliveryPrice > 0 && (
          <div className="flex items-center space-x-2 bg-blue-900/40 border border-blue-500/30 rounded-lg px-2 py-1 mb-2">
            <span className="text-blue-300 text-xs">🚚</span>
            <span className="text-blue-300 text-xs font-medium">
              Доставка: {order.deliveryPrice.toFixed(2)} лв
            </span>
          </div>
        )}

          <div className="flex justify-between items-center">
          <span className="text-green-400 font-bold text-sm">
            Общо: {(order.totalPrice + order.deliveryPrice).toFixed(2)} лв
          </span>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintOrder(order);
              }}
                className="bg-gray-600 text-white font-bold py-1 px-1.5 rounded-lg text-xs hover:bg-gray-700 transition-all min-w-[40px] min-h-[40px] touch-manipulation flex items-center justify-center"
              title="Принтирай на термален принтер"
            >
                <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBrowserPrint(order);
              }}
                className="bg-blue-600 text-white font-bold py-1 px-1.5 rounded-lg text-xs hover:bg-blue-700 transition-all min-w-[40px] min-h-[40px] touch-manipulation"
              title="Преглед за печат (Ctrl+P)"
            >
              👁️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order.id, 'completed', true);
              }}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-1.5 px-2 rounded-lg text-xs hover:from-green-600 hover:to-green-700 transition-all min-w-[40px] min-h-[40px] touch-manipulation"
            >
              ✅ Готова
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HistoryOrderCard = ({ order, cardSize }: { order: Order, cardSize: 'small' | 'medium' | 'large' }) => {
    const totalTime = getTotalTime(order.orderTime);
    const workingTime = getWorkingTime(order.workingStartTime);
    
    const historyCardSizeClasses = {
      small: 'p-1 text-sm',     // Optimized for 1024x768
      medium: 'p-3 text-base',      // Larger text for touchscreen readability
      large: 'p-4 text-lg'      // Even larger for maximum readability
    };
    
    const buttonSizeClasses = {
      small: 'p-1.5 text-sm min-w-[40px] min-h-[40px]',
      medium: 'p-2 text-base min-w-[44px] min-h-[44px]',
      large: 'p-3 text-lg min-w-[48px] min-h-[48px]'
    };
    
    const emojiSizeClasses = {
      small: 'text-lg',
      medium: 'text-2xl',
      large: 'text-4xl'
    };
    
    const iconSizes = {
      small: 24,  // px
      medium: 36,
      large: 48,
    };
    
    return (
      <div className={`bg-gray-700 border border-gray-600 rounded mb-2 ${historyCardSizeClasses[cardSize]}`}>
        <div className="flex flex-wrap justify-between items-start mb-2">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintOrder(order);
              }}
              className={`bg-purple-500 hover:bg-purple-600 text-white ${buttonSizeClasses[cardSize]} rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center`}
              title="Принтирай на термален принтер"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBrowserPrint(order);
              }}
              className={`bg-blue-500 hover:bg-blue-600 text-white ${buttonSizeClasses[cardSize]} rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center`}
              title="Преглед за печат (Ctrl+P)"
            >
              <span className={`${emojiSizeClasses[cardSize]}`}>👁️</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order.id, 'working', true);
              }}
              className={`bg-orange-500 hover:bg-orange-600 text-white ${buttonSizeClasses[cardSize]} rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center`}
              title="Върни към работни поръчки"
            >
              <span className={`${emojiSizeClasses[cardSize]}`}>▶️</span>
            </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              returnOrderToNew(order);
            }}
              className={`bg-blue-500 hover:bg-blue-600 text-white ${buttonSizeClasses[cardSize]} rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center`}
            title="Върни към нови поръчки"
          >
              <span className={`${emojiSizeClasses[cardSize]}`}>🔄</span>
          </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                order.orderType === 1 ? markPickupAsTaken(order) : sendToDriver(order);
              }}
              className={`bg-gray-500 hover:bg-gray-600 text-white ${buttonSizeClasses[cardSize]} rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center`}
              title={order.orderType === 1 ? "Маркирай като взета" : "Препрати към доставка"}
            >
              <span className={`${emojiSizeClasses[cardSize]}`}>{order.orderType === 1 ? "✅" : "🚚"}</span>
            </button>
          </div>
          <div>
            <div className="text-white font-bold">#{order.id}</div>
            <div className="text-gray-300">{order.customerName}</div>
            <div className="text-gray-400 text-xs">📞 {order.phone}</div>
            <div className="text-gray-400 text-xs">📍 {order.address}</div>
            {order.comments && (
              <div className="ml-5 text-xs text-gray-400 italic">
                {order.comments}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mb-1">
          Общо време: {totalTime}мин | Работено: {workingTime}мин
        </div>
        <div className="text-xs text-gray-400 mb-2">
          Време: {formatTimeForDisplay(order.orderTime)}
        </div>

        <div className="mb-2">
          {order.items.slice(0, 3).map((item, index) => (
            <div key={index} className="text-xs text-white">
              <div>{item.quantity}x {item.name}</div>
              {item.customizations.length > 0 && (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOrderDetailsModal({ show: true, order });
              }}
              className="flex items-center space-x-1 text-gray-400 hover:text-gray-300 text-xs mt-2 transition-colors"
            >
              <Eye size={12} />
              <span>+{order.items.length - 3} още</span>
            </button>
          )}
        </div>

        {order.specialInstructions && (
          <div className="text-xs text-yellow-300 mb-2">
            📝 {order.specialInstructions}
          </div>
        )}
        
        {order.deliveryPrice > 0 && (
          <div className="flex items-center space-x-2 bg-blue-900/40 border border-blue-500/30 rounded-lg px-2 py-1 mb-2">
            <span className="text-blue-300 text-xs">🚚</span>
            <span className="text-blue-300 text-xs font-medium">
              Доставка: {order.deliveryPrice.toFixed(2)} лв
            </span>
          </div>
        )}
        
        <div className="text-green-400 font-bold text-xs">
          Общо: {(order.totalPrice + order.deliveryPrice).toFixed(2)} лв
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

  const newOrders = getFilteredOrders('new');
  const workingOrders = getFilteredOrders('working');
  const completedOrders = getFilteredOrders('completed');
  const combinedOrders = [...newOrders, ...workingOrders, ...completedOrders];

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
      {/* Enhanced Header Bar - Optimized for 1024x768 */}
      <div className="bg-gray-900 border-b-2 border-red-600 flex-shrink-0">
        {/* Top Row - Logo, Time, Network, Sound */}
        <div className="h-12 flex items-center justify-center px-1 relative">
          {/* Left group: Counters + Logo */}
          <div className="absolute left-1 flex items-center space-x-2">
            {(() => {
              const { newOrders, workingOrders, completedOrders } = getOrderCounts();
              return (
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold min-w-[60px] text-center touch-manipulation">
                    Нов: {newOrders.length}
                  </span>
                  <span className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-bold min-w-[60px] text-center touch-manipulation">
                    Работи: {workingOrders.length}
                  </span>
                  <span className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold min-w-[60px] text-center touch-manipulation">
                    Готов: {completedOrders.length}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Centered Logo */}
          <div className="flex items-center space-x-1">
            <img
              src="https://ktxdniqhrgjebmabudoc.supabase.co/storage/v1/object/sign/pizza-stop-bucket/pizza-stop-logo/428599730_7269873796441978_7859610568299247248_n-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80ODQ2MWExYi0yOTZiLTQ4MDEtYjRiNy01ZGYwNzc1ZjYyZjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwaXp6YS1zdG9wLWJ1Y2tldC9waXp6YS1zdG9wLWxvZ28vNDI4NTk5NzMwXzcyNjk4NzM3OTY0NDE5NzhfNzg1OTYxMDU2ODI5OTI0NzI0OF9uLXJlbW92ZWJnLXByZXZpZXcucG5nIiwiaWF0IjoxNzU4NzE1NjI1LCJleHAiOjI3MTg3MDYwMjV9.PEJqf8J-Su8iIHobLQ3CZrmq1XnYiT2lRbnqwyiX1jE"
              alt="Pizza Stop Logo"
              className="h-8 w-auto"
            />
            <div className="text-lg font-bold text-red-500">PIZZA STOP</div>
          </div>

          {/* Right side info */}
          <div className="absolute right-1 flex items-center space-x-1">
            {/* Cut Button - Datecs Protocol */}
            <button
              onClick={handleCutPaper}
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center space-x-1 min-w-[60px] min-h-[44px] touch-manipulation"
              title="Рязвай хартия (Datecs 0x2D)"
            >
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">РЕЖИ</span>
            </button>

            {/* Cyrillic Test Button */}
            <button
              onClick={handlePrintCyrillicTest}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors flex items-center space-x-1 min-w-[60px] min-h-[44px] touch-manipulation"
              title="Принтирай тестова страница с кирилски букви и кодове"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">КИРИЛ</span>
            </button>

            <div className="text-lg font-mono">
              {formatTimeForDisplay(currentTime)}
              {debugMode && (
                <span className="ml-1 text-red-500 text-xs font-bold">🐛</span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="text-green-500 w-4 h-4" />
              ) : (
                <WifiOff className="text-red-500 w-4 h-4" />
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2 py-2 rounded-lg text-sm min-w-[44px] min-h-[44px] touch-manipulation ${soundEnabled ? 'bg-green-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}
              title={soundEnabled ? 'Звук включен' : 'Звук изключен'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchOrders()}
              disabled={isRefreshing}
              className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation ${
                isRefreshing
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title="Обнови поръчките"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            {/* Printer Configuration and Logout Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPrinterConfigModal(true)}
                className="px-2 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation"
                title="Конфигурирай принтер"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-2 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation"
                title="Излез"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Printer Status Indicator */}
              {webSerialDefaultPrinter && connectedPrinters.length > 0 ? (
                <div className="flex items-center justify-center bg-blue-600 text-white px-2 py-1 rounded-lg text-xs min-w-[44px] min-h-[32px]">
                  <Printer className="w-3 h-3" />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-600 text-white px-2 py-1 rounded-lg text-xs min-w-[44px] min-h-[32px]">
                  <Printer className="w-3 h-3" />
                </div>
              )}
            </div>

                     </div>
        </div>

        {/* Second Row removed to save vertical space */}

      </div>

      {/* Unified Orders List - compact for 1024x768 */}
      <div className="flex-1 bg-gray-900 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-3-kitchen gap-2">
              {combinedOrders.map(order => (
                order.status === 'new' ? (
                  <NewOrderCard key={order.id} order={order} />
                ) : order.status === 'working' ? (
                  <WorkingOrderCard key={order.id} order={order} />
                ) : (
                  <HistoryOrderCard key={order.id} order={order} cardSize={cardSize} />
                )
              ))}
            </div>
          </div>
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

      {/* Ready Time Modal */}
      {readyTimeModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Кога ще е готова поръчката?</h3>
              <button
                onClick={() => setReadyTimeModal({ show: false, order: null, selectedMinutes: null })}
                className="text-gray-400 hover:text-white min-w-[44px] min-h-[44px] touch-manipulation flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">
              Поръчка #{readyTimeModal.order?.id} - {readyTimeModal.order?.customerName}
            </p>
            
            {readyTimeModal.selectedMinutes && (
              <div className="bg-green-900 border border-green-600 rounded p-3 mb-4">
                <p className="text-green-200 text-center font-bold">
                  Избрано време: {readyTimeModal.selectedMinutes < 60 
                    ? `${readyTimeModal.selectedMinutes} мин` 
                    : `${Math.floor(readyTimeModal.selectedMinutes / 60)}ч ${readyTimeModal.selectedMinutes % 60}мин`
                  }
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => selectReadyTime(15)}
                className={`font-bold py-4 px-4 rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes === 15
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                15 мин
              </button>
              <button
                onClick={() => selectReadyTime(30)}
                className={`font-bold py-4 px-4 rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes === 30
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                30 мин
              </button>
              <button
                onClick={() => selectReadyTime(45)}
                className={`font-bold py-4 px-4 rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes === 45
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                45 мин
              </button>
              <button
                onClick={() => selectReadyTime(60)}
                className={`font-bold py-4 px-4 rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes === 60
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                1 час
              </button>
              <button
                onClick={() => selectReadyTime(90)}
                className={`font-bold py-4 px-4 rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes === 90
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                1.5 часа
              </button>
              <button
                onClick={() => selectReadyTime(120)}
                className={`font-bold py-4 px-4 rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes === 120
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                2 часа
              </button>
              <button
                onClick={() => selectReadyTime(180)}
                className={`font-bold py-4 px-4 rounded-lg transition-colors col-span-2 min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes === 180
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                3 часа
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmReadyTime}
                disabled={!readyTimeModal.selectedMinutes}
                className={`flex-1 font-bold py-4 px-4 rounded-lg transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base ${
                  readyTimeModal.selectedMinutes
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Потвърди
              </button>
              <button
                onClick={() => setReadyTimeModal({ show: false, order: null, selectedMinutes: null })}
                className="flex-1 bg-gray-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] touch-manipulation text-base"
              >
                Отказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {orderDetailsModal.show && orderDetailsModal.order && (
        <OrderDetailsModal 
          key={`modal-${orderDetailsModal.order.id}`}
          order={orderDetailsModal.order} 
          onClose={() => setOrderDetailsModal({ show: false, order: null })} 
        />
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
                : confirmDialog.action === 'mark_pickup_taken'
                ? `Маркирай поръчка #${confirmDialog.order?.id} като взета?`
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

      {/* Printer Configuration Modal */}
      <PrinterConfigModal
        isOpen={printerConfigModal}
        onClose={() => setPrinterConfigModal(false)}
        onConfigSaved={() => {
          setPrinterConfigModal(false);
          addNotification('Принтерът е конфигуриран успешно!', 'info');
        }}
      />
    </div>
  );
};

export default KitchenCommandCenter;
