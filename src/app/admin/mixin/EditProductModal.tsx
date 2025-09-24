"use client";

import { useState, useEffect } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isDisabled?: boolean;
  smallPrice?: number | null;
  mediumPrice?: number | null;
  largePrice?: number | null;
  productTypeId?: number | null;
  productType?: string;
}

interface EditProductForm {
  name: string;
  description: string;
  smallPrice: string;
  mediumPrice: string;
  largePrice: string;
  productTypeId: string;
  imageUrl: string;
  isDisabled: boolean;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (productId: number, updatedProduct: Product) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave
}): React.JSX.Element => {
  const [formData, setFormData] = useState<EditProductForm>({
    name: "",
    description: "",
    smallPrice: "",
    mediumPrice: "",
    largePrice: "",
    productTypeId: "",
    imageUrl: "",
    isDisabled: false
  });

  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<EditProductForm | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Category options for product type dropdown
  const categoryOptions = [
    { id: 1, name: 'Пици' },
    { id: 2, name: 'Бургери' },
    { id: 3, name: 'Дюнери' },
    { id: 4, name: 'Напитки' },
    { id: 5, name: 'Сосове' },
    { id: 6, name: 'Добавки' },
    { id: 7, name: 'Десерти' }
  ];

  // Initialize form data when product changes
  useEffect((): void => {
    if (product && isOpen) {
      const initialData: EditProductForm = {
        name: product.name,
        description: product.description || "",
        smallPrice: product.smallPrice ? product.smallPrice.toString() : "",
        mediumPrice: product.mediumPrice ? product.mediumPrice.toString() : "",
        largePrice: product.largePrice ? product.largePrice.toString() : "",
        productTypeId: product.productTypeId ? product.productTypeId.toString() : "",
        imageUrl: product.imageUrl || "",
        isDisabled: product.isDisabled || false
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
    }
  }, [product, isOpen]);

  // Check for changes whenever form data changes
  useEffect((): void => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const handleInputChange = (field: keyof EditProductForm, value: string | boolean): void => {
    setFormData((prev: EditProductForm) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (url: string | null): void => {
    setFormData((prev: EditProductForm) => ({ ...prev, imageUrl: url || "" }));
    setImageUploadError(null);
  };

  const handleImageUploadError = (error: string): void => {
    setImageUploadError(error);
  };

  const handleSave = (): void => {
    if (!product || !hasChanges) return;

    const updatedProduct: Product = {
      ...product,
      name: formData.name,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null,
      isDisabled: formData.isDisabled,
      smallPrice: formData.smallPrice ? parseFloat(formData.smallPrice) : null,
      mediumPrice: formData.mediumPrice ? parseFloat(formData.mediumPrice) : null,
      largePrice: formData.largePrice ? parseFloat(formData.largePrice) : null,
      productTypeId: formData.productTypeId ? parseInt(formData.productTypeId) : null,
      productType: formData.productTypeId ? getProductTypeName(parseInt(formData.productTypeId)) : undefined
    };

    onSave(product.id, updatedProduct);
    onClose();
  };

  const handleReset = (): void => {
    if (originalData) {
      setFormData(originalData);
      setHasChanges(false);
    }
  };

  const getProductTypeName = (productTypeId: number): string => {
    switch (productTypeId) {
      case 1:
      case 2:
      case 3:
      case 7:
        return 'Пица';
      case 4:
        return 'Напитки';
      case 5:
        return 'Сосове';
      case 6:
        return 'Добавки';
      default:
        return 'Неизвестно';
    }
  };

  const handleClose = (): void => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        "Имате незапазени промени. Сигурни ли сте, че искате да затворите модала?"
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen || !product) return <></>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md md:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-white leading-tight sm:leading-normal">
            Редактиране на продукт:
            <span className="block text-sm sm:text-base text-gray-300 mt-1 break-words">
              {product.name}
            </span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); handleSave(); }} className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Име на продукта *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                placeholder="Име на продукта"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 resize-none"
                placeholder="Описание на продукта"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Тип продукт *
              </label>
              <select
                value={formData.productTypeId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('productTypeId', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                required
              >
                <option value="">Изберете тип</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Изображение на продукта
              </label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={handleImageUpload}
                onError={handleImageUploadError}
                placeholder="Качете изображение на продукта"
                maxSize={5}
                className="w-full"
              />
              {imageUploadError && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {imageUploadError}
                </p>
              )}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border-t border-gray-700 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Ценообразуване</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Малка цена *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.smallPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('smallPrice', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Средна цена
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mediumPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('mediumPrice', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  placeholder="0.00"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Голяма цена
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.largePrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('largePrice', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t border-gray-700 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Статус на продукта</h3>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDisabled}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('isDisabled', e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
              />
              <span className="text-sm sm:text-base text-gray-300">
                {formData.isDisabled ? 'Продуктът е деактивиран' : 'Продуктът е активен'}
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Възстанови</span>
              <span className="xs:hidden">Reset</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gray-700 hover:bg-gray-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Отказ</span>
              <span className="xs:hidden">Cancel</span>
            </button>
            <button
              type="submit"
              disabled={!hasChanges}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Запази промените</span>
              <span className="xs:hidden">Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
