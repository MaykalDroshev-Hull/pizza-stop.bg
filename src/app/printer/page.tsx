"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer, LogOut, ArrowLeft } from "lucide-react";
import { fetchMenuData, fetchAddons } from "@/lib/menuData";

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
  orderType: number; // 1 = Collection (3BGN), 2 = Delivery (7BGN)
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
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
    orderType: 1, // Default to Pickup (free)
    deliveryPrice: 0
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalData, setProductModalData] = useState<ProductModalData | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [menuData, setMenuData] = useState<{ [key: string]: any[] }>({});
  
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
      console.error('50/50 pizza incomplete selection')
      return
    }

    // Calculate addon cost (first 3 of each type free)
    const addonCost = (fiftyFiftySelection.selectedAddons || [])
      .map((addon: any) => {
        const typeSelected = (fiftyFiftySelection.selectedAddons || []).filter((a: any) => a.AddonType === addon.AddonType)
        const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID)
        return positionInType < 3 ? 0 : addon.Price
      })
      .reduce((sum: number, price: number) => sum + price, 0)

    const leftHalfName = fiftyFiftySelection.leftHalf?.name || 'Unknown'
    const rightHalfName = fiftyFiftySelection.rightHalf?.name || 'Unknown'
    
    const cartItem = {
      id: Date.now(),
      name: `${leftHalfName} / ${rightHalfName}`,
      price: fiftyFiftySelection.finalPrice + addonCost,
      category: 'pizza-5050',
      size: fiftyFiftySelection.size,
      addons: fiftyFiftySelection.selectedAddons,
      comment: `50/50 пица: ${fiftyFiftySelection.leftHalf?.name} / ${fiftyFiftySelection.rightHalf?.name}: ${fiftyFiftySelection.size} (~2000г | 60см)${(fiftyFiftySelection.selectedAddons || []).length > 0 ? ` | ${(fiftyFiftySelection.selectedAddons || []).length} добавки` : ''}`,
      quantity: 1
    }

    setSelectedProducts(prev => [...prev, cartItem])
    resetFiftyFiftySelection()
    console.log('50/50 пица добавена в кошницата:', cartItem)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      if (response.ok && result.success) {
        setIsAuthenticated(true);
        setCurrentView("categories");
      } else {
        alert("Невалидни данни за вход");
      }
    } catch (error) {
      console.error('Printer login error:', error);
      alert("Грешка при влизане");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView("login");
    setUsername("");
    setPassword("");
    setSelectedProducts([]);
  };

  // Load menu data on component mount
  useEffect(() => {
    async function loadMenuData() {
      try {
        const data = await fetchMenuData();
        setMenuData(data);
      } catch (error) {
        console.error("Error loading menu data:", error);
      }
    }
    loadMenuData();
  }, []);

  const categories: Category[] = [
    { id: "pizza", name: "Пици", emoji: "" },
    { id: "pizza-5050", name: "Пица 50/50", emoji: "" },
    { id: "doners", name: "Дюнери", emoji: "" },
    { id: "burgers", name: "Бургери", emoji: "" },
    { id: "drinks", name: "Напитки", emoji: "" },
    { id: "sauces", name: "Добавки и Сосове", emoji: "" },
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
          setProducts(categoryProducts);
          setCurrentView("pizza-5050");
          setLoading(false);
          return; // Exit early for 50/50
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
      setCurrentView("products");
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Грешка при зареждане на продуктите");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product: Product) => {
    // Get the first available size (or use base price if no sizes)
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
    
    // Load addons based on product category
    try {
      let addons: any[] = [];
      
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
    } catch (error) {
      console.error('Error loading addons:', error);
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

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const handleReady = () => {
    console.log('Ready button clicked, selectedProducts:', selectedProducts.length);
    if (selectedProducts.length === 0) {
      alert("Моля изберете поне един продукт");
      return;
    }
    console.log('Setting showCustomerForm to true');
    setShowCustomerForm(true);
  };

  const handleCustomerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert("Моля попълнете всички полета");
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
        size: product.size || 'Standard'
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
        // Reset form
        setSelectedProducts([]);
        setCustomerInfo({ 
          name: "", 
          phone: "", 
          address: "",
          orderType: 1,
          deliveryPrice: 3
        });
        setCurrentView("categories");
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
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
    return (
      <div className="min-h-screen bg-black p-3 md:p-4 overflow-y-auto">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-3 md:mb-4">
            <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{productModalData.product.name}</h1>
            <p className="text-red-500 font-bold text-lg md:text-2xl">{productModalData.selectedPrice.toFixed(2)} лв</p>
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
                        <div className="text-xs text-red-400">{size.price.toFixed(2)} лв</div>
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
              <label className="block text-white text-base md:text-lg font-medium mb-2">Добавки</label>
              <div className="bg-gray-900 border border-gray-700 p-2 md:p-3 max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)] overflow-y-auto">
                {productModalData.isLoadingAddons ? (
                  <p className="text-gray-400 text-center py-6">Зареждане на добавки...</p>
                ) : productModalData.availableAddons.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
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
                          <h5 className="text-xs md:text-sm text-white font-medium mb-2">{typeNames[addonType]}:</h5>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {typeAddons.map((addon: any) => {
                              const isSelected = productModalData.addons.some((a: any) => a.AddonID === addon.AddonID);
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
                                  className={`p-2 md:p-3 border transition-colors duration-200 text-left ${
                                    isSelected
                                      ? 'bg-green-600 border-green-600 text-white'
                                      : 'bg-gray-800 border-gray-600 text-white hover:border-green-500'
                                  }`}
                                >
                                  <div className="font-medium text-xs md:text-sm leading-tight">{addon.Name}</div>
                                  <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-red-400'}`}>
                                    {addon.Price.toFixed(2)} лв.
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
  console.log('Modal states:', { showClearModal, showCustomerForm, showProductModal });
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
  console.log('Checking customer form modal, showCustomerForm:', showCustomerForm);
  if (showCustomerForm) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Данни за клиента</h1>
            <p className="text-gray-400">Попълнете информацията за поръчката</p>
          </div>
          
          <form onSubmit={handleCustomerFormSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-lg font-medium mb-3">
                Име *
              </label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                placeholder="Въведете име"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-lg font-medium mb-3">
                Телефон *
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                placeholder="Въведете телефон"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-lg font-medium mb-3">
                Адрес *
              </label>
              <input
                type="text"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                placeholder="Въведете адрес"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-lg font-medium mb-3">
                Тип на поръчка *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setCustomerInfo(prev => ({ ...prev, orderType: 1, deliveryPrice: 0 }))}
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
                  onClick={() => setCustomerInfo(prev => ({ ...prev, orderType: 2, deliveryPrice: 3 }))}
                  className={`p-4 border transition-colors duration-200 ${
                    customerInfo.orderType === 2 && customerInfo.deliveryPrice === 3
                      ? 'bg-yellow-600 border-yellow-600 text-white'
                      : 'bg-gray-900 border-gray-700 text-white hover:border-yellow-500'
                  }`}
                >
                  <div className="font-bold text-xl">Доставка</div>
                  <div className="text-sm mt-1">Жълта - 3 BGN</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerInfo(prev => ({ ...prev, orderType: 2, deliveryPrice: 7 }))}
                  className={`p-4 border transition-colors duration-200 ${
                    customerInfo.orderType === 2 && customerInfo.deliveryPrice === 7
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-900 border-gray-700 text-white hover:border-blue-500'
                  }`}
                >
                  <div className="font-bold text-xl">Доставка</div>
                  <div className="text-sm mt-1">Синя - 7 BGN</div>
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
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
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || currentView === "login") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Printer className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Принтер</h1>
            <p className="text-gray-400">Вход за персонал</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Имейл адрес
              </label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Въведете имейл адрес"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Парола
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Въведете парола"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-2xl transition-colors duration-200"
            >
              Вход
            </button>
          </form>
          
          <div className="text-center mt-6">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              ← Назад към сайта
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "categories") {
    return (
      <div className="min-h-screen bg-black w-full flex">
        {/* Left Side - Categories */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={goBack}
                  className="p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors duration-200"
                >
                  <ArrowLeft className="w-8 h-8 text-white" />
                </button>
                <h1 className="text-4xl font-bold text-white">Избери категория</h1>
              </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Изход</span>
            </button>
          </div>

          {/* Categories Grid - Full Width */}
          <div className="flex-1 grid grid-cols-5 gap-4 p-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-red-500 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 group p-6 min-h-[120px]"
              >
                <span className="text-white font-medium text-xl text-center leading-tight">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Поръчка</h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-400 text-center">Няма избрани продукти</p>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="bg-gray-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-lg">{product.name}</span>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500 hover:text-red-400 text-xl"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-400 text-sm mb-1">
                      {product.size && product.size !== 'Standard' && (
                        <span>Размер: {product.size} | </span>
                      )}
                      Брой: {product.quantity} x {product.price.toFixed(2)} лв
                    </div>
                    {product.comment && (
                      <div className="text-gray-400 text-sm mb-1">
                        Коментар: {product.comment}
                      </div>
                    )}
                    {product.addons && product.addons.length > 0 && (
                      <div className="text-gray-400 text-sm mb-1">
                        Добавки: {product.addons.map((addon: any) => addon.name || addon.Name).join(', ')}
                      </div>
                    )}
                    <div className="text-red-500 font-bold text-lg">
                      {(product.price * product.quantity).toFixed(2)} лв
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {selectedProducts.length > 0 && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between text-white mb-4">
                <span className="font-bold text-xl">Общо:</span>
                <span className="text-red-500 font-bold text-2xl">
                  {calculateTotal().toFixed(2)} лв
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('Clear button clicked');
                    setShowClearModal(true);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 transition-colors duration-200"
                >
                  Clear
                </button>
                <button
                  onClick={handleReady}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 transition-colors duration-200"
                >
                  Ready
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === "products") {
    return (
      <div className="min-h-screen bg-black w-full flex">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors duration-200"
              >
                <ArrowLeft className="w-8 h-8 text-white" />
              </button>
              <h1 className="text-4xl font-bold text-white">
                {categories.find(cat => cat.id === selectedCategory)?.name || "Продукти"}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Изход</span>
            </button>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white text-xl">Зареждане...</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-5 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-red-500 p-4 flex flex-col items-center justify-center transition-all duration-200 min-h-[200px]"
                >
                  <span className="text-white font-medium text-center text-lg mb-2 leading-tight">
                    {product.name}
                  </span>
                  <span className="text-red-500 font-bold text-xl">
                    {product.basePrice.toFixed(2)} лв
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Поръчка</h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-400 text-center">Няма избрани продукти</p>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="bg-gray-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-lg">{product.name}</span>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500 hover:text-red-400 text-xl"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-400 text-sm mb-1">
                      {product.size && product.size !== 'Standard' && (
                        <span>Размер: {product.size} | </span>
                      )}
                      Брой: {product.quantity} x {product.price.toFixed(2)} лв
                    </div>
                    {product.comment && (
                      <div className="text-gray-400 text-sm mb-1">
                        Коментар: {product.comment}
                      </div>
                    )}
                    {product.addons && product.addons.length > 0 && (
                      <div className="text-gray-400 text-sm mb-1">
                        Добавки: {product.addons.map((addon: any) => addon.name || addon.Name).join(', ')}
                      </div>
                    )}
                    <div className="text-red-500 font-bold text-lg">
                      {(product.price * product.quantity).toFixed(2)} лв
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {selectedProducts.length > 0 && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between text-white mb-4">
                <span className="font-bold text-xl">Общо:</span>
                <span className="text-red-500 font-bold text-2xl">
                  {calculateTotal().toFixed(2)} лв
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('Clear button clicked');
                    setShowClearModal(true);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 transition-colors duration-200"
                >
                  Clear
                </button>
                <button
                  onClick={handleReady}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 transition-colors duration-200"
                >
                  Ready
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
      <div className="min-h-screen bg-black w-full flex">
        {/* Left Side - 50/50 Selection */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-colors duration-200"
              >
                <ArrowLeft className="w-8 h-8 text-white" />
              </button>
              <h1 className="text-4xl font-bold text-white">Пица 50/50</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Изход</span>
            </button>
          </div>

          {/* 50/50 Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Step 1: Size Selection */}
            {fiftyFiftySelection.step === 1 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Избери размер на пицата</h3>
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <button
                    onClick={() => {
                      setFiftyFiftySelection(prev => ({
                        ...prev,
                        size: 'Голяма',
                        step: 2
                      }))
                    }}
                    className="p-6 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-red-500 transition-all"
                  >
                    <div className="text-xl font-bold text-white mb-2">Голяма</div>
                    <div className="text-sm text-gray-400">~2000г | 60см</div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Left Half Selection */}
            {fiftyFiftySelection.step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 1 }))}
                    className="text-white hover:text-red-500 transition-colors"
                  >
                    ← Назад
                  </button>
                  <h3 className="text-2xl font-bold text-white">Избери лявата половина</h3>
                  <div className="w-20"></div>
                </div>
                
                <div className="mb-4">
                  <div className="inline-block px-4 py-2 bg-red-900 border border-red-500 text-red-400">
                    Размер: {fiftyFiftySelection.size} (~2000г | 60см)
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
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
                      className={`p-4 transition-all ${
                        fiftyFiftySelection.leftHalf?.id === pizza.id 
                          ? 'bg-green-900 border-2 border-green-500' 
                          : 'bg-gray-900 border border-gray-700 hover:border-red-500'
                      }`}
                    >
                      <div className="text-white font-medium text-center text-sm mb-2 leading-tight line-clamp-2">
                        {pizza.name}
                      </div>
                      <div className="text-red-500 font-bold text-lg text-center">
                        {getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} лв.
                      </div>
                      {fiftyFiftySelection.leftHalf?.id === pizza.id && (
                        <div className="text-green-400 text-xs text-center mt-2">✓ ЛЯВА</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Right Half Selection */}
            {fiftyFiftySelection.step === 3 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 2, rightHalf: null }))}
                    className="text-white hover:text-red-500 transition-colors"
                  >
                    ← Назад
                  </button>
                  <h3 className="text-2xl font-bold text-white">Избери дясната половина</h3>
                  <div className="w-20"></div>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="inline-block px-4 py-2 bg-red-900 border border-red-500 text-red-400">
                    Размер: {fiftyFiftySelection.size}
                  </div>
                  <div className="inline-block px-4 py-2 bg-green-900 border border-green-500 text-green-400">
                    Лява: {fiftyFiftySelection.leftHalf?.name}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
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
                      className={`p-4 transition-all ${
                        pizza.id === fiftyFiftySelection.leftHalf?.id 
                          ? 'bg-gray-700 border-2 border-gray-500' 
                          : fiftyFiftySelection.rightHalf?.id === pizza.id
                            ? 'bg-red-900 border-2 border-red-500'
                            : 'bg-gray-900 border border-gray-700 hover:border-red-500'
                      }`}
                    >
                      <div className="text-white font-medium text-center text-sm mb-2 leading-tight line-clamp-2">
                        {pizza.name}
                      </div>
                      <div className="text-red-500 font-bold text-lg text-center">
                        {getPriceForSize(pizza, fiftyFiftySelection.size).toFixed(2)} лв.
                      </div>
                      {pizza.id === fiftyFiftySelection.leftHalf?.id && (
                        <div className="text-gray-400 text-xs text-center mt-2">ЛЯВА</div>
                      )}
                      {fiftyFiftySelection.rightHalf?.id === pizza.id && (
                        <div className="text-red-400 text-xs text-center mt-2">✓ ДЯСНА</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Addons Selection */}
            {fiftyFiftySelection.step === 4 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 3 }))}
                    className="text-white hover:text-red-500 transition-colors"
                  >
                    ← Назад
                  </button>
                  <h3 className="text-2xl font-bold text-white">Избери добавки</h3>
                  <div className="w-20"></div>
                </div>
                
                <div className="flex gap-4 mb-6">
                  <div className="inline-block px-4 py-2 bg-red-900 border border-red-500 text-red-400">
                    {fiftyFiftySelection.leftHalf?.name} / {fiftyFiftySelection.rightHalf?.name}
                  </div>
                  <div className="inline-block px-4 py-2 bg-green-900 border border-green-500 text-green-400">
                    {fiftyFiftySelection.size} (~2000г | 60см)
                  </div>
                  <div className="inline-block px-4 py-2 bg-orange-900 border border-orange-500 text-orange-400">
                    {fiftyFiftySelection.finalPrice.toFixed(2)} лв.
                  </div>
                </div>

                {/* Addons Selection */}
                <div className="mb-8">
                  {menuData.pizza?.[0]?.addons && menuData.pizza[0].addons.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-400 mb-4">
                        💡 Първите 3 соса са безплатни, първите 3 салати са безплатни.
                      </p>
                      
                      {/* Sauces */}
                      {menuData.pizza[0].addons.filter((addon: any) => addon.AddonType === 'sauce').length > 0 && (
                        <div className="mb-6">
                          <h5 className="text-sm text-gray-400 mb-2">Сосове:</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {menuData.pizza[0].addons
                              .filter((addon: any) => addon.AddonType === 'sauce')
                              .map((addon: any) => {
                                const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                const typeSelected = (fiftyFiftySelection.selectedAddons || []).filter((a: any) => a.AddonType === addon.AddonType)
                                const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID)
                                const isFree = typeSelected.length < 3 || (isSelected && positionInType < 3)
                                
                                return (
                                  <button
                                    key={addon.AddonID}
                                    onClick={() => {
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`p-3 border transition-all ${
                                      isSelected
                                        ? 'border-green-500 bg-green-900 text-green-400'
                                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                                    }`}
                                  >
                                    <div className="font-medium text-sm">{addon.Name}</div>
                                    <div className={`text-xs mt-1 ${isFree ? 'text-green-400' : 'text-red-400'}`}>
                                      {isFree ? 'Безплатно' : `${addon.Price.toFixed(2)} лв.`}
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Vegetables */}
                      {menuData.pizza[0].addons.filter((addon: any) => addon.AddonType === 'vegetable').length > 0 && (
                        <div>
                          <h5 className="text-sm text-gray-400 mb-2">Салати:</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {menuData.pizza[0].addons
                              .filter((addon: any) => addon.AddonType === 'vegetable')
                              .map((addon: any) => {
                                const isSelected = (fiftyFiftySelection.selectedAddons || []).some((a: any) => a.AddonID === addon.AddonID)
                                const typeSelected = (fiftyFiftySelection.selectedAddons || []).filter((a: any) => a.AddonType === addon.AddonType)
                                const positionInType = typeSelected.findIndex((a: any) => a.AddonID === addon.AddonID)
                                const isFree = typeSelected.length < 3 || (isSelected && positionInType < 3)
                                
                                return (
                                  <button
                                    key={addon.AddonID}
                                    onClick={() => {
                                      setFiftyFiftySelection(prev => ({
                                        ...prev,
                                        selectedAddons: isSelected
                                          ? prev.selectedAddons.filter((a: any) => a.AddonID !== addon.AddonID)
                                          : [...prev.selectedAddons, addon]
                                      }))
                                    }}
                                    className={`p-3 border transition-all ${
                                      isSelected
                                        ? 'border-green-500 bg-green-900 text-green-400'
                                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                                    }`}
                                  >
                                    <div className="font-medium text-sm">{addon.Name}</div>
                                    <div className={`text-xs mt-1 ${isFree ? 'text-green-400' : 'text-red-400'}`}>
                                      {isFree ? 'Безплатно' : `${addon.Price.toFixed(2)} лв.`}
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

                {/* Final Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setFiftyFiftySelection(prev => ({ ...prev, step: 3 }))}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 transition-colors duration-200"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={addFiftyFiftyToCart}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-4 transition-colors duration-200"
                  >
                    Добави в кошницата
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart (Same as categories and products view) */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Поръчка</h2>
          </div>

          {/* Cart Items */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-400 text-center">Няма избрани продукти</p>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map((product, index) => (
                  <div key={`${product.id}-${index}`} className="bg-gray-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-lg">{product.name}</span>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-500 hover:text-red-400 text-xl"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-gray-400 text-sm mb-1">
                      {product.size && product.size !== 'Standard' && (
                        <span>Размер: {product.size} | </span>
                      )}
                      Брой: {product.quantity} x {product.price.toFixed(2)} лв
                    </div>
                    {product.comment && (
                      <div className="text-gray-400 text-sm mb-1">
                        Коментар: {product.comment}
                      </div>
                    )}
                    {product.addons && product.addons.length > 0 && (
                      <div className="text-gray-400 text-sm mb-1">
                        Добавки: {product.addons.map((addon: any) => addon.name || addon.Name).join(', ')}
                      </div>
                    )}
                    <div className="text-red-500 font-bold text-lg">
                      {(product.price * product.quantity).toFixed(2)} лв
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {selectedProducts.length > 0 && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between text-white mb-4">
                <span className="font-bold text-xl">Общо:</span>
                <span className="text-red-500 font-bold text-2xl">
                  {calculateTotal().toFixed(2)} лв
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('Clear button clicked');
                    setShowClearModal(true);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 transition-colors duration-200"
                >
                  Clear
                </button>
                <button
                  onClick={handleReady}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 transition-colors duration-200"
                >
                  Ready
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