"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft, Mail, Lock, AlertCircle, Eye, EyeOff, LogOut } from "lucide-react";
import { fetchMenuData, fetchAddons } from "@/lib/menuData";
import styles from '../../styles/admin-login.module.css';

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  categoryId: string;
  sizes?: Array<{
    name: string;
    price: number;
    multiplier: number;
    weight?: number | null;
  }>;
  isNoAddOns?: boolean;
}

interface ProductModalData {
  product: Product;
  quantity: number;
  comment: string;
  addons: any[];
  selectedSize: any;
  selectedPrice: number;
  availableAddons: any[];
  isLoadingAddons: boolean;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  orderType: number; // 1 = Collection, 2 = Delivery (1.5 EUR yellow / 3.5 EUR blue)
  deliveryPrice: number;
}

export default function PrinterPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState("login");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "Взимане от ресторант", // Default address for pickup
    orderType: 1, // Default to Pickup (free)
    deliveryPrice: 0
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalData, setProductModalData] = useState<ProductModalData | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [menuData, setMenuData] = useState<{ [key: string]: any[] }>({});

  // Address autocomplete
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Customer search
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 50/50 Pizza state
  const [fiftyFiftySelection, setFiftyFiftySelection] = useState<{
    size: string | null;
    leftHalf: any | null;
    rightHalf: any | null;
    finalPrice: number;
    selectedAddons: any[];
    step: number;
  }>({
    size: null,
    leftHalf: null,
    rightHalf: null,
    finalPrice: 0,
    selectedAddons: [],
    step: 1 // 1: size, 2: left half, 3: right half, 4: addons
  });

  // 50/50 Pizza addons state
  const [fiftyFiftyAddons, setFiftyFiftyAddons] = useState<any[]>([]);
  const [isLoadingFiftyFiftyAddons, setIsLoadingFiftyFiftyAddons] = useState(false);

  // 50/50 Pizza helper functions
  const getPriceForSize = (pizza: any, sizeName: string | null) => {
    if (!pizza || !sizeName) return 0
    
    switch (sizeName) {
      case 'Малка':
        return pizza.smallPrice || 0
      case 'Средна':
        return pizza.mediumPrice || 0
      case 'Голяма':
        return pizza.largePrice || 0
      default:
        return pizza.smallPrice || 0
    }
  }

  const calculateFiftyFiftyPrice = (leftPizza: any, rightPizza: any, sizeName: string | null) => {
    if (!leftPizza || !rightPizza || !sizeName) return 0
    
    const leftPrice = getPriceForSize(leftPizza, sizeName)
    const rightPrice = getPriceForSize(rightPizza, sizeName)
    return Math.max(leftPrice, rightPrice)
  }

  const resetFiftyFiftySelection = () => {
    setFiftyFiftySelection({
      size: null,
      leftHalf: null,
      rightHalf: null,
      finalPrice: 0,
      selectedAddons: [],
      step: 1
    })
  }

  const addFiftyFiftyToCart = () => {
    if (!fiftyFiftySelection.leftHalf || !fiftyFiftySelection.rightHalf || !fiftyFiftySelection.size) {
      return
    }

    // Calculate addon cost (all addons are paid)
    const addonCost = (fiftyFiftySelection.selectedAddons || [])
      .reduce((sum: number, addon: any) => sum + (addon.Price || 0), 0)

    const leftHalfName = fiftyFiftySelection.leftHalf?.name || 'Unknown'
    const rightHalfName = fiftyFiftySelection.rightHalf?.name || 'Unknown'
    
    const cartItem = {
      id: Date.now(),
      name: `${leftHalfName} / ${rightHalfName}`,
      price: fiftyFiftySelection.finalPrice + addonCost,
      category: 'pizza-5050',
      size: fiftyFiftySelection.size,
      addons: fiftyFiftySelection.selectedAddons,
      comment: `${fiftyFiftySelection.leftHalf?.name} / ${fiftyFiftySelection.rightHalf?.name}: ${fiftyFiftySelection.size} (~2000г | 60см)${(fiftyFiftySelection.selectedAddons || []).length > 0 ? ` | ${(fiftyFiftySelection.selectedAddons || []).length} добавки` : ''}`,
      quantity: 1
    }

    setSelectedProducts(prev => [...prev, cartItem])
    resetFiftyFiftySelection()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          type: 'printer'
        })
      });

      const result = await response.json();

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryMinutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 15;
        setError(`Твърде много опити за влизане. Моля, изчакайте ${retryMinutes} минути преди да опитате отново.`);
        return;
      }

      if (response.ok && result.success) {
        setIsAuthenticated(true);
        setCurrentView("main");
      } else {
        setError("Невалиден имейл адрес или парола");
      }
    } catch (error) {
      setError("Грешка при влизане");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView("login");
    setUsername("");
    setPassword("");
    setSelectedProducts([]);
    setSelectedCategory("");
    resetFiftyFiftySelection();
  };

  // Load menu data on component mount
  useEffect(() => {
    async function loadMenuData() {
      try {
        const data = await fetchMenuData();
        setMenuData(data);
      } catch (error) {
      }
    }
    loadMenuData();
  }, []);

  // Fetch large pizza addons when 50/50 pizza reaches step 4
  useEffect(() => {
    const fetchFiftyFiftyAddons = async () => {
      if (fiftyFiftySelection.step === 4 && fiftyFiftyAddons.length === 0) {
        setIsLoadingFiftyFiftyAddons(true);
        try {
          const addons = await fetchAddons(1, 'голяма'); // ProductTypeID = 1 for pizza, 'голяма' for large
          setFiftyFiftyAddons(addons);
        } catch (error) {
          setFiftyFiftyAddons([]);
        } finally {
          setIsLoadingFiftyFiftyAddons(false);
        }
      }
    };

    fetchFiftyFiftyAddons();
  }, [fiftyFiftySelection.step, fiftyFiftyAddons.length]);

  // Initialize Google Places Autocomplete for address field
  const initializeAutocomplete = () => {
    if (!addressInputRef.current || !window.google?.maps?.places) return;

    // Clean up existing autocomplete instance if it exists
    if (autocomplete) {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    }

    const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'bg' }, // Restrict to Bulgaria
      fields: ['formatted_address', 'geometry', 'place_id']
    });

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();

      if (place.formatted_address) {
        // Update the address with the selected place
        setCustomerInfo(prev => ({
          ...prev,
          address: place.formatted_address || ''
        }));
      } else {
      }
    });

    setAutocomplete(autocompleteInstance as any);
  };

  // Search for customers by phone number
  const searchCustomersByPhone = useCallback(async (phone: string) => {
    if (!phone || phone.trim().length < 3) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      const response = await fetch(`/api/printer/customer-search?phone=${encodeURIComponent(phone.trim())}`);
      const data = await response.json();
      setCustomerSuggestions(data.customers || []);
      setShowSuggestions(data.customers && data.customers.length > 0);
    } catch (error) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearchingCustomers(false);
    }
  }, []);

  // Debounced phone number search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (customerInfo.phone && customerInfo.phone.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCustomersByPhone(customerInfo.phone);
      }, 500); // 500ms debounce
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [customerInfo.phone, searchCustomersByPhone]);

  // Handle customer suggestion selection
  const handleSelectCustomer = (customer: any) => {
    setCustomerInfo(prev => ({
      ...prev,
      name: customer.Name || '',
      phone: customer.phone || '',
      address: customer.LocationText || ''
    }));
    setShowSuggestions(false);
    setCustomerSuggestions([]);
  };

  // Load Google Maps script and initialize autocomplete when customer form is shown
  useEffect(() => {
    if (showCustomerForm) {
      const loadGoogleMaps = async () => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          initializeAutocomplete();
          return;
        }

        // Check if script already exists to prevent duplicate loading
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          // Wait for existing script to load
          existingScript.addEventListener('load', () => {
            initializeAutocomplete();
          });
          return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.addEventListener('load', () => {
          initializeAutocomplete();
        });

        script.addEventListener('error', (error) => {
        });

        document.head.appendChild(script);
      };

      loadGoogleMaps();
    }
  }, [showCustomerForm]);

  const categories: Category[] = [
    { id: "pizza", name: "Пици", emoji: "" },
    { id: "pizza-5050", name: "Пица 50/50", emoji: "" },
    { id: "doners", name: "Дюнери", emoji: "" },
    { id: "burgers", name: "Бургери", emoji: "" },
    { id: "drinks", name: "Напитки", emoji: "" },
    { id: "sauces", name: "Сосове", emoji: "" },
  ];

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    
    try {
      const menuData = await fetchMenuData();
      
      // Get products from the specific category
      let categoryProducts: any[] = [];
      
      switch (categoryId) {
        case 'pizza':
          categoryProducts = menuData.pizza || [];
          break;
        case 'pizza-5050':
          categoryProducts = menuData.pizza || []; // 50/50 uses same pizza data
          break;
        case 'doners':
          categoryProducts = menuData.doners || [];
          break;
        case 'burgers':
          categoryProducts = menuData.burgers || [];
          break;
        case 'drinks':
          categoryProducts = menuData.drinks || [];
          break;
        case 'sauces':
          categoryProducts = (menuData as any).sauces || [];
          break;
        default:
          categoryProducts = [];
      }
      
      setProducts(categoryProducts);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product: Product) => {
    // For drinks and sauces, add directly to cart without modal
    if (selectedCategory === 'drinks' || selectedCategory === 'sauces') {
      const firstSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
      const price = firstSize ? firstSize.price : product.basePrice;
      
      setSelectedProducts(prev => [...prev, {
        ...product,
        quantity: 1,
        comment: "",
        addons: [],
        price: price,
        size: firstSize?.name || 'Standard',
        category: selectedCategory
      }]);
      return;
    }
    
    // For other categories, show modal with addons
    const firstSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
    const price = firstSize ? firstSize.price : product.basePrice;
    
    setProductModalData({
      product,
      quantity: 1,
      comment: "",
      addons: [],
      selectedSize: firstSize,
      selectedPrice: price,
      availableAddons: [],
      isLoadingAddons: true
    });
    setShowProductModal(true);
    
    // Load addons based on product category (only if product doesn't have isNoAddOns flag)
    try {
      let addons: any[] = [];
      
      // Check if product has isNoAddOns flag - if so, skip fetching addons
      if (product.isNoAddOns) {
        setProductModalData(prev => prev ? {
          ...prev,
          availableAddons: [],
          isLoadingAddons: false
        } : null);
        return;
      }
      
      // Determine product type ID based on category
      if (selectedCategory === 'pizza') {
        const sizeName = firstSize?.name || 'Малка';
        addons = await fetchAddons(1, sizeName);
      } else if (selectedCategory === 'burgers') {
        addons = await fetchAddons(2);
      } else if (selectedCategory === 'doners') {
        addons = await fetchAddons(3);
      }
      
      setProductModalData(prev => prev ? {
        ...prev,
        availableAddons: addons,
        isLoadingAddons: false
      } : null);
    } catch {
      setProductModalData(prev => prev ? {
        ...prev,
        availableAddons: [],
        isLoadingAddons: false
      } : null);
    }
  };

  const handleProductModalSubmit = () => {
    if (productModalData) {
      const existingProductIndex = selectedProducts.findIndex(
        p => p.id === productModalData.product.id && p.size === productModalData.selectedSize?.name
      );
      
      if (existingProductIndex >= 0) {
        const updatedProducts = [...selectedProducts];
        updatedProducts[existingProductIndex] = {
          ...productModalData.product,
          quantity: productModalData.quantity,
          comment: productModalData.comment,
          addons: productModalData.addons,
          price: productModalData.selectedPrice,
          size: productModalData.selectedSize?.name || 'Standard'
        };
        setSelectedProducts(updatedProducts);
      } else {
        setSelectedProducts(prev => [...prev, {
          ...productModalData.product,
          quantity: productModalData.quantity,
          comment: productModalData.comment,
          addons: productModalData.addons,
          price: productModalData.selectedPrice,
          size: productModalData.selectedSize?.name || 'Standard'
        }]);
      }
    }
    
    setShowProductModal(false);
    setProductModalData(null);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to calculate item total including addons
  const calculateItemTotal = (product: any) => {
    // Calculate base price
    const basePrice = product.price * product.quantity;
    
    // Calculate addon cost
    let addonCost = 0;
    if (product.addons && product.addons.length > 0) {
      addonCost = product.addons
        .map((addon: any) => {
          // For pizzas (including 50/50), all addons are paid
          if (product.category === 'pizza' || product.category === 'pizza-5050') {
            return addon.Price || 0;
          }
          
          // For other products (doners, burgers), first 3 of each type are free
          const typeSelected = product.addons.filter((a: any) => a.AddonType === addon.AddonType);
          const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID);
          return positionInType < 3 ? 0 : (addon.Price || 0);
        })
        .reduce((sum: number, price: number) => sum + price, 0);
      
      // Multiply addon cost by quantity
      addonCost *= product.quantity;
    }
    
    return basePrice + addonCost;
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + calculateItemTotal(product);
    }, 0);
  };

  const handleReady = () => {
    if (selectedProducts.length === 0) {
      alert("Моля изберете поне един продукт");
      return;
    }
    setShowCustomerForm(true);
  };

  const handleCustomerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Моля попълнете име и телефон");
      return;
    }
    if (customerInfo.orderType === 2 && !customerInfo.address) {
      alert("Моля въведете адрес за доставка");
      return;
    }
    setShowCustomerForm(false);
    handlePrint();
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const orderItems = selectedProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        addons: product.addons || [],
        comment: product.comment || "",
        size: product.size || 'Standard',
        category: product.category || 'unknown'
      }));

      const response = await fetch('/api/printer/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerInfo,
          orderItems,
          totalPrice: calculateTotal(),
          orderType: customerInfo.orderType,
          deliveryPrice: customerInfo.deliveryPrice
        }),
      });

      if (response.ok) {
        alert(`Поръчката е създадена успешно!`);
        // Reset for next customer
        setShowCustomerForm(false);
        setSelectedProducts([]);
        setCustomerInfo({
          name: "",
          phone: "",
          address: "Взимане от ресторант", // Default address for pickup
          orderType: 1,
          deliveryPrice: 0
        });
        setCustomerSuggestions([]);
        setShowSuggestions(false);
        setSelectedCategory("");
        resetFiftyFiftySelection();
        setCurrentView("main");
      } else {
        throw new Error('Failed to create order');
      }
    } catch {
      alert('Грешка при създаване на поръчката');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClearOrder = () => {
    setSelectedProducts([]);
    setShowClearModal(false);
  };

  const goBack = () => {
    if (currentView === "products") {
      setCurrentView("categories");
      // Don't clear selectedProducts - keep the order list
    } else if (currentView === "pizza-5050") {
      setCurrentView("categories");
      resetFiftyFiftySelection();
    } else if (currentView === "categories") {
      setCurrentView("login");
    }
  };

  // Modal renderings - Check these FIRST before any main views
  // Product Modal
  if (showProductModal && productModalData) {
    // Calculate dynamic price including addons
    const calculateModalPrice = () => {
      const basePrice = productModalData.selectedPrice;
      
      // Calculate addon cost
      let addonCost = 0;
      if (productModalData.addons && productModalData.addons.length > 0) {
        addonCost = productModalData.addons
          .map((addon: any) => {
            // For pizzas, all addons are paid
            if (selectedCategory === 'pizza') {
              return addon.Price || 0;
            }
            
            // For other products (doners, burgers), first 3 of each type are free
            const typeSelected = productModalData.addons.filter((a: any) => a.AddonType === addon.AddonType);
            const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID);
            return positionInType < 3 ? 0 : (addon.Price || 0);
          })
          .reduce((sum: number, price: number) => sum + price, 0);
      }
      
      return basePrice + addonCost;
    };

    return (
      <div className="min-h-screen bg-black p-3 md:p-4 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-3 md:mb-4">
            <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{productModalData.product.name}</h1>
            <p className="text-red-500 font-bold text-lg md:text-2xl border-2 border-red-500 inline-block px-4 py-2 rounded-lg">{calculateModalPrice().toFixed(2)} €</p>
          </div>
          
          {/* Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            {/* Left Column - Product Details & Actions */}
            <div className="space-y-3 md:space-y-4">
              {/* Size Selection */}
              {productModalData.product.sizes && productModalData.product.sizes.length > 0 && (
                <div>
                  <label className="block text-white text-sm md:text-base font-medium mb-2">Размер</label>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {productModalData.product.sizes.map((size) => (
                      <button
                        key={size.name}
                        onClick={() => setProductModalData(prev => prev ? { 
                          ...prev, 
                          selectedSize: size, 
                          selectedPrice: size.price 
                        } : null)}
                        className={`w-full p-2 border transition-colors duration-200 ${
                          productModalData.selectedSize?.name === size.name
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-gray-900 border-gray-700 text-white hover:border-red-500'
                        }`}
                      >
                        <div className="font-medium text-sm">{size.name}</div>
                        <div className="text-xs text-red-400">{size.price.toFixed(2)} €</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-white text-sm md:text-base font-medium mb-2">Брой</label>
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <button
                    onClick={() => setProductModalData(prev => prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-lg md:text-xl"
                  >
                    -
                  </button>
                  <span className="text-white font-bold text-2xl md:text-3xl min-w-[50px] md:min-w-[60px] text-center">
                    {productModalData.quantity}
                  </span>
                  <button
                    onClick={() => setProductModalData(prev => prev ? { ...prev, quantity: prev.quantity + 1 } : null)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center text-lg md:text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-white text-sm md:text-base font-medium mb-2">Коментар</label>
                <textarea
                  value={productModalData.comment}
                  onChange={(e) => setProductModalData(prev => prev ? { ...prev, comment: e.target.value } : null)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm md:text-base"
                  placeholder="Добавете коментар..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setProductModalData(null);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-2 transition-colors duration-200 text-sm"
                >
                  Отказ
                </button>
                <button
                  onClick={handleProductModalSubmit}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-2 transition-colors duration-200 text-sm"
                >
                  Добави
                </button>
              </div>
            </div>

            {/* Right Column - Addons (spans 2 columns on desktop) */}
            <div className="lg:col-span-2">
              <label className="block text-white text-base font-medium mb-2">Добавки</label>
              <div className="bg-gray-900 border border-gray-700 p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {productModalData.isLoadingAddons ? (
                  <p className="text-gray-400 text-center py-6">Зареждане на добавки...</p>
                ) : productModalData.availableAddons.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {/* Info message for free addons */}
                    {selectedCategory !== 'pizza' && (
                      <p className="text-sm text-gray-400 mb-3">
                        💡 Първите 3 добавки от всеки тип са безплатни
                      </p>
                    )}
                    {/* Group addons by type */}
                    {['sauce', 'vegetable', 'meat', 'cheese', 'pizza-addon'].map(addonType => {
                      const typeAddons = productModalData.availableAddons.filter((a: any) => a.AddonType === addonType);
                      if (typeAddons.length === 0) return null;
                      
                      const typeNames: any = {
                        sauce: 'Сосове',
                        vegetable: 'Салати',
                        meat: 'Колбаси',
                        cheese: 'Сирена',
                        'pizza-addon': 'Добавки'
                      };
                      
                      return (
                        <div key={addonType}>
                          <h5 className="text-xs text-white font-medium mb-2">{typeNames[addonType]}:</h5>
                          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                            {typeAddons.map((addon: any) => {
                              const isSelected = productModalData.addons.some((a: any) => a.AddonID === addon.AddonID);
                              
                              // Calculate if addon is free
                              let addonPrice = addon.Price;
                              let isFree = false;
                              
                              // For pizzas, all addons are paid
                              if (selectedCategory !== 'pizza') {
                                // For non-pizza items (doners, burgers), first 3 of each type are free
                                const typeSelected = productModalData.addons.filter((a: any) => a.AddonType === addonType);
                                
                                if (isSelected) {
                                  // If already selected, check its position in the selected list
                                  const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID);
                                  isFree = positionInType < 3;
                                } else {
                                  // If not selected, check if there's room for more free addons
                                  isFree = typeSelected.length < 3;
                                }
                                
                                addonPrice = isFree ? 0 : addon.Price;
                              }
                              
                              return (
                                <button
                                  key={addon.AddonID}
                                  type="button"
                                  onClick={() => {
                                    setProductModalData(prev => {
                                      if (!prev) return null;
                                      const newAddons = isSelected
                                        ? prev.addons.filter((a: any) => a.AddonID !== addon.AddonID)
                                        : [...prev.addons, addon];
                                      return { ...prev, addons: newAddons };
                                    });
                                  }}
                                  className={`p-2 border transition-colors duration-200 text-center ${
                                    isSelected
                                      ? 'bg-green-600 border-green-600 text-white'
                                      : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'
                                  }`}
                                >
                                  <div className="font-medium text-xs leading-tight">{addon.Name}</div>
                                  <div className={`text-xs mt-1 ${isSelected ? (isFree ? 'text-green-400' : 'text-white') : 'text-red-400'}`}>
                                    {isFree ? 'Безплатно' : `${addonPrice.toFixed(2)} €.`}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6">Няма налични добавки</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Clear Order Confirmation Modal
  if (showClearModal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Изчисти поръчката?</h1>
            <p className="text-gray-400">Сигурни ли сте, че искате да изчистите всички избрани продукти?</p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowClearModal(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-4 transition-colors duration-200"
            >
              Отказ
            </button>
            <button
              onClick={handleClearOrder}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-4 transition-colors duration-200"
            >
              Да, изчисти
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Customer Details Modal
  if (showCustomerForm) {
    return (
      <div className="h-screen bg-black flex items-start justify-center p-4">
        <div className="w-full max-w-5xl h-[50vh] overflow-hidden">
          <form onSubmit={handleCustomerFormSubmit} className="h-full flex gap-6">
            {/* Left column: caption + first three fields */}
            <div className="w-1/2 h-full overflow-y-auto pr-4">
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-white mb-1">Данни за клиента</h1>
                <p className="text-gray-400 text-sm">Попълнете информацията за поръчката</p>
              </div>
              
              {/* Phone Number - First Field */}
              <div className="relative mb-4">
                <label className="block text-white text-sm font-medium mb-1">
                  Телефон *
                </label>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => {
                    setCustomerInfo(prev => ({ ...prev, phone: e.target.value }));
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (customerSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click on suggestion
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                  placeholder="Въведете телефон"
                  required
                />
                {isSearchingCustomers && (
                  <div className="absolute right-3 top-9 text-gray-400 text-sm">
                    Търсене...
                  </div>
                )}
                {/* Customer Suggestions Dropdown */}
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customerSuggestions.map((customer) => (
                      <button
                        key={customer.LoginID}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-700 border-b border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="text-white font-medium text-sm">{customer.Name}</div>
                        <div className="text-gray-400 text-xs">{customer.phone}</div>
                        {customer.LocationText && (
                          <div className="text-gray-500 text-xs mt-1 truncate">{customer.LocationText}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name - Second Field */}
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-1">
                  Име *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                  placeholder="Въведете име"
                  required
                />
              </div>
              
              {/* Address - Third Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-1">
                  Адрес *
                </label>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                  placeholder="Град/Село, адрес"
                  required={customerInfo.orderType === 2}
                />
              </div>
            </div>

            {/* Right column: delivery type + action buttons */}
            <div className="w-1/2 h-full overflow-y-auto pl-4 flex flex-col">
              <div>
                <label className="block text-white text-lg font-medium mb-3">
                  Тип на поръчка *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCustomerInfo(prev => ({ ...prev, orderType: 1, deliveryPrice: 0, address: "Взимане от ресторант" }))}
                    className={`p-4 border transition-colors duration-200 ${
                      customerInfo.orderType === 1
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-gray-900 border-gray-700 text-white hover:border-green-500'
                    }`}
                  >
                    <div className="font-bold text-xl">Вземане</div>
                    <div className="text-sm mt-1">Безплатно</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerInfo(prev => ({ ...prev, orderType: 2, deliveryPrice: 2 }))}
                    className={`p-4 border transition-colors duration-200 ${
                      customerInfo.orderType === 2 && customerInfo.deliveryPrice === 2
                        ? 'bg-yellow-600 border-yellow-600 text-white'
                        : 'bg-gray-900 border-gray-700 text-white hover:border-yellow-500'
                    }`}
                  >
                    <div className="font-bold text-xl">Доставка</div>
                    <div className="text-sm mt-1">Жълта - 2 €</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerInfo(prev => ({ ...prev, orderType: 2, deliveryPrice: 5 }))}
                    className={`p-4 border transition-colors duration-200 ${
                      customerInfo.orderType === 2 && customerInfo.deliveryPrice === 5
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-900 border-gray-700 text-white hover:border-blue-500'
                    }`}
                  >
                    <div className="font-bold text-xl">Доставка</div>
                    <div className="text-sm mt-1">Синя - 5 €</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerInfo(prev => ({ ...prev, orderType: 2, deliveryPrice: 0 }))}
                    className={`p-4 border transition-colors duration-200 ${
                      customerInfo.orderType === 2 && customerInfo.deliveryPrice === 0
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-gray-900 border-gray-700 text-white hover:border-purple-500'
                    }`}
                  >
                    <div className="font-bold text-xl">Доставка</div>
                    <div className="text-sm mt-1">Безплатна</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mt-8 md:mt-auto pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-4 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPrinting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-4 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPrinting ? "Създаване..." : "Confirm"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || currentView === "login") {
    return (
      <div className={styles.adminLoginPage}>
        <div className={styles.backgroundPattern}></div>
        
        <div className={styles.container}>
          <div className={styles.loginCard}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.iconWrapper}>
                <Printer size={32} />
              </div>
              <h1 className={styles.title}>Принтер</h1>
              <p className={styles.subtitle}>Вход за персонал</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`${styles.errorMessage} ${styles.error}`}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Имейл адрес</label>
                <div className={styles.inputWrapperWithIcon}>
                  <Mail className={styles.inputIcon} size={20} />
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                    placeholder="Въведете имейл адрес"
                    required
                  />
                </div>
              </div>
              
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Парола</label>
                <div className={styles.inputWrapperWithIcon}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${styles.input} ${styles.inputWithPasswordToggle}`}
                    placeholder="Въведете парола"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className={styles.submitButton}
              >
                Вход
              </button>
            </form>

            {/* Back Link */}
            <div className={styles.backLink}>
              <button
                onClick={() => router.back()}
                className={styles.backLinkButton}
              >
                ← Назад към сайта
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "main") {
    return (
      <div className="h-screen bg-black w-full flex overflow-hidden">
        {/* Left: Selected Items (Cart) */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-l font-bold text-white">Поръчка</h2>

          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-400 text-center">Няма избрани продукти</p>
            ) : (
              <div className="space-y-2">
                {selectedProducts.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="bg-gray-800 p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{product.name}</span>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500 hover:text-red-400 text-lg"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-400 text-xs mb-1">
                      {product.size && product.size !== 'Standard' && (
                        <span>Размер: {product.size} | </span>
                      )}
                      Брой: {product.quantity} x {product.price.toFixed(2)} €
                    </div>
                    {product.comment && (
                      <div className="text-gray-400 text-xs mb-1">
                        Коментар: {product.comment}
                      </div>
                    )}
                    {product.addons && product.addons.length > 0 && (
                      <div className="text-gray-400 text-xs mb-1">
                        Добавки: {product.addons.map((addon: any) => addon.name || addon.Name).join(', ')}
                      </div>
                    )}
                    <div className="text-red-500 font-bold text-base">
                      {calculateItemTotal(product).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProducts.length > 0 && (
            <div className="p-2 border-t border-gray-700">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="font-bold text-base">Общо:</span>
                <span className="text-red-500 font-bold text-lg">
                  {calculateTotal().toFixed(2)} €
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearModal(true)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs py-1.5 transition-colors duration-200"
                >
                  Изчисти
                </button>
                <button
                  onClick={handleReady}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-1.5 transition-colors duration-200"
                >
                  Готово
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Categories */}
        <div className="w-52 shrink-0 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Категории</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation"
              title="Излез"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 grid-rows-6 gap-0 p-1 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`bg-gray-900 border flex flex-col items-center justify-center transition-all duration-200 group p-1 h-20 ${selectedCategory === category.id ? 'border-red-600 bg-gray-800' : 'border-gray-700 hover:border-red-500 hover:bg-gray-800'}`}
              >
                <span className="text-white font-medium text-sm text-center leading-tight">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Subcategories / Products */}
        <div className="flex-1 bg-gray-900 border-l border-gray-700 flex flex-col">
          <div className="p-2 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white">
              {selectedCategory ? (categories.find(c => c.id === selectedCategory)?.name || 'Продукти') : 'Изберете категория'}
            </h2>
          </div>

          <div className="flex-1 p-2 overflow-y-auto">
            {!selectedCategory && (
              <p className="text-gray-400 text-center mt-8">Моля, изберете категория от средната колона</p>
            )}

            {selectedCategory && selectedCategory !== 'pizza-5050' && (
              loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white">Зареждане...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-500 p-2 flex flex-col items-center justify-center transition-all duration-200 h-[100px]"
                    >
                      <span className="text-white font-medium text-center text-sm mb-1 leading-tight line-clamp-2">
                        {product.name}
                      </span>
                      <span className="text-red-500 font-bold text-base">
                        {product.basePrice.toFixed(2)} €
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}

            {selectedCategory === 'pizza-5050' && (
              <div className="p-1">
                {/* 50/50 steps rendered in this column */}
                {/* Step 1 */}
                {fiftyFiftySelection.step === 1 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">Избери размер на пицата</h3>
                    <div className="grid grid-cols-1 gap-2 max-w-md">
                      <button
                        onClick={() => setFiftyFiftySelection(prev => ({ ...prev, size: 'Голяма', step: 2 }))}
                        className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-500 transition-all"
                      >
                        <div className="text-base font-bold text-white mb-1">Голяма</div>
                        <div className="text-xs text-gray-400">~2000г | 60см</div>
                      </button>
                    </div>
                  </div>
                )}
                {/* Step 2 */}
                {fiftyFiftySelection.step === 2 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 1 }))}
                        className="text-white hover:text-red-500 transition-colors text-sm"
                      >
                        ← Назад
                      </button>
                      <h3 className="text-lg font-bold text-white">Избери лявата половина</h3>
                      <div className="w-16"></div>
                    </div>
                    <div className="mb-2">
                      <div className="inline-block px-2 py-1 bg-red-900 border border-red-500 text-red-400 text-xs">
                        Размер: {fiftyFiftySelection.size} (~2000г | 60см)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {products.map((pizza) => (
                        <button
                          key={pizza.id}
                          onClick={() => setFiftyFiftySelection(prev => ({ ...prev, leftHalf: pizza, step: 3 }))}
                          className={`p-2 transition-all h-[85px] flex flex-col items-center justify-center ${
                            fiftyFiftySelection.leftHalf?.id === pizza.id ? 'bg-green-900 border-2 border-green-500' : 'bg-gray-900 border border-gray-700 hover:border-red-500'
                          }`}
                        >
                          <div className="text-white font-medium text-center text-[10px] mb-1 leading-tight line-clamp-2">{pizza.name}</div>
                          <div className="text-red-500 font-bold text-xs text-center">{getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} €.</div>
                          {fiftyFiftySelection.leftHalf?.id === pizza.id && (
                            <div className="text-green-400 text-[9px] text-center mt-0.5">✓ ЛЯВА</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Step 3 */}
                {fiftyFiftySelection.step === 3 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 2, rightHalf: null }))}
                        className="text-white hover:text-red-500 transition-colors text-sm"
                      >
                        ← Назад
                      </button>
                      <h3 className="text-lg font-bold text-white">Избери дясната половина</h3>
                      <div className="w-16"></div>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <div className="inline-block px-2 py-1 bg-red-900 border border-red-500 text-red-400 text-xs">Размер: {fiftyFiftySelection.size}</div>
                      <div className="inline-block px-2 py-1 bg-green-900 border border-green-500 text-green-400 text-xs">Лява: {fiftyFiftySelection.leftHalf?.name}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {products.map((pizza) => (
                        <button
                          key={pizza.id}
                          onClick={() => {
                            const finalPrice = calculateFiftyFiftyPrice(fiftyFiftySelection.leftHalf, pizza, fiftyFiftySelection.size)
                            setFiftyFiftySelection(prev => ({ ...prev, rightHalf: pizza, finalPrice, step: 4 }))
                          }}
                          className={`p-2 transition-all h-[85px] flex flex-col items-center justify-center ${
                            pizza.id === fiftyFiftySelection.leftHalf?.id ? 'bg-gray-700 border-2 border-gray-500' : (fiftyFiftySelection.rightHalf?.id === pizza.id ? 'bg-red-900 border-2 border-red-500' : 'bg-gray-900 border border-gray-700 hover:border-red-500')
                          }`}
                        >
                          <div className="text-white font-medium text-center text-[10px] mb-1 leading-tight line-clamp-2">{pizza.name}</div>
                          <div className="text-red-500 font-bold text-xs text-center">{getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} €.</div>
                          {pizza.id === fiftyFiftySelection.leftHalf?.id && (
                            <div className="text-gray-400 text-[9px] text-center mt-0.5">ЛЯВА</div>
                          )}
                          {fiftyFiftySelection.rightHalf?.id === pizza.id && (
                            <div className="text-red-400 text-[9px] text-center mt-0.5">✓ ДЯСНА</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Step 4 */}
                {fiftyFiftySelection.step === 4 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 3 }))}
                        className="text-white hover:text-red-500 transition-colors text-sm"
                      >
                        ← Назад
                      </button>
                      <h3 className="text-lg font-bold text-white">Избери добавки</h3>
                      <div className="w-16"></div>
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <div className="inline-block px-2 py-1 bg-red-900 border border-red-500 text-red-400 text-[10px]">{fiftyFiftySelection.leftHalf?.name} / {fiftyFiftySelection.rightHalf?.name}</div>
                      <div className="inline-block px-2 py-1 bg-green-900 border border-green-500 text-green-400 text-[10px]">{fiftyFiftySelection.size} (~2000г | 60см)</div>
                      <div className="inline-block px-2 py-1 bg-orange-900 border border-orange-500 text-orange-400 text-[10px]">{fiftyFiftySelection.finalPrice.toFixed(2)} €.</div>
                    </div>
                    <div className="mb-3 bg-gray-900 border border-gray-700 p-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                      {isLoadingFiftyFiftyAddons ? (
                        <div className="text-center text-gray-400 py-4">Зареждане на добавки...</div>
                      ) : fiftyFiftyAddons && fiftyFiftyAddons.length > 0 ? (
                        <div className="space-y-4">
                          {['sauce','vegetable','meat','cheese','pizza-addon'].map(type => (
                            fiftyFiftyAddons.filter((a: any) => a.AddonType === type).length > 0 && (
                              <div key={type}>
                                <h5 className="text-xs text-white font-medium mb-2">{{sauce:'Сосове',vegetable:'Салати',meat:'Колбаси',cheese:'Сирена','pizza-addon':'Добавки'}[type as 'sauce']}:</h5>
                                <div className="grid grid-cols-3 gap-2">
                                  {fiftyFiftyAddons.filter((a: any) => a.AddonType === type).map((addon: any) => {
                                    const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                    return (
                                      <button
                                        key={addon.AddonID}
                                        type="button"
                                        onClick={() => setFiftyFiftySelection(prev => ({ ...prev, selectedAddons: isSelected ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID) : [...prev.selectedAddons, addon] }))}
                                        className={`p-2 border transition-colors duration-200 text-center ${isSelected ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'}`}
                                      >
                                        <div className="font-medium text-xs leading-tight">{addon.Name}</div>
                                        <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-red-400'}`}>{addon.Price.toFixed(2)} €.</div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8"><p className="text-gray-400">Няма налични добавки</p></div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 3 }))} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 text-sm transition-colors duration-200">← Назад</button>
                      <button onClick={addFiftyFiftyToCart} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 text-sm transition-colors duration-200">Добави в кошницата</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "products") {
    return (
      <div className="h-screen bg-black w-full flex overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col">
          {/* Header - Compact for 702p */}
          <div className="flex items-center justify-between p-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-2xl font-bold text-white">
                {categories.find(cat => cat.id === selectedCategory)?.name || "Продукти"}
              </h1>
            </div>
          </div>

          {/* Products Grid - Optimized for 702p */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white text-lg">Зареждане...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-5 gap-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-red-500 p-2 flex flex-col items-center justify-center transition-all duration-200 h-[100px]"
                  >
                    <span className="text-white font-medium text-center text-sm mb-1 leading-tight line-clamp-2">
                      {product.name}
                    </span>
                    <span className="text-red-500 font-bold text-base">
                      {product.basePrice.toFixed(2)} €
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Cart - Compact for 702p */}
        <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-2 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white">Поръчка</h2>
          </div>

          {/* Cart Items - Compact for 702p */}
          <div className="flex-1 p-2 overflow-y-auto">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-400 text-center text-sm">Няма избрани продукти</p>
            ) : (
              <div className="space-y-1.5">
                {selectedProducts.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="bg-gray-800 p-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white font-medium text-xs">{product.name}</span>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500 hover:text-red-400 text-base"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-400 text-[10px] mb-0.5">
                      {product.size && product.size !== 'Standard' && (
                        <span>Размер: {product.size} | </span>
                      )}
                      Брой: {product.quantity} x {product.price.toFixed(2)} €
                    </div>
                    {product.comment && (
                      <div className="text-gray-400 text-[10px] mb-0.5">
                        Коментар: {product.comment}
                      </div>
                    )}
                    {product.addons && product.addons.length > 0 && (
                      <div className="text-gray-400 text-[10px] mb-0.5">
                        Добавки: {product.addons.map((addon: any) => addon.name || addon.Name).join(', ')}
                      </div>
                    )}
                    <div className="text-red-500 font-bold text-sm">
                      {calculateItemTotal(product).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer - Compact for 702p */}
          {selectedProducts.length > 0 && (
            <div className="p-2 border-t border-gray-700">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="font-bold text-base">Общо:</span>
                <span className="text-red-500 font-bold text-lg">
                  {calculateTotal().toFixed(2)} €
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowClearModal(true);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs py-1.5 transition-colors duration-200"
                >
                  Изчисти
                </button>
                <button
                  onClick={handleReady}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-1.5 transition-colors duration-200"
                >
                  Готово
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 50/50 Pizza View
  if (currentView === "pizza-5050") {
    return (
      <div className="h-screen bg-black w-full flex overflow-hidden">
        {/* Left Side - 50/50 Selection */}
        <div className="flex-1 flex flex-col">
          {/* Header - Compact for 702p */}
          <div className="flex items-center justify-between p-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-2xl font-bold text-white">Пица 50/50</h1>
            </div>
          </div>

          {/* 50/50 Content - Optimized for 702p */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* Step 1: Size Selection - Compact for 702p */}
            {fiftyFiftySelection.step === 1 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Избери размер на пицата</h3>
                <div className="grid grid-cols-1 gap-2 max-w-md">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, size: 'Голяма', step: 2 }))}
                    className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-500 transition-all"
                  >
                    <div className="text-base font-bold text-white mb-1">Голяма</div>
                    <div className="text-xs text-gray-400">~2000г | 60см</div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Left Half Selection - Compact for 702p */}
            {fiftyFiftySelection.step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 1 }))}
                    className="text-white hover:text-red-500 transition-colors text-sm"
                  >
                    ← Назад
                  </button>
                  <h3 className="text-lg font-bold text-white">Избери лявата половина</h3>
                  <div className="w-16"></div>
                </div>
                
                <div className="mb-3">
                  <div className="inline-block px-2 py-1 bg-red-900 border border-red-500 text-red-400 text-xs">
                    Размер: {fiftyFiftySelection.size} (~2000г | 60см)
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {products.map((pizza) => (
                    <button
                      key={pizza.id}
                      onClick={() => {
                        setFiftyFiftySelection(prev => ({
                          ...prev,
                          leftHalf: pizza,
                          step: 3
                        }))
                      }}
                      className={`p-2 transition-all h-[85px] flex flex-col items-center justify-center ${
                        fiftyFiftySelection.leftHalf?.id === pizza.id 
                          ? 'bg-green-900 border-2 border-green-500' 
                          : 'bg-gray-900 border border-gray-700 hover:border-red-500'
                      }`}
                    >
                      <div className="text-white font-medium text-center text-[10px] mb-1 leading-tight line-clamp-2">
                        {pizza.name}
                      </div>
                      <div className="text-red-500 font-bold text-xs text-center">
                        {getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} €.
                      </div>
                      {fiftyFiftySelection.leftHalf?.id === pizza.id && (
                        <div className="text-green-400 text-[9px] text-center mt-0.5">✓ ЛЯВА</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Right Half Selection - Compact for 702p */}
            {fiftyFiftySelection.step === 3 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 2, rightHalf: null }))}
                    className="text-white hover:text-red-500 transition-colors text-sm"
                  >
                    ← Назад
                  </button>
                  <h3 className="text-lg font-bold text-white">Избери дясната половина</h3>
                  <div className="w-16"></div>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <div className="inline-block px-2 py-1 bg-red-900 border border-red-500 text-red-400 text-xs">
                    Размер: {fiftyFiftySelection.size}
                  </div>
                  <div className="inline-block px-2 py-1 bg-green-900 border border-green-500 text-green-400 text-xs">
                    Лява: {fiftyFiftySelection.leftHalf?.name}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {products.map((pizza) => (
                    <button
                      key={pizza.id}
                      onClick={() => {
                        const finalPrice = calculateFiftyFiftyPrice(fiftyFiftySelection.leftHalf, pizza, fiftyFiftySelection.size)
                        setFiftyFiftySelection(prev => ({
                          ...prev,
                          rightHalf: pizza,
                          finalPrice: finalPrice,
                          step: 4
                        }))
                      }}
                      className={`p-2 transition-all h-[85px] flex flex-col items-center justify-center ${
                        pizza.id === fiftyFiftySelection.leftHalf?.id 
                          ? 'bg-gray-700 border-2 border-gray-500' 
                          : fiftyFiftySelection.rightHalf?.id === pizza.id
                            ? 'bg-red-900 border-2 border-red-500'
                            : 'bg-gray-900 border border-gray-700 hover:border-red-500'
                      }`}
                    >
                      <div className="text-white font-medium text-center text-[10px] mb-1 leading-tight line-clamp-2">
                        {pizza.name}
                      </div>
                      <div className="text-red-500 font-bold text-xs text-center">
                        {getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} €.
                      </div>
                      {pizza.id === fiftyFiftySelection.leftHalf?.id && (
                        <div className="text-gray-400 text-[9px] text-center mt-0.5">ЛЯВА</div>
                      )}
                      {fiftyFiftySelection.rightHalf?.id === pizza.id && (
                        <div className="text-red-400 text-[9px] text-center mt-0.5">✓ ДЯСНА</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

              {/* Step 4: Addons Selection - Compact for 702p */}
            {fiftyFiftySelection.step === 4 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 3 }))}
                    className="text-white hover:text-red-500 transition-colors text-sm"
                  >
                    ← Назад
                  </button>
                  <h3 className="text-lg font-bold text-white">Избери добавки</h3>
                  <div className="w-16"></div>
                </div>
                
                <div className="flex gap-2 mb-3 flex-wrap">
                  <div className="inline-block px-2 py-1 bg-red-900 border border-red-500 text-red-400 text-[10px]">
                    {fiftyFiftySelection.leftHalf?.name} / {fiftyFiftySelection.rightHalf?.name}
                  </div>
                  <div className="inline-block px-2 py-1 bg-green-900 border border-green-500 text-green-400 text-[10px]">
                    {fiftyFiftySelection.size} (~2000г | 60см)
                  </div>
                  <div className="inline-block px-2 py-1 bg-orange-900 border border-orange-500 text-orange-400 text-[10px]">
                    {fiftyFiftySelection.finalPrice.toFixed(2)} €.
                  </div>
                </div>

                {/* Addons Selection - Optimized for 702p */}
                <div className="mb-4 bg-gray-900 border border-gray-700 p-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {isLoadingFiftyFiftyAddons ? (
                    <div className="text-center text-gray-400 py-4">
                      Зареждане на добавки...
                    </div>
                  ) : fiftyFiftyAddons && fiftyFiftyAddons.length > 0 ? (
                    <div className="space-y-4">
                      {/* Sauces */}
                      {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'sauce').length > 0 && (
                        <div>
                          <h5 className="text-xs text-white font-medium mb-2">Сосове:</h5>
                          <div className="grid grid-cols-4 gap-2">
                            {fiftyFiftyAddons
                              .filter((addon: any) => addon.AddonType === 'sauce')
                              .map((addon: any) => {
                                const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                
                                return (
                                  <button
                                    key={addon.AddonID}
                                    type="button"
                                    onClick={() => {
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`p-2 border transition-colors duration-200 text-center ${
                                      isSelected
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'
                                    }`}
                                  >
                                    <div className="font-medium text-xs leading-tight">{addon.Name}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-red-400'}`}>
                                      {addon.Price.toFixed(2)} €.
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Vegetables */}
                      {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'vegetable').length > 0 && (
                        <div>
                          <h5 className="text-xs text-white font-medium mb-2">Салати:</h5>
                          <div className="grid grid-cols-4 gap-2">
                            {fiftyFiftyAddons
                              .filter((addon: any) => addon.AddonType === 'vegetable')
                              .map((addon: any) => {
                                const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                
                                return (
                                  <button
                                    key={addon.AddonID}
                                    type="button"
                                    onClick={() => {
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`p-2 border transition-colors duration-200 text-center ${
                                      isSelected
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'
                                    }`}
                                  >
                                    <div className="font-medium text-xs leading-tight">{addon.Name}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-red-400'}`}>
                                      {addon.Price.toFixed(2)} €.
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Meats */}
                      {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'meat').length > 0 && (
                        <div>
                          <h5 className="text-xs text-white font-medium mb-2">Колбаси:</h5>
                          <div className="grid grid-cols-4 gap-2">
                            {fiftyFiftyAddons
                              .filter((addon: any) => addon.AddonType === 'meat')
                              .map((addon: any) => {
                                const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                
                                return (
                                  <button
                                    key={addon.AddonID}
                                    type="button"
                                    onClick={() => {
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`p-2 border transition-colors duration-200 text-center ${
                                      isSelected
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'
                                    }`}
                                  >
                                    <div className="font-medium text-xs leading-tight">{addon.Name}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-red-400'}`}>
                                      {addon.Price.toFixed(2)} €.
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Cheese */}
                      {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'cheese').length > 0 && (
                        <div>
                          <h5 className="text-xs text-white font-medium mb-2">Сирена:</h5>
                          <div className="grid grid-cols-4 gap-2">
                            {fiftyFiftyAddons
                              .filter((addon: any) => addon.AddonType === 'cheese')
                              .map((addon: any) => {
                                const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                
                                return (
                                  <button
                                    key={addon.AddonID}
                                    type="button"
                                    onClick={() => {
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`p-2 border transition-colors duration-200 text-center ${
                                      isSelected
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'
                                    }`}
                                  >
                                    <div className="font-medium text-xs leading-tight">{addon.Name}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-red-400'}`}>
                                      {addon.Price.toFixed(2)} €.
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Pizza Addons */}
                      {fiftyFiftyAddons.filter((addon: any) => addon.AddonType === 'pizza-addon').length > 0 && (
                        <div>
                          <h5 className="text-xs text-white font-medium mb-2">Добавки:</h5>
                          <div className="grid grid-cols-4 gap-2">
                            {fiftyFiftyAddons
                              .filter((addon: any) => addon.AddonType === 'pizza-addon')
                              .map((addon: any) => {
                                const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                
                                return (
                                  <button
                                    key={addon.AddonID}
                                    type="button"
                                    onClick={() => {
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`p-2 border transition-colors duration-200 text-center ${
                                      isSelected
                                        ? 'bg-green-600 border-green-600 text-white'
                                        : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'
                                    }`}
                                  >
                                    <div className="font-medium text-xs leading-tight">{addon.Name}</div>
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-red-400'}`}>
                                      {addon.Price.toFixed(2)} €.
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Няма налични добавки</p>
                    </div>
                  )}
                </div>

                {/* Final Action Buttons - Compact for 702p */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 3 }))}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 text-sm transition-colors duration-200"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={addFiftyFiftyToCart}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 text-sm transition-colors duration-200"
                  >
                    Добави в кошницата
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart - Compact for 702p */}
        <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-2 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white">Поръчка</h2>
          </div>

          {/* Cart Items - Compact for 702p */}
          <div className="flex-1 p-2 overflow-y-auto">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-400 text-center text-sm">Няма избрани продукти</p>
            ) : (
              <div className="space-y-1.5">
                {selectedProducts.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="bg-gray-800 p-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white font-medium text-xs">{product.name}</span>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500 hover:text-red-400 text-base"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-400 text-[10px] mb-0.5">
                      {product.size && product.size !== 'Standard' && (
                        <span>Размер: {product.size} | </span>
                      )}
                      Брой: {product.quantity} x {product.price.toFixed(2)} €
                    </div>
                    {product.comment && (
                      <div className="text-gray-400 text-[10px] mb-0.5">
                        Коментар: {product.comment}
                      </div>
                    )}
                    {product.addons && product.addons.length > 0 && (
                      <div className="text-gray-400 text-[10px] mb-0.5">
                        Добавки: {product.addons.map((addon: any) => addon.name || addon.Name).join(', ')}
                      </div>
                    )}
                    <div className="text-red-500 font-bold text-sm">
                      {calculateItemTotal(product).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer - Compact for 702p */}
          {selectedProducts.length > 0 && (
            <div className="p-2 border-t border-gray-700">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="font-bold text-base">Общо:</span>
                <span className="text-red-500 font-bold text-lg">
                  {calculateTotal().toFixed(2)} €
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowClearModal(true);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs py-1.5 transition-colors duration-200"
                >
                  Изчисти
                </button>
                <button
                  onClick={handleReady}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-1.5 transition-colors duration-200"
                >
                  Готово
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}