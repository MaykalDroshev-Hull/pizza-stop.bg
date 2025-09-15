"use client";

import { useState } from "react";
import { 
  Package, 
  Plus, 
  Coffee, 
  BarChart3,
  LucideIcon
} from "lucide-react";
import ProductsTab from "./components/ProductsTab";
import AddonsTab from "./components/AddonsTab";
import BeverageTab from "./components/BeverageTab";
import AnalysisTab from "./components/AnalysisTab";
import ReviewManagement from "./components/ReviewManagement";

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

const AdminPage = (): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<string>("products");

  const tabs: Tab[] = [
    { id: "products", label: "Продукти ", icon: Package },
    { id: "addons", label: "Добавки", icon: Plus },
    { id: "beverage", label: "Напитки", icon: Coffee },
    { id: "analysis", label: "Анализи", icon: BarChart3 },
  ];

  const renderTabContent = (): React.JSX.Element => {
    switch (activeTab) {
      case "products":
        return <ProductsTab />;
      case "addons":
        return <AddonsTab />;
      case "beverage":
        return <BeverageTab />;
      case "analysis":
        return <AnalysisTab />;
      default:
        return <ProductsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Административен панел
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 border-b border-gray-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                      : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
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

        {/* Review Management */}
        <ReviewManagement />
      </div>
    </div>
  );
};

export default AdminPage;
