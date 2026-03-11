"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Search, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface Order {
  OrderID: number;
  CustomerName: string;
  TotalAmount: number;
  OrderDT: string;
  OrderStatus: string;
}

const DeleteOrdersTab: React.FC = (): React.JSX.Element => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) =>
          order.OrderID.toString().includes(searchTerm) ||
          order.CustomerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("admin_access_token");
      
      if (!token) {
        setError("Не сте автентикирани");
        // Clear auth and redirect to login
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_login_time');
        window.location.href = '/login-admin';
        return;
      }

      const response = await fetch("/api/administraciq/orders", {
        headers: {
          "x-admin-auth": token,
        },
      });

      // Handle unauthorized responses
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_login_time');
        window.location.href = '/login-admin';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Грешка при зареждане на поръчките");
      }

      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || "Грешка при зареждане на поръчките");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`Сигурни ли сте, че искате да изтриете поръчка #${orderId}? Това действие е необратимо!`)) {
      return;
    }

    try {
      setDeletingOrderId(orderId);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem("admin_access_token");
      
      if (!token) {
        setError("Не сте автентикирани");
        // Clear auth and redirect to login
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_login_time');
        window.location.href = '/login-admin';
        return;
      }

      const response = await fetch(`/api/administraciq/orders/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": token,
        },
        body: JSON.stringify({ orderId }),
      });

      // Handle unauthorized responses
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_login_time');
        window.location.href = '/login-admin';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Грешка при изтриване на поръчката");
      }

      setSuccess(`Поръчка #${orderId} беше изтрита успешно`);
      // Remove the deleted order from the list
      setOrders(orders.filter((order) => order.OrderID !== orderId));
      setFilteredOrders(filteredOrders.filter((order) => order.OrderID !== orderId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Грешка при изтриване на поръчката");
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)} €`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("bg-BG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="ml-3 text-gray-400">Зареждане на поръчки...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600/10 via-gray-900 to-red-600/10 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3">
          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
          <span>Изтриване на поръчки</span>
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm">
          Изберете поръчка за изтриване. Внимание: това действие е необратимо!
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-xs sm:text-sm break-words">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300 text-xs sm:text-sm break-words">{success}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Търсене по номер или име..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 sm:p-8 text-center">
          <p className="text-gray-400 text-sm sm:text-base">
            {searchTerm ? "Няма намерени поръчки" : "Няма налични поръчки"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.OrderID}
              className="bg-gray-900 border border-gray-700 rounded-xl p-3 sm:p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Top row: Order ID and Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-gray-400">
                      Поръчка #{order.OrderID}
                    </span>
                    <span className="text-xs px-2 py-0.5 sm:py-1 bg-gray-800 text-gray-300 rounded-lg">
                      {order.OrderStatus}
                    </span>
                  </div>
                  <div className="text-right sm:hidden">
                    <p className="text-xs text-gray-400">Сума</p>
                    <p className="text-base font-bold text-white">{formatPrice(order.TotalAmount)}</p>
                  </div>
                </div>
                
                {/* Customer name and date */}
                <div>
                  <p className="text-white font-medium text-sm sm:text-base mb-1 break-words">{order.CustomerName}</p>
                  <p className="text-xs sm:text-sm text-gray-400">{formatDate(order.OrderDT)}</p>
                </div>
                
                {/* Bottom row: Price and Delete button */}
                <div className="flex items-center justify-between gap-3 sm:gap-4 pt-2 border-t border-gray-800">
                  <div className="text-left hidden sm:block">
                    <p className="text-sm text-gray-400">Обща сума</p>
                    <p className="text-lg font-bold text-white">{formatPrice(order.TotalAmount)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteOrder(order.OrderID)}
                    disabled={deletingOrderId === order.OrderID}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {deletingOrderId === order.OrderID ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Изтриване...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Изтрий</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeleteOrdersTab;
