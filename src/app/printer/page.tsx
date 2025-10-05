"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer, LogOut, ArrowLeft } from "lucide-react";
import { fetchMenuData } from "@/lib/menuData";

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
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
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
    address: ""
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalData, setProductModalData] = useState<ProductModalData | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [menuData, setMenuData] = useState<{ [key: string]: any[] }>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple authentication - in production, use proper auth
    if (username === "printer" && password === "printer123") {
      setIsAuthenticated(true);
      setCurrentView("categories");
    } else {
      alert("Невалидни данни за вход");
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
      setCurrentView("products");
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Грешка при зареждане на продуктите");
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    // Get the first available size (or use base price if no sizes)
    const firstSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
    const price = firstSize ? firstSize.price : product.basePrice;
    
    setProductModalData({
      product,
      quantity: 1,
      comment: "",
      addons: [],
      selectedSize: firstSize,
      selectedPrice: price
    });
    setShowProductModal(true);
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
        comment: product.comment || ""
      }));

      const response = await fetch('/api/printer/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerInfo,
          orderItems,
          totalPrice: calculateTotal()
        }),
      });

      if (response.ok) {
        alert(`Поръчката е създадена успешно!`);
        // Reset form
        setSelectedProducts([]);
        setCustomerInfo({ name: "", phone: "", address: "" });
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
    } else if (currentView === "categories") {
      setCurrentView("login");
    }
  };

  // Modal renderings - Check these FIRST before any main views
  // Product Modal
  if (showProductModal && productModalData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{productModalData.product.name}</h1>
            <p className="text-red-500 font-bold text-2xl">{productModalData.selectedPrice.toFixed(2)} лв</p>
          </div>
          
          <div className="space-y-6">
            {/* Size Selection */}
            {productModalData.product.sizes && productModalData.product.sizes.length > 0 && (
              <div>
                <label className="block text-white text-lg font-medium mb-3">Размер</label>
                <div className="grid grid-cols-3 gap-2">
                  {productModalData.product.sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setProductModalData(prev => prev ? { 
                        ...prev, 
                        selectedSize: size, 
                        selectedPrice: size.price 
                      } : null)}
                      className={`p-3 border transition-colors duration-200 ${
                        productModalData.selectedSize?.name === size.name
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-gray-900 border-gray-700 text-white hover:border-red-500'
                      }`}
                    >
                      <div className="font-medium">{size.name}</div>
                      <div className="text-sm text-red-400">{size.price.toFixed(2)} лв</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-white text-lg font-medium mb-3">Брой</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setProductModalData(prev => prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null)}
                  className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xl"
                >
                  -
                </button>
                <span className="text-white font-bold text-3xl min-w-[60px] text-center">
                  {productModalData.quantity}
                </span>
                <button
                  onClick={() => setProductModalData(prev => prev ? { ...prev, quantity: prev.quantity + 1 } : null)}
                  className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center text-xl"
                >
                  +
                </button>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-white text-lg font-medium mb-3">Коментар</label>
              <textarea
                value={productModalData.comment}
                onChange={(e) => setProductModalData(prev => prev ? { ...prev, comment: e.target.value } : null)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Добавете коментар..."
                rows={3}
              />
            </div>

            {/* Addons (placeholder for now) */}
            <div>
              <label className="block text-white text-lg font-medium mb-3">Добавки</label>
              <div className="bg-gray-900 border border-gray-700 p-4">
                <p className="text-gray-400 text-center">Добавките ще бъдат добавени скоро</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                setShowProductModal(false);
                setProductModalData(null);
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-4 transition-colors duration-200"
            >
              Отказ
            </button>
            <button
              onClick={handleProductModalSubmit}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-4 transition-colors duration-200"
            >
              Добави
            </button>
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
                Потребителско име
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Въведете потребителско име"
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

  return null;
}