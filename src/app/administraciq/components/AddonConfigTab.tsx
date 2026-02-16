"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Link2,
  Search,
  CheckCircle,
  AlertCircle,
  Edit,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DatabaseAddon,
  AssignableProduct,
  getAddonsClient,
  upsertAddonClient,
  setAddonDisabledClient,
  deleteAddonsClient,
  getProductsForAssignment,
  getAllAddonAssignmentsClient,
  setProductsForAddonClient,
} from "../services/addonService.client";

// ─── Constants ───

const ADDON_TYPES = [
  { value: "sauce", label: "Сос" },
  { value: "vegetable", label: "Салата" },
  { value: "meat", label: "Колбас" },
  { value: "cheese", label: "Сирене" },
  { value: "pizza-addon", label: "Пица добавка" },
];

const ADDON_TYPE_LABELS: { [key: string]: string } = {
  sauce: "Сос",
  vegetable: "Салата",
  meat: "Колбас",
  cheese: "Сирене",
  "pizza-addon": "Пица добавка",
};

const PRODUCT_TYPE_NAMES: { [key: number]: string } = {
  1: "Пица",
  2: "Бургер",
  3: "Дюнер",
  4: "Напитка",
  5: "Сос",
  6: "Добавка",
  7: "Панини",
  9: "Пица",
};

// ─── Interfaces ───

interface FlashMessage {
  id: string;
  type: "success" | "error";
  message: string;
}

interface AddAddonForm {
  name: string;
  price: string;
  addonType: string;
  sortOrder: string;
  sizeCategory: string;
}

const emptyForm: AddAddonForm = {
  name: "",
  price: "",
  addonType: "sauce",
  sortOrder: "0",
  sizeCategory: "",
};

const PIZZA_ADDON_TYPES = ["meat", "cheese", "pizza-addon"];

const SIZE_CATEGORIES = [
  { value: "", label: "Няма (не е пица добавка)" },
  { value: "small", label: "Малка пица" },
  { value: "large", label: "Голяма пица" },
];

// Автоматично определяне на ProductTypeID от AddonType
const ADDON_TYPE_TO_PRODUCT_TYPE: { [key: string]: number } = {
  sauce: 5,
  vegetable: 6,
  meat: 1,
  cheese: 1,
  "pizza-addon": 1,
};

// ─── Component ───

const AddonConfigTab = (): React.JSX.Element => {
  // State
  const [addons, setAddons] = useState<DatabaseAddon[]>([]);
  const [products, setProducts] = useState<AssignableProduct[]>([]);
  const [assignments, setAssignments] = useState<{
    [addonId: number]: number[];
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [flashMessages, setFlashMessages] = useState<FlashMessage[]>([]);

  // Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddAddonForm>(emptyForm);
  const [editingAddonId, setEditingAddonId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Assignment modal
  const [assignModalAddonId, setAssignModalAddonId] = useState<number | null>(
    null
  );
  const [assignModalProductIds, setAssignModalProductIds] = useState<number[]>(
    []
  );
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDisabled, setFilterDisabled] = useState<
    "" | "enabled" | "disabled"
  >("");

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({
    sauce: true,
    vegetable: true,
    meat: true,
    cheese: true,
    "pizza-addon": true,
  });

  // ─── Flash messages ───

  const addFlash = useCallback(
    (type: "success" | "error", message: string) => {
      const id = Date.now().toString();
      setFlashMessages((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setFlashMessages((prev) => prev.filter((m) => m.id !== id)),
        4000
      );
    },
    []
  );

  // ─── Data loading ───

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [addonData, productData, assignmentData] = await Promise.all([
        getAddonsClient(),
        getProductsForAssignment(),
        getAllAddonAssignmentsClient(),
      ]);
      setAddons(addonData);
      setProducts(productData);
      setAssignments(assignmentData);
    } catch (err: any) {
      addFlash("error", `Грешка при зареждане: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [addFlash]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── CRUD handlers ───

  const handleSaveAddon = async () => {
    if (!form.name.trim()) {
      addFlash("error", "Името е задължително");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      addFlash("error", "Невалидна цена");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<DatabaseAddon> = {
        Name: form.name.trim(),
        Price: price,
        AddonType: form.addonType,
        ProductTypeID: ADDON_TYPE_TO_PRODUCT_TYPE[form.addonType] || 5,
        SortOrder: parseInt(form.sortOrder) || 0,
        SizeCategory: PIZZA_ADDON_TYPES.includes(form.addonType) && form.sizeCategory
          ? form.sizeCategory
          : null,
      };

      if (editingAddonId) {
        payload.AddonID = editingAddonId;
      }

      await upsertAddonClient(payload);
      addFlash(
        "success",
        editingAddonId
          ? `Добавката "${form.name}" е обновена`
          : `Добавката "${form.name}" е създадена`
      );
      setShowAddForm(false);
      setForm(emptyForm);
      setEditingAddonId(null);
      await loadData();
    } catch (err: any) {
      addFlash("error", `Грешка: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAddon = (addon: DatabaseAddon) => {
    setForm({
      name: addon.Name,
      price: addon.Price.toString(),
      addonType: addon.AddonType || "sauce",
      sortOrder: (addon.SortOrder || 0).toString(),
      sizeCategory: addon.SizeCategory || "",
    });
    setEditingAddonId(addon.AddonID!);
    setShowAddForm(true);
  };

  const handleToggleDisabled = async (addon: DatabaseAddon) => {
    try {
      const newState = addon.IsDisabled === 1 ? false : true;
      await setAddonDisabledClient(addon.AddonID!, newState);
      addFlash(
        "success",
        `"${addon.Name}" е ${newState ? "скрита" : "показана"}`
      );
      await loadData();
    } catch (err: any) {
      addFlash("error", `Грешка: ${err.message}`);
    }
  };

  const handleDeleteAddon = async (addon: DatabaseAddon) => {
    if (
      !confirm(`Сигурни ли сте, че искате да изтриете "${addon.Name}"?`)
    )
      return;
    try {
      await deleteAddonsClient([addon.AddonID!]);
      addFlash("success", `"${addon.Name}" е изтрита`);
      await loadData();
    } catch (err: any) {
      addFlash("error", `Грешка: ${err.message}`);
    }
  };

  // ─── Assignment modal handlers ───

  const openAssignModal = (addon: DatabaseAddon) => {
    setAssignModalAddonId(addon.AddonID!);
    setAssignModalProductIds(assignments[addon.AddonID!] || []);
    setAssignSearchQuery("");
  };

  const toggleProductAssignment = (productId: number) => {
    setAssignModalProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllInType = (typeId: number) => {
    const typeProducts = products
      .filter((p) => p.ProductTypeID === typeId)
      .map((p) => p.ProductID);
    setAssignModalProductIds((prev) => {
      const withoutType = prev.filter(
        (id) => !typeProducts.includes(id)
      );
      return [...withoutType, ...typeProducts];
    });
  };

  const deselectAllInType = (typeId: number) => {
    const typeProducts = products
      .filter((p) => p.ProductTypeID === typeId)
      .map((p) => p.ProductID);
    setAssignModalProductIds((prev) =>
      prev.filter((id) => !typeProducts.includes(id))
    );
  };

  const handleSaveAssignment = async () => {
    if (!assignModalAddonId) return;
    setIsSavingAssignment(true);
    try {
      await setProductsForAddonClient(
        assignModalAddonId,
        assignModalProductIds
      );
      addFlash(
        "success",
        `Присвояването е запазено (${assignModalProductIds.length} продукта)`
      );
      setAssignModalAddonId(null);
      await loadData();
    } catch (err: any) {
      addFlash("error", `Грешка: ${err.message}`);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // ─── Filtering ───

  const filteredAddons = addons.filter((addon) => {
    if (filterType && addon.AddonType !== filterType) return false;
    if (
      filterSearch &&
      !addon.Name.toLowerCase().includes(filterSearch.toLowerCase())
    )
      return false;
    if (filterDisabled === "enabled" && addon.IsDisabled === 1) return false;
    if (filterDisabled === "disabled" && addon.IsDisabled !== 1) return false;
    return true;
  });

  // Group by AddonType
  const groupedAddons: { [type: string]: DatabaseAddon[] } = {};
  filteredAddons.forEach((addon) => {
    const type = addon.AddonType || "sauce";
    if (!groupedAddons[type]) groupedAddons[type] = [];
    groupedAddons[type].push(addon);
  });

  // ─── Products grouped by type for assignment modal ───

  const getProductsByType = () => {
    const grouped: { [typeId: number]: AssignableProduct[] } = {};
    const filteredProducts = products.filter(
      (p) =>
        !assignSearchQuery ||
        p.Product.toLowerCase().includes(assignSearchQuery.toLowerCase())
    );
    filteredProducts.forEach((p) => {
      if (!grouped[p.ProductTypeID]) grouped[p.ProductTypeID] = [];
      grouped[p.ProductTypeID].push(p);
    });
    return grouped;
  };

  const assignModalAddon = addons.find(
    (a) => a.AddonID === assignModalAddonId
  );

  // ─── Render ───

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-400">Зареждане на добавки...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Flash Messages */}
      {flashMessages.length > 0 && (
        <div className="space-y-2">
          {flashMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm ${
                msg.type === "success"
                  ? "bg-green-600/20 border border-green-600 text-green-400"
                  : "bg-red-600/20 border border-red-600 text-red-400"
              }`}
            >
              {msg.type === "success" ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="line-clamp-2">{msg.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Конфигурация на добавки
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Управлявайте добавките за пица, бургери и дюнери. Общо:{" "}
            {addons.length} добавки
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingAddonId(null);
            setShowAddForm(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-2xl transition-colors text-sm w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Нова добавка</span>
          <span className="sm:hidden">Нова</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Търси по име..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 sm:px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">Всички типове</option>
            {ADDON_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filterDisabled}
            onChange={(e) =>
              setFilterDisabled(e.target.value as "" | "enabled" | "disabled")
            }
            className="px-3 sm:px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">Всички</option>
            <option value="enabled">Активни</option>
            <option value="disabled">Скрити</option>
          </select>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {editingAddonId ? "Редактирай добавка" : "Нова добавка"}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddonId(null);
                }}
                className="text-gray-400 hover:text-white p-1 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Име *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                  placeholder="Напр. Кетчуп"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Цена (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Подредба
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Тип добавка *
                </label>
                <select
                  value={form.addonType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, addonType: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                >
                  {ADDON_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              {PIZZA_ADDON_TYPES.includes(form.addonType) && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Размер пица *
                  </label>
                  <select
                    value={form.sizeCategory}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sizeCategory: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-green-500"
                  >
                    {SIZE_CATEGORIES.map((sc) => (
                      <option key={sc.value} value={sc.value}>
                        {sc.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Определя за кой размер пица е тази добавка
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddonId(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-2xl transition-colors text-sm"
              >
                Отказ
              </button>
              <button
                onClick={handleSaveAddon}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-2xl transition-colors disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Запазване..." : "Запази"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Addon Groups */}
      {Object.keys(groupedAddons).length === 0 ? (
        <div className="text-center py-12 sm:py-16 text-gray-400">
          <div className="text-4xl mb-4">🍶</div>
          <p>Няма намерени добавки</p>
        </div>
      ) : (
        Object.entries(groupedAddons).map(([type, typeAddons]) => (
          <div
            key={type}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden"
          >
            {/* Group header */}
            <button
              onClick={() =>
                setExpandedGroups((prev) => ({
                  ...prev,
                  [type]: !prev[type],
                }))
              }
              className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-800/50 active:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {ADDON_TYPE_LABELS[type] || type}
                </h3>
                <span className="text-xs sm:text-sm text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                  {typeAddons.length}
                </span>
              </div>
              {expandedGroups[type] ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Group content */}
            {expandedGroups[type] && (
              <div className="px-3 sm:px-6 pb-3 sm:pb-4">
                <div className="grid gap-2 sm:gap-3">
                  {typeAddons.map((addon) => {
                    const assignedCount =
                      (assignments[addon.AddonID!] || []).length;
                    const isDisabled = addon.IsDisabled === 1;

                    return (
                      <div
                        key={addon.AddonID}
                        className={`p-3 sm:p-4 rounded-xl border transition-all ${
                          isDisabled
                            ? "bg-gray-800/30 border-gray-700/50 opacity-60"
                            : "bg-gray-800/60 border-gray-700"
                        }`}
                      >
                        {/* Mobile: stacked layout / Desktop: row layout */}
                        <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
                          {/* Addon info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
                                {addon.Name}
                              </span>
                              {isDisabled && (
                                <span className="text-xs bg-red-600/30 text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  Скрита
                                </span>
                              )}
                              {addon.SizeCategory && (
                                <span className="text-xs text-yellow-400 bg-yellow-600/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  {addon.SizeCategory === 'small' ? 'Малка' : 'Голяма'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-400 flex-wrap">
                              <span className="text-green-400 font-medium">
                                {addon.Price.toFixed(2)} €
                              </span>
                              <span className="hidden sm:inline">ИД: {addon.AddonID}</span>
                              <span className="hidden sm:inline">Подредба: {addon.SortOrder || 0}</span>
                            </div>
                          </div>

                          {/* Actions — always visible in a row */}
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Product assignment */}
                            <button
                              onClick={() => openAssignModal(addon)}
                              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-1.5 bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 text-blue-400 border border-blue-600/30 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-colors min-h-[36px] sm:min-h-0"
                              title="Присвои към продукти"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>{assignedCount}</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleEditAddon(addon)}
                              className="p-2 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                              title="Редактирай"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Toggle visibility */}
                            <button
                              onClick={() => handleToggleDisabled(addon)}
                              className={`p-2 sm:p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                                isDisabled
                                  ? "text-red-400 hover:text-green-400 hover:bg-green-600/10 active:bg-green-600/20"
                                  : "text-green-400 hover:text-red-400 hover:bg-red-600/10 active:bg-red-600/20"
                              }`}
                              title={
                                isDisabled ? "Покажи добавката" : "Скрий добавката"
                              }
                            >
                              {isDisabled ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteAddon(addon)}
                              className="p-2 sm:p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/10 active:bg-red-600/20 rounded-lg transition-colors min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                              title="Изтрий"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Product Assignment Modal */}
      {assignModalAddonId && assignModalAddon && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Присвояване на продукти
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 truncate">
                  Добавка: &quot;{assignModalAddon.Name}&quot; — Избрани:{" "}
                  {assignModalProductIds.length}
                </p>
              </div>
              <button
                onClick={() => setAssignModalAddonId(null)}
                className="text-gray-400 hover:text-white p-1 -mr-1 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  placeholder="Търси продукт..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-4 overscroll-contain">
              {Object.entries(getProductsByType()).map(
                ([typeIdStr, typeProducts]) => {
                  const typeId = parseInt(typeIdStr);
                  const typeName =
                    PRODUCT_TYPE_NAMES[typeId] || `Тип ${typeId}`;
                  const allSelected = typeProducts.every((p) =>
                    assignModalProductIds.includes(p.ProductID)
                  );

                  return (
                    <div key={typeId}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-300 uppercase">
                          {typeName} ({typeProducts.length})
                        </h4>
                        <button
                          onClick={() =>
                            allSelected
                              ? deselectAllInType(typeId)
                              : selectAllInType(typeId)
                          }
                          className="text-xs text-blue-400 hover:text-blue-300 active:text-blue-200 transition-colors px-2 py-1 -mr-2"
                        >
                          {allSelected
                            ? "Премахни всички"
                            : "Избери всички"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {typeProducts.map((product) => {
                          const isSelected = assignModalProductIds.includes(
                            product.ProductID
                          );
                          return (
                            <button
                              key={product.ProductID}
                              onClick={() =>
                                toggleProductAssignment(product.ProductID)
                              }
                              className={`flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl border text-sm text-left transition-all min-h-[44px] sm:min-h-0 ${
                                isSelected
                                  ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                  : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500 active:bg-gray-800"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 sm:w-4 sm:h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-500"
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-white" />
                                )}
                              </div>
                              <span className="truncate text-sm">
                                {product.Product}
                              </span>
                              {product.IsDisabled === 1 && (
                                <span className="text-xs text-red-400 ml-auto flex-shrink-0">
                                  скрит
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-700">
              <button
                onClick={() => setAssignModalAddonId(null)}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white rounded-2xl transition-colors text-sm"
              >
                Отказ
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={isSavingAssignment}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl transition-colors disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                {isSavingAssignment
                  ? "Запазване..."
                  : `Запази (${assignModalProductIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonConfigTab;
