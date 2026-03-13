"use client";

import React, { useEffect, useState } from "react";
import { Settings, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface RestaurantSettingsResponse {
  MinimumOrderAmount?: number;
  ExtendedMinimumOrderAmount?: number;
}

const RestaurantSettingsTab: React.FC = (): React.JSX.Element => {
  const [minimumOrderAmount, setMinimumOrderAmount] = useState<number>(15);
  const [extendedMinimumOrderAmount, setExtendedMinimumOrderAmount] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/restaurant-settings");
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Грешка при зареждане на настройките");
        }

        const data: RestaurantSettingsResponse = await response.json();

        if (typeof data.MinimumOrderAmount === "number") {
          setMinimumOrderAmount(data.MinimumOrderAmount);
        }
        if (typeof data.ExtendedMinimumOrderAmount === "number") {
          setExtendedMinimumOrderAmount(data.ExtendedMinimumOrderAmount);
        }
      } catch (err: any) {
        setError(err.message || "Грешка при зареждане на настройките");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/restaurant-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          MinimumOrderAmount: minimumOrderAmount,
          ExtendedMinimumOrderAmount: extendedMinimumOrderAmount,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Грешка при запазване на настройките");
      }

      setSuccess("Настройките бяха запазени успешно.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Грешка при запазване на настройките");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <span className="ml-3 text-gray-400">Зареждане на настройки...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600/10 via-gray-900 to-red-600/10 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
          <span>Настройки на минималните суми</span>
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm">
          Конфигурирайте минималната сума за поръчка по зони. Тези стойности се използват при checkout и в общите условия.
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

      {/* Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-6">
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
            Минимална сума за поръчка – централна (жълта) зона
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0.01}
              max={500}
              step={0.5}
              value={minimumOrderAmount}
              onChange={(e) => setMinimumOrderAmount(parseFloat(e.target.value) || 0)}
              className="w-full sm:w-48 px-3 py-2 bg-gray-950 border border-gray-700 rounded-2xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <span className="text-gray-300 text-sm sm:text-base">€</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Минимална стойност на поръчката за доставка в централната зона (жълта).
          </p>
        </div>

        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
            Минимална сума за поръчка – разширена (синя) зона
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0.01}
              max={500}
              step={0.5}
              value={extendedMinimumOrderAmount}
              onChange={(e) => setExtendedMinimumOrderAmount(parseFloat(e.target.value) || 0)}
              className="w-full sm:w-48 px-3 py-2 bg-gray-950 border border-gray-700 rounded-2xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <span className="text-gray-300 text-sm sm:text-base">€</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Минимална стойност на поръчката за доставка в разширената зона (синя/далечна).
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm sm:text-base font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSaving ? "Запазване..." : "Запази настройките"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettingsTab;

