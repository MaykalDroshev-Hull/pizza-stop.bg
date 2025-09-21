"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Trash2, X, Undo2, Save, CheckCircle, AlertCircle } from "lucide-react";
import {  getProductsClient, getProductsForProductsTab, upsertProductClient, setProductDisabledClient, deleteProductsClient, DatabaseProduct  } from "../services/productService.client";
import EditProductModal from "../mixin/EditProductModal";

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
  productType?: string; // This will be derived from productTypeId
  isMarkedForDeletion?: boolean;
  isAnimating?: boolean;
}

interface AddProductForm {
  name: string;
  description: string;
  smallPrice: string;
  mediumPrice: string;
  largePrice: string;
  productTypeId: string;
  imageUrl: string;
}

interface PaginationItem {
  type: 'page' | 'ellipsis';
  value: number | string;
}

type ProductCategory = 'Classic' | 'Specialty' | 'Vegetarian' | 'Spicy';

interface FilterState {
  searchQuery: string;
  selectedCategoryId: number | '';
}

interface CategoryOption {
  id: number;
  name: string;
}

interface AutocompleteSuggestion {
  id: number;
  name: string;
  category: string;
}

interface AutocompleteState {
  suggestions: AutocompleteSuggestion[];
  showSuggestions: boolean;
  selectedIndex: number;
}

interface FlashMessage {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

const ProductsTab: React.FC = (): React.JSX.Element => {
  // Pagination configuration - responsive and easy to change
  const PRODUCTS_PER_PAGE_DESKTOP: number = 9;
  const PRODUCTS_PER_PAGE_MOBILE: number = 6;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<Set<number>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isDeletingProducts, setIsDeletingProducts] = useState<boolean>(false);
  const [flashMessages, setFlashMessages] = useState<FlashMessage[]>([]);

  // Flash message functions
  const addFlashMessage = (type: FlashMessage['type'], message: string, duration: number = 4000): void => {
    const id = `flash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const flashMessage: FlashMessage = { id, type, message, duration };
    
    setFlashMessages((prev: FlashMessage[]) => [...prev, flashMessage]);
    
    // Auto-remove after duration
    setTimeout((): void => {
      removeFlashMessage(id);
    }, duration);
  };

  const removeFlashMessage = (id: string): void => {
    setFlashMessages((prev: FlashMessage[]) => prev.filter((msg: FlashMessage) => msg.id !== id));
  };

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState<AddProductForm>({
    name: "",
    description: "",
    smallPrice: "",
    mediumPrice: "",
    largePrice: "",
    productTypeId: "",
    imageUrl: ""
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategoryId: ''
  });

  const [appliedQuery, setAppliedQuery] = useState<string>('');

  
  // Autocomplete state
  const [autocomplete, setAutocomplete] = useState<AutocompleteState>({
    suggestions: [],
    showSuggestions: false,
    selectedIndex: -1
  });
  
  // Category options for filter dropdown
  const categoryOptions: CategoryOption[] = [
    { id: 1, name: 'Пици' },
    { id: 2, name: 'Бургери' },
    { id: 3, name: 'Дюнери' },
    { id: 7, name: 'Десерти' }
  ];

  // Screen size detection
  useEffect((): (() => void) => {
    const checkScreenSize = (): void => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return (): void => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch and log products from database
  useEffect((): void => {
    const fetchProducts = async (): Promise<void> => {
      try {
        const productsData = await getProductsForProductsTab();
        
        // Map database columns to UI-friendly names and add productType
        const productsWithType = productsData.map((product: DatabaseProduct) => ({
          id: product.ProductID,
          name: product.Product,
          description: product.Description,
          imageUrl: product.ImageURL,
          isDisabled: product.IsDisabled === 1,
          smallPrice: product.SmallPrice,
          mediumPrice: product.MediumPrice,
          largePrice: product.LargePrice,
          productTypeId: product.ProductTypeID,
          productType: getProductTypeName(product.ProductTypeID || 0),
          isMarkedForDeletion: false,
          isAnimating: false
        }));
        
        console.table(productsWithType);
        
        // Set products from database
        setProducts(productsWithType);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
       
    fetchProducts();
  }, []);
  // Reset to page 1 when screen size changes
  useEffect((): void => {
    setCurrentPage(1);
  }, [isMobile]);

  const handleEditProduct = (productId: number): void => {
    const product = products.find((p: Product) => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveProduct = async (productId: number, updatedProduct: Product): Promise<void> => {
    try {
      // Prepare data for API (map UI names to database column names)
      const productData = {
        ProductID: updatedProduct.id,
        Product: updatedProduct.name,
        Description: updatedProduct.description,
        ImageURL: updatedProduct.imageUrl,
        IsDisabled: updatedProduct.isDisabled ? 1 : 0,
        SmallPrice: updatedProduct.smallPrice,
        MediumPrice: updatedProduct.mediumPrice,
        LargePrice: updatedProduct.largePrice,
        ProductTypeID: updatedProduct.productTypeId
      };
      
      const savedProduct = await upsertProductClient(productData);
      
      // Map database response back to UI format and add productType
      const productWithType = {
        id: savedProduct.ProductID,
        name: savedProduct.Product,
        description: savedProduct.Description,
        imageUrl: savedProduct.ImageURL,
        isDisabled: savedProduct.IsDisabled === 1,
        smallPrice: savedProduct.SmallPrice,
        mediumPrice: savedProduct.MediumPrice,
        largePrice: savedProduct.LargePrice,
        productTypeId: savedProduct.ProductTypeID,
        productType: getProductTypeName(savedProduct.ProductTypeID || 0)
      };
      
      setProducts((prevProducts: Product[]) => 
        prevProducts.map((product: Product) => 
          product.id === productId ? productWithType : product
        )
      );
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleCloseEditModal = (): void => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: number): void => {
    // Start animation
    setProducts(prevProducts => 
      prevProducts.map((product: Product) => 
        product.id === productId 
          ? { ...product, isAnimating: true }
          : product
      )
    );

    // After animation, immediately mark for deletion and add to deleted set
    setTimeout(() => {
      setProducts(prevProducts => 
        prevProducts.map((product: Product) => 
          product.id === productId 
            ? { ...product, isMarkedForDeletion: true, isAnimating: false }
            : product
        )
      );
      
      // Add to deleted set and mark as having unsaved changes
      setDeletedProductIds(prev => new Set([...prev, productId]));
      setHasUnsavedChanges(true);
    }, 300); // Animation duration
  };

  const handleUndoDelete = (productId: number): void => {
    // Remove from deleted set and update unsaved changes state
    setDeletedProductIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      setHasUnsavedChanges(newSet.size > 0);
      return newSet;
    });

    // Unmark for deletion and return to main grid
    setProducts(prevProducts => 
      prevProducts.map((product: Product) => 
        product.id === productId 
          ? { ...product, isMarkedForDeletion: false, isAnimating: false }
          : product
      )
    );
  };

  const handleSaveChanges = async (): Promise<void> => {
    if (deletedProductIds.size === 0) return;

    const productIdsToDelete = Array.from(deletedProductIds);
    setIsDeletingProducts(true);
    
    try {
      // Delete products from database
      const result = await deleteProductsClient(productIdsToDelete);
      console.log('Products deleted successfully:', result);
      
      // Remove deleted products from the UI
      setProducts(prevProducts => 
        prevProducts.filter((product: Product) => !deletedProductIds.has(product.id))
      );
      
      // Reset state
      setDeletedProductIds(new Set());
      setHasUnsavedChanges(false);
      
      // Show success flash message
      const message = result.success 
        ? `Успешно изтрити ${result.deletedCount} продукт${result.deletedCount > 1 ? 'а' : ''}!`
        : 'Продуктите бяха изтрити, но възможни проблеми с свързаните записи.';
      
      addFlashMessage(result.success ? 'success' : 'warning', message);
      
    } catch (error) {
      console.error('Error deleting products:', error);
      const errorMessage = error instanceof Error 
        ? `Грешка при изтриване на продуктите: ${error.message}`
        : 'Грешка при изтриване на продуктите. Моля, опитайте отново.';
      addFlashMessage('error', errorMessage);
    } finally {
      setIsDeletingProducts(false);
    }
  };

  const handleDiscardChanges = (): void => {
    // Unmark all products for deletion and return them to main grid
    setProducts(prevProducts => 
      prevProducts.map((product: Product) => 
        deletedProductIds.has(product.id)
          ? { ...product, isMarkedForDeletion: false, isAnimating: false }
          : product
      )
    );
    
    // Reset state
    setDeletedProductIds(new Set());
    setHasUnsavedChanges(false);
  };

  const handleToggleProductStatus = async (productId: number): Promise<void> => {
    try {
      const product = products.find((p: Product) => p.id === productId);
      if (!product) return;
      
      const newDisabledStatus = !(product.isDisabled || false);
      await setProductDisabledClient(productId, newDisabledStatus);
      
      // Update local state
      setProducts(products.map((p: Product) => 
        p.id === productId 
          ? { ...p, isDisabled: newDisabledStatus }
          : p
      ));
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };


  const handleInputChange = (field: keyof AddProductForm, value: string): void => {
    setNewProduct((prev: AddProductForm) => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = async (): Promise<void> => {
    // Basic validation
    if (!newProduct.name.trim()) {
      alert('Моля, въведете име на продукта');
      return;
    }
    if (!newProduct.smallPrice || parseFloat(newProduct.smallPrice) <= 0) {
      alert('Моля, въведете валидна цена за малката порция');
      return;
    }
    if (!newProduct.productTypeId) {
      alert('Моля, изберете тип продукт');
      return;
    }

    setIsAddingProduct(true);
    try {
      const productData = {
        Product: newProduct.name.trim(),
        Description: newProduct.description?.trim() || null,
        ImageURL: newProduct.imageUrl?.trim() || null,
        IsDisabled: 0,
        SmallPrice: parseFloat(newProduct.smallPrice),
        MediumPrice: newProduct.mediumPrice ? parseFloat(newProduct.mediumPrice) : null,
        LargePrice: newProduct.largePrice ? parseFloat(newProduct.largePrice) : null,
        ProductTypeID: parseInt(newProduct.productTypeId)
      };
      
      const savedProduct = await upsertProductClient(productData);
      
      // Map database response back to UI format and add productType
      const productWithType = {
        id: savedProduct.ProductID,
        name: savedProduct.Product,
        description: savedProduct.Description,
        imageUrl: savedProduct.ImageURL,
        isDisabled: savedProduct.IsDisabled === 1,
        smallPrice: savedProduct.SmallPrice,
        mediumPrice: savedProduct.MediumPrice,
        largePrice: savedProduct.LargePrice,
        productTypeId: savedProduct.ProductTypeID,
        productType: getProductTypeName(savedProduct.ProductTypeID || 0)
      };
      
      setProducts([...products, productWithType]);
      setNewProduct({ 
        name: "", 
        description: "", 
        smallPrice: "", 
        mediumPrice: "", 
        largePrice: "", 
        productTypeId: "", 
        imageUrl: "" 
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Грешка при добавяне на продукта. Моля, опитайте отново.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setNewProduct({ 
      name: "", 
      description: "", 
      smallPrice: "", 
      mediumPrice: "", 
      largePrice: "", 
      productTypeId: "", 
      imageUrl: "" 
    });
    setIsAddingProduct(false);
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
      case 6:
        return 'Добавки';
      default:
        return 'Неизвестно';
    }
  };

  /**
   * Converts Bulgarian Lev (BGN) to Euros (EUR)
   * @param bgnPrice - Price in Bulgarian Lev
   * @returns Formatted string with both BGN and EUR prices
   */
  const formatPriceWithEuro = (bgnPrice: number): string => {
    const BGN_PER_EUR = 1.95583 as const;

    const eurPrice = bgnPrice / BGN_PER_EUR; 
    
    return `${bgnPrice.toFixed(2)} лв/${eurPrice.toFixed(2)} Є`;
  };

  const generateSuggestions = (query: string): AutocompleteSuggestion[] => {
    if (query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    return products
      .filter((product: Product) => 
        product.name.toLowerCase().includes(queryLower)
      )
      .slice(0, 5)
      .map((product: Product) => ({
        id: product.id,
        name: product.name,
        category: product.productType || 'Unknown'
      }));
  };

  // Filter handlers
  const handleSearchChange = (value: string): void => {
    setFilters((prev: FilterState) => ({ ...prev, searchQuery: value }));
    setCurrentPage(1); // Reset to first page when searching
    
    // Update autocomplete suggestions
    const suggestions = generateSuggestions(value);
    setAutocomplete({
      suggestions,
      showSuggestions: suggestions.length > 0 && value.length >= 2,
      selectedIndex: -1
    });
  };

  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion): void => {
    setFilters((prev: FilterState) => ({ ...prev, searchQuery: suggestion.name }));
    setAutocomplete({
      suggestions: [],
      showSuggestions: false,
      selectedIndex: -1
    });
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!autocomplete.showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setAutocomplete(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.suggestions.length - 1)
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setAutocomplete(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1)
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (autocomplete.selectedIndex >= 0) {
          handleSuggestionSelect(autocomplete.suggestions[autocomplete.selectedIndex]);
        }
        break;
      case 'Escape':
        setAutocomplete(prev => ({
          ...prev,
          showSuggestions: false,
          selectedIndex: -1
        }));
        break;
    }
  };

  const handleCategoryChange = (categoryId: number | ''): void => {
    setFilters((prev: FilterState) => ({ ...prev, selectedCategoryId: categoryId }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = (): void => {
    setFilters({ searchQuery: '', selectedCategoryId: '' });
    setAppliedQuery('');                            // нулираме приложеното търсене
    setAutocomplete({ suggestions: [], showSuggestions: false, selectedIndex: -1 });
    setCurrentPage(1);
  };

  const applyFilters = (): void => {
    setAppliedQuery(filters.searchQuery.trim()); // прилагаме текущото поле
    setCurrentPage(1);
  };

  // Filtering logic
  const filteredProducts: Product[] = products.filter((product: Product) => {
    const q = appliedQuery.toLowerCase().trim();
    const name = product.name.toLowerCase();
  
    // търсим по всички думи от заявката (напр. "keto crust" => и двете трябва да присъстват)
    const tokens = q.split(/\s+/).filter(Boolean);
    const searchMatch: boolean = q === '' || tokens.every(t => name.includes(t));
  
    // Category filter - filter by ProductType ID directly
    const categoryMatch: boolean =
      filters.selectedCategoryId === '' ||
      product.productTypeId === filters.selectedCategoryId;
  
    // Don't show products marked for deletion in the main grid
    const notMarkedForDeletion: boolean = !product.isMarkedForDeletion;
  
    return searchMatch && categoryMatch && notMarkedForDeletion;
  });

  // Pagination logic - responsive (now using filtered products)
  const productsPerPage: number = isMobile ? PRODUCTS_PER_PAGE_MOBILE : PRODUCTS_PER_PAGE_DESKTOP;
  const totalPages: number = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex: number = (currentPage - 1) * productsPerPage;
  const endIndex: number = startIndex + productsPerPage;
  const currentProducts: Product[] = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  const handlePreviousPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = (): void => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate pagination items with ellipsis for mobile
  const generatePaginationItems = (): (number | string)[] => {
    const items: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);
      
      if (currentPage <= 4) {
        // Show first 5 pages, then ellipsis, then last page
        for (let i = 2; i <= 5; i++) {
          items.push(i);
        }
        items.push('...');
        items.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page, ellipsis, then last 5 pages
        items.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
        // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
        items.push('...');
        items.push(currentPage - 1);
        items.push(currentPage);
        items.push(currentPage + 1);
        items.push('...');
        items.push(totalPages);
      }
    }
    
    return items;
  };

  return (
    <div className="space-y-6">

      {/* Filters Section */}
      <div className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700">
        <div className="flex flex-col space-y-4">
          {/* Search Filter with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Търсене на продукти
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicking on them
                  setTimeout(() => {
                    setAutocomplete(prev => ({ ...prev, showSuggestions: false }));
                  }, 200);
                }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                placeholder="Въведете име на продукт ..."
                autoComplete="off"
              />
              
              {/* Autocomplete Suggestions */}
              {autocomplete.showSuggestions && autocomplete.suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {autocomplete.suggestions.map((suggestion: AutocompleteSuggestion, index: number) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`px-4 py-3 cursor-pointer transition-colors duration-200 border-b border-gray-700 last:border-b-0 ${
                        index === autocomplete.selectedIndex
                          ? 'bg-orange-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{suggestion.name}</span>
                        <span className="text-xs text-gray-400">{suggestion.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Категория
              </label>
              <select
                value={filters.selectedCategoryId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCategoryChange(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="
                  w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-xl text-white text-base leading-none 
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                >
                <option value="">Всички категории</option>
                {categoryOptions.map((option: CategoryOption) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filter Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <button
                onClick={applyFilters}
                className="
                  inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 text-white text-base 
                  font-medium leading-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 
                  w-full sm:w-auto mt-7 sm:mt-0"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Филтрирай
              </button>
              <button
                onClick={clearFilters}
                className="
                  inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-600 hover:bg-gray-700 px-4 text-white text-base font-medium leading-none 
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
                  focus:ring-offset-2 w-full sm:w-auto mt-7 sm:mt-0"
                >
                <X className="w-4 h-4" />
                Изчисти
              </button>
            </div>
          </div>

          {/* Filter Results Info */}
          {(filters.searchQuery || filters.selectedCategoryId) && (
            <div className="bg-gray-700 rounded-xl p-3 border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  Показани {filteredProducts.length} от {products.length} продукта
                </span>
                <div className="flex items-center gap-2">
                  {filters.searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs rounded-lg">
                      Търсене: "{filters.searchQuery}"
                    </span>
                  )}
                  {filters.selectedCategoryId && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-lg">
                      Категория: {categoryOptions.find(opt => opt.id === filters.selectedCategoryId)?.name || 'Неизвестно'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 px-4 py-3 sm:px-6 text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 w-full sm:w-auto text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Добави продукт</span>
          <span className="xs:hidden">Добави продукт</span>
        </button>
      </div>

      {/* Flash Messages - Positioned under Add Button */}
      {flashMessages.length > 0 && (
        <div className="mb-4 sm:mb-6 space-y-2">
          {flashMessages.map((flash: FlashMessage) => (
            <div
              key={flash.id}
              className={`relative flex items-center gap-3 p-3 sm:p-4 rounded-xl shadow-lg border transition-all duration-300 animate-in slide-in-from-top-2 ${
                flash.type === 'success'
                  ? 'bg-green-900/95 border-green-700 text-green-100'
                  : flash.type === 'error'
                  ? 'bg-red-900/95 border-red-700 text-red-100'
                  : 'bg-orange-900/95 border-orange-700 text-orange-100'
              }`}
            >
              <div className="flex-shrink-0">
                {flash.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                ) : flash.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium leading-tight">
                  {flash.message}
                </p>
              </div>
              <button
                onClick={() => removeFlashMessage(flash.id)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors duration-200"
                aria-label="Close message"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Changes Button - Only show when there are unsaved changes */}
      {hasUnsavedChanges && (
        <div className="flex flex-col gap-3 justify-center mb-4 sm:mb-6">
          <div className="bg-red-900 border border-red-700 rounded-2xl p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-red-200">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium">
                  {deletedProductIds.size} продукт{deletedProductIds.size > 1 ? 'а' : ''} маркирани за изтриване
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
                  onClick={handleSaveChanges}
                  disabled={isDeletingProducts}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed px-4 py-2.5 text-white text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 hover:scale-105 active:scale-95 w-full sm:w-auto"
                >
                  {isDeletingProducts ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Изтриване...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Запази промените
                    </>
                  )}
                </button>
                <button
                  onClick={handleDiscardChanges}
                  disabled={isDeletingProducts}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed px-4 py-2.5 text-white text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 hover:scale-105 active:scale-95 w-full sm:w-auto"
                >
                  <X className="w-4 h-4" />
                  Отказ
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs sm:text-sm text-red-300">
              За да изтриете продуктите окончателно, натиснете "Запази промените"
            </div>
          </div>
        </div>
      )}

      {/* Deleted Products Section - Responsive */}
      {deletedProductIds.size > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-red-300 font-medium flex items-center gap-2 text-sm sm:text-base">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Продукти маркирани за изтриване ({deletedProductIds.size})
            </h3>
            <div className="text-xs sm:text-sm text-red-400">
              Кликнете "Възстанови" за да върнете продукта в списъка
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
            {products
              .filter((product: Product) => deletedProductIds.has(product.id))
              .map((product: Product) => (
                <div 
                  key={`deleted-${product.id}`}
                  className="bg-red-900/30 border border-red-600/50 rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col h-full transition-all duration-200 hover:bg-red-900/40 hover:border-red-500/70"
                >
                  {/* Product Info Section */}
                  <div className="flex items-start gap-3 flex-1 mb-3 sm:mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-red-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const nextElement = target.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <Package className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-300 ${product.imageUrl ? 'hidden' : 'flex'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-red-200 font-medium text-sm sm:text-base lg:text-lg leading-tight mb-1 line-clamp-2">{product.name}</h4>
                      <p className="text-red-400 text-xs sm:text-sm mb-2">{product.productType}</p>
                      {product.smallPrice && (
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-800/50 rounded-md">
                            <span className="text-red-400 text-xs font-medium">S:</span>
                            <span className="text-red-200 text-xs sm:text-sm font-semibold">
                              {formatPriceWithEuro(product.smallPrice)}
                            </span>
                          </div>
                          {product.mediumPrice && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-800/50 rounded-md">
                              <span className="text-red-400 text-xs font-medium">M:</span>
                              <span className="text-red-200 text-xs sm:text-sm font-semibold">
                                {formatPriceWithEuro(product.mediumPrice)}
                              </span>
                            </div>
                          )}
                          {product.largePrice && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-800/50 rounded-md">
                              <span className="text-red-400 text-xs font-medium">L:</span>
                              <span className="text-red-200 text-xs sm:text-sm font-semibold">
                                {formatPriceWithEuro(product.largePrice)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Button Section - Always at bottom */}
                  <div className="mt-auto">
                    <button
                      onClick={() => handleUndoDelete(product.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-green-600 hover:bg-green-700 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 hover:scale-105 active:scale-95"
                    >
                      <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Възстанови</span>
        </button>
      </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {currentProducts.map((product: Product) => (
          <div 
            key={product.id} 
            className={`bg-gray-900 border rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 transition-all duration-300 group flex flex-col ${
                product.isDisabled ? 'border-gray-600 opacity-60' : 'border-gray-700 hover:border-red-500'
              } ${
                product.isAnimating ? 'animate-pulse scale-95 opacity-50' : ''
              }`}
            style={{
              transform: product.isAnimating ? 'scale(0.95) translateX(-20px)' : 'scale(1) translateX(0)',
              opacity: product.isAnimating ? 0.5 : 1,
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {/* Product Image */}
            <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-800 rounded-lg sm:rounded-xl mb-3 sm:mb-4 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    // Fallback to default icon if image fails to load
                    const target = e.currentTarget as HTMLImageElement;
                    const nextElement = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className={`w-full h-full  items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
                <Package className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 transition-colors ${
                product.isDisabled 
                  ? 'text-gray-500' 
                  : 'text-gray-600 group-hover:text-red-500'
              }`} />
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1 space-y-2 sm:space-y-3">
            <h3  className={`font-bold leading-snug transition-colors ${
                product.isDisabled ? 'text-gray-500' : 'text-white group-hover:text-red-400'
                } text-base sm:text-lg line-clamp-2 min-h-[2.8rem] sm:min-h-[3.2rem]`}>
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">{product.productType}</p>
              
              {/* Description */}
              {product.description && (
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{product.description}</p>
              )}
              
              {/* Price Fields - Responsive */}
              <div className="space-y-2 sm:space-y-3">
                {/* Small Price - Always shown */}
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-bold">S</span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 font-medium">Малка</span>
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-bold text-green-400">
                    {product.smallPrice ? formatPriceWithEuro(product.smallPrice) : 'N/A'}
                  </span>
                </div>
                
                {/* Medium Price - If available */}
                {product.mediumPrice && (
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-bold">M</span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 font-medium">Средна</span>
                    </div>
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-orange-400">
                      {formatPriceWithEuro(product.mediumPrice)}
                    </span>
                  </div>
                )}
                
                {/* Large Price - If available */}
                {product.largePrice && (
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-bold">L</span>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 font-medium">Голяма</span>
                    </div>
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-red-400">
                      {formatPriceWithEuro(product.largePrice)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Actions - Responsive */}
              <div className="flex flex-col space-y-2 sm:space-y-3">
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                  <button 
                    className="flex-1 inline-flex h-8 sm:h-10 items-center justify-center rounded-xl sm:rounded-2xl bg-green-600 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                    onClick={(): void => handleEditProduct(product.id)}
                    disabled={product.isDisabled || false}
                  >
                    Edit
                  </button>
                  <button 
                    className="flex-1 inline-flex h-8 sm:h-10 items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl bg-red-800 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white transition-colors duration-200 hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                    onClick={(): void => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Delete</span>
                    <span className="xs:hidden">Delete</span>
                  </button>
                </div>

                {/* Disable Checkbox */}
                <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.isDisabled || false}
                    onChange={(): void => { handleToggleProductStatus(product.id); }}
                    className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">
                    {product.isDisabled ? 'Disabled' : 'Enable'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center space-y-4">
          {/* Page Info */}
          <div className="text-sm text-gray-400 text-center px-4">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            {(filters.searchQuery || filters.selectedCategoryId) && (
              <span className="block text-xs text-gray-500 mt-1">
                (filtered from {products.length} total products)
              </span>
            )}
          </div>
          
          {/* Mobile Pagination - Compact Design */}
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile: Simple Previous/Next with Page Info */}
            <div className="flex items-center justify-between bg-gray-800 rounded-2xl p-2 border border-gray-600">
              <button
                onClick={(): void => handlePreviousPage()}
                disabled={currentPage === 1}
                className="
                    flex items-center justify-center w-10 h-10 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 
                    hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-200 disabled:opacity-50 
                    disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:hover:border-gray-600 disabled:hover:text-gray-300
                  "
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button
                onClick={(): void => handleNextPage()}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:hover:border-gray-600 disabled:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Desktop: Full Pagination with Page Numbers */}
            <div className="hidden sm:flex items-center justify-center space-x-2 mt-4">
              {/* Previous Button */}
              <button
                onClick={(): void => handlePreviousPage()}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-800 border border-gray-600 text-gray-300 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:border-gray-600 disabled:hover:text-gray-300"
              >
                ←
              </button>

              {/* Page Numbers with Ellipsis */}
              <div className="flex items-center space-x-1">
                {generatePaginationItems().map((item, index) => (
                  <div key={index}>
                    {typeof item === 'number' ? (
                      <button
                        onClick={(): void => handlePageChange(item)}
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl font-medium transition-colors duration-200 ${
                          currentPage === item
                            ? 'bg-orange-600 text-white border border-orange-600'
                            : 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-orange-600 hover:border-orange-600 hover:text-white'
                        }`}
                      >
                        {item}
                      </button>
                    ) : (
                      <span className="px-2 text-gray-500 font-medium">...</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={(): void => handleNextPage()}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-800 border border-gray-600 text-gray-300 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:border-gray-600 disabled:hover:text-gray-300"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Добавяне на нов продукт</h2>
              <button
                onClick={(): void => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); await handleAddProduct(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Име на продукта
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Име на продукта"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Описание (опционално)
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Описание на продукта"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Тип продукт
                </label>
                <select
                  value={newProduct.productTypeId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('productTypeId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  required
                >
                  <option value="">Изберете тип</option>
                  <option value="1">Пица</option>
                  <option value="2">Бургер</option>
                  <option value="3">Дюнер</option>
                  <option value="7">Десерт</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Малка цена
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.smallPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('smallPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Средна цена (опционално)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.mediumPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('mediumPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Голяма цена (опционално)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.largePrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('largePrice', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL на изображение (опционално)
                </label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('imageUrl', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm sm:text-base"
                >
                  Добави
                </button>
                <button
                  type="button"
                  onClick={(): void => setIsModalOpen(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm sm:text-base"
                >
                  Прекратяване
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Добавяне на нов продукт</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); await handleAddProduct(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Име на продукта
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Име на продукта"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Описание (опционално)
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Описание на продукта"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Тип продукт
                </label>
                <select
                  value={newProduct.productTypeId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('productTypeId', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                >
                  <option value="">Изберете тип</option>
                  <option value="1">Пица</option>
                  <option value="2">Бургер</option>
                  <option value="3">Дюнер</option>
                  <option value="7">Десерт</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Малка цена
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.smallPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('smallPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Средна цена (опционално)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.mediumPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('mediumPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Голяма цена (опционално)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.largePrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('largePrice', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL на изображение (опционално)
                </label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('imageUrl', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isAddingProduct}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  {isAddingProduct ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Добавяне...
                    </>
                  ) : (
                    'Добави'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isAddingProduct}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm sm:text-base"
                >
                  Прекратяване
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default ProductsTab;
