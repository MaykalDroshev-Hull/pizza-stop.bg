"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Coffee,
  BarChart3,
  LogOut,
  Settings,
  LucideIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { clearAuth } from "@/utils/auth";
import ProductsTab from "./components/ProductsTab";
import AddonsTab from "./components/AddonsTab";
import BeverageTab from "./components/BeverageTab";
import AnalysisTab from "./components/AnalysisTab";
import AddonConfigTab from "./components/AddonConfigTab";

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

const AdminPage = (): React.JSX.Element => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("products");

  // Override body padding for admin page
  React.useEffect(() => {
    // Store original padding
    const originalPadding = document.body.style.paddingTop;

    // Apply custom padding for admin page
    const applyCustomPadding = () => {
      document.body.style.paddingTop = '0px'; // Always 0px for admin page
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

  const tabs: Tab[] = [
    { id: "products", label: "Продукти ", icon: Package },
    { id: "addons", label: "Добавки", icon: Plus },
    { id: "addon-config", label: "Конфиг. добавки", icon: Settings },
    { id: "beverage", label: "Напитки", icon: Coffee },
    { id: "analysis", label: "Анализи", icon: BarChart3 },
  ];

  const renderTabContent = (): React.JSX.Element => {
    switch (activeTab) {
      case "products":
        return <ProductsTab />;
      case "addons":
        return <AddonsTab />;
      case "addon-config":
        return <AddonConfigTab />;
      case "beverage":
        return <BeverageTab />;
      case "analysis":
        return <AnalysisTab />;
      default:
        return <ProductsTab />;
    }
  };

  const handleLogout = (): void => {
    clearAuth();
    router.push('/');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white">
              Административен панел
            </h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black self-start sm:self-auto text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span>Изход</span>
            </button>
          </div>

        {/* Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none border-b border-gray-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white active:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {renderTabContent()}
        </div>

        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;