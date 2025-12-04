"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Trash2, X, Undo2, Save, CheckCircle, AlertCircle, Edit } from "lucide-react";
import { 
  DatabaseProduct, 
  upsertProductClient, 
  setProductDisabledClient, 
  deleteProductsClient, 
  softDeleteProductsClient, 
  restoreProductsClient 
} from "../services/productService.client";
import EditProductModal from "./EditProductModal";
import ImageUpload from "@/components/ImageUpload";

// Product interface for UI
interface Product {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  secondImageUrl?: string | null; // Second image for hover effect
  isDisabled?: boolean;
  isNoAddOns?: boolean;
  smallPrice?: number | null;
  mediumPrice?: number | null;
  largePrice?: number | null;
  productTypeId?: number | null;
  productType?: string;
  sortOrder?: number | null;
  isMarkedForDeletion?: boolean;
  isAnimating?: boolean;
  isDeleted?: boolean;
}

// Tracked change interface
interface TrackedChange {
  id: string;
  productId: number;
  productName: string;
  productType: string;
  changeType: 'update' | 'delete' | 'restore';
  originalData?: Product;
  newData?: Product;
  timestamp: Date;
}

// Add product form interface
interface AddProductForm {
  name: string;
  description: string;
  smallPrice: string;
  mediumPrice: string;
  largePrice: string;
  productTypeId: string;
  imageUrl: string;
  secondImageUrl: string; // Second image for hover effect
  sortOrder: string;
}

// Filter state interface
interface FilterState {
  searchQuery: string;
  selectedCategoryId: number | '';
}

// Category option interface
interface CategoryOption {
  id: number;
  name: string;
}

// Autocomplete interfaces
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

// Flash message interface
interface FlashMessage {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

// Props interface for the ProductListManager
interface ProductListManagerProps {
  // Data fetching function
  fetchProducts: () => Promise<DatabaseProduct[]>;
  
  // Category options for filtering
  categoryOptions: CategoryOption[];
  
  // Product type mapping function
  getProductTypeName: (productTypeId: number) => string;
  
  // UI customization
  accentColor?: 'red' | 'green' | 'blue' | 'orange';
  tabName?: string;
  
  // Pagination settings
  productsPerPageDesktop?: number;
  productsPerPageMobile?: number;
}

const ProductListManager: React.FC<ProductListManagerProps> = ({
  fetchProducts,
  categoryOptions,
  getProductTypeName,
  accentColor = 'red',
  tabName = 'продукти',
  productsPerPageDesktop = 9,
  productsPerPageMobile = 6
}): React.JSX.Element => {
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<Set<number>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isDeletingProducts, setIsDeletingProducts] = useState<boolean>(false);
  const [flashMessages, setFlashMessages] = useState<FlashMessage[]>([]);
  const [trackedChanges, setTrackedChanges] = useState<TrackedChange[]>([]);
  const [showDeletedProducts, setShowDeletedProducts] = useState<boolean>(false);
  
  // Modal states
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
    imageUrl: "",
    secondImageUrl: "",
    sortOrder: "0"
  });
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  
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

  // Color mapping for different accent colors
  const colorClasses = {
    red: {
      border: 'hover:border-red-500',
      text: 'group-hover:text-red-400',
      button: 'bg-red-600 hover:bg-red-700',
      accent: 'text-red-400'
    },
    green: {
      border: 'hover:border-green-500',
      text: 'group-hover:text-green-400',
      button: 'bg-green-600 hover:bg-green-700',
      accent: 'text-green-400'
    },
    blue: {
      border: 'hover:border-blue-500',
      text: 'group-hover:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700',
      accent: 'text-blue-400'
    },
    orange: {
      border: 'hover:border-orange-500',
      text: 'group-hover:text-orange-400',
      button: 'bg-orange-600 hover:bg-orange-700',
      accent: 'text-orange-400'
    }
  };

  const colors = colorClasses[accentColor];

  // Screen size detection
  useEffect((): (() => void) => {
    const checkScreenSize = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return (): void => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch products on mount
  useEffect((): void => {
    const loadProducts = async (): Promise<void> => {
      try {
        const productsData = await fetchProducts();
        
        const productsWithType = productsData.map((product: DatabaseProduct) => ({
          id: product.ProductID,
          name: product.Product,
          description: product.Description,
          imageUrl: product.ImageURL,
          secondImageUrl: product.SecondImageURL,
          isDisabled: product.IsDisabled === 1,
          isNoAddOns: product.IsNoAddOns || false,
          smallPrice: product.SmallPrice,
          mediumPrice: product.MediumPrice,
          largePrice: product.LargePrice,
          productTypeId: product.ProductTypeID,
          productType: getProductTypeName(product.ProductTypeID || 0),
          sortOrder: product.SortOrder || 0,
          isMarkedForDeletion: false,
          isAnimating: false,
          isDeleted: product.isDeleted === 1 || product.isDeleted === true
        }));
         
        const deletedProductsCount = productsWithType.filter(p => p.isDeleted).length;
        
        setProducts(productsWithType);
      } catch {
        addFlashMessage('error', `Грешка при зареждане на ${tabName}.`);
      }
    };
       
    loadProducts();
  }, [fetchProducts, getProductTypeName, tabName]);

  // Reset to page 1 when screen size changes
  useEffect((): void => {
    setCurrentPage(1);
  }, [isMobile]);

  // Flash message functions
  const addFlashMessage = (type: FlashMessage['type'], message: string, duration: number = 4000): void => {
    const id = `flash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const flashMessage: FlashMessage = { id, type, message, duration };
    
    setFlashMessages((prev: FlashMessage[]) => [...prev, flashMessage]);
    
    setTimeout((): void => {
      removeFlashMessage(id);
    }, duration);
  };

  const removeFlashMessage = (id: string): void => {
    setFlashMessages((prev: FlashMessage[]) => prev.filter((msg: FlashMessage) => msg.id !== id));
  };

  // Tracking functions
  const addTrackedChange = (change: Omit<TrackedChange, 'id' | 'timestamp'>): void => {
    const newChange: TrackedChange = {
      ...change,
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setTrackedChanges(prev => [...prev, newChange]);
  };

  const removeTrackedChange = (changeId: string): void => {
    setTrackedChanges(prev => prev.filter(change => change.id !== changeId));
  };

  const clearAllTrackedChanges = (): void => {
    setTrackedChanges([]);
  };

  // Helper function to check if a product has actually changed
  const hasProductChanged = (original: Product, updated: Product): boolean => {
    return (
      original.name !== updated.name ||
      original.description !== updated.description ||
      original.imageUrl !== updated.imageUrl ||
      original.secondImageUrl !== updated.secondImageUrl ||
      original.isDisabled !== updated.isDisabled ||
      original.smallPrice !== updated.smallPrice ||
      original.mediumPrice !== updated.mediumPrice ||
      original.largePrice !== updated.largePrice ||
      original.productTypeId !== updated.productTypeId ||
      original.isDeleted !== updated.isDeleted
    );
  };

  // Save all changes
  const handleSaveAllChanges = async (): Promise<void> => {
    try {
      for (const change of trackedChanges) {
        if (change.changeType === 'delete') {
          await softDeleteProductsClient([change.productId]);
        } else if (change.changeType === 'restore') {
          await restoreProductsClient([change.productId]);
        } else if (change.changeType === 'update' && change.newData) {
          await setProductDisabledClient(change.productId, change.newData.isDisabled || false);
        }
      }
      
      clearAllTrackedChanges();
      setHasUnsavedChanges(false);
      setDeletedProductIds(new Set());
      
      setProducts(prevProducts => 
        prevProducts.map((product: Product) => {
          const deleteChange = trackedChanges.find(c => c.productId === product.id && c.changeType === 'delete');
          const restoreChange = trackedChanges.find(c => c.productId === product.id && c.changeType === 'restore');
          
          if (deleteChange) {
            return { ...product, isDeleted: true, isMarkedForDeletion: false, isAnimating: false };
          } else if (restoreChange) {
            return { ...product, isDeleted: false };
          }
          return product;
        })
      );
      
      addFlashMessage('success', 'Всички промени бяха запазени успешно!');
    } catch {
      addFlashMessage('error', 'Грешка при запазване на промените.');
    }
  };

  // Undo all changes
  const handleUndoAllChanges = (): void => {
    clearAllTrackedChanges();
    setHasUnsavedChanges(false);
    setDeletedProductIds(new Set());
    
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.isMarkedForDeletion 
          ? { ...product, isMarkedForDeletion: false, isAnimating: false }
          : product
      )
    );
    
    addFlashMessage('success', 'Всички промени бяха отменени!');
  };

  // Toggle deleted products filter
  const toggleDeletedProducts = (): void => {
    setShowDeletedProducts(!showDeletedProducts);
    setCurrentPage(1);
  };

  // Handle restore product
  const handleRestoreProduct = (productId: number): void => {
    const productToRestore = products.find(p => p.id === productId);
    if (productToRestore) {
      addTrackedChange({
        productId: productId,
        productName: productToRestore.name,
        productType: productToRestore.productType || 'Unknown',
        changeType: 'restore',
        originalData: productToRestore,
        newData: { ...productToRestore, isDeleted: false }
      });
    }
  };

  // Undo individual change
  const handleUndoChange = (changeId: string): void => {
    const change = trackedChanges.find(c => c.id === changeId);
    if (!change) return;

    if (change.changeType === 'delete') {
      setDeletedProductIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(change.productId);
        setHasUnsavedChanges(newSet.size > 0);
        return newSet;
      });

      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === change.productId 
            ? { ...product, isMarkedForDeletion: false, isAnimating: false }
            : product
        )
      );
    } else if (change.changeType === 'restore') {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === change.productId 
            ? { ...product, isDeleted: true }
            : product
        )
      );
    } else if (change.changeType === 'update' && change.originalData) {
      const originalDisabledStatus = change.originalData.isDisabled || false;
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === change.productId 
            ? { ...product, isDisabled: originalDisabledStatus }
            : product
        )
      );
    }
    
    removeTrackedChange(changeId);
  };

  // Product CRUD operations
  const handleEditProduct = (productId: number): void => {
    const product = products.find((p: Product) => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveProduct = async (productId: number, updatedProduct: Product): Promise<void> => {
    try {
      const productData = {
        ProductID: updatedProduct.id,
        Product: updatedProduct.name,
        Description: updatedProduct.description,
        ImageURL: updatedProduct.imageUrl,
        SecondImageURL: updatedProduct.secondImageUrl,
        IsDisabled: updatedProduct.isDisabled ? 1 : 0,
        IsNoAddOns: updatedProduct.isNoAddOns || false,
        SmallPrice: updatedProduct.smallPrice,
        MediumPrice: updatedProduct.mediumPrice,
        LargePrice: updatedProduct.largePrice,
        ProductTypeID: updatedProduct.productTypeId,
        SortOrder: updatedProduct.sortOrder || 0
      };
      
      const savedProduct = await upsertProductClient(productData);
      
      const productWithType = {
        id: savedProduct.ProductID,
        name: savedProduct.Product,
        description: savedProduct.Description,
        imageUrl: updatedProduct.imageUrl,
        secondImageUrl: updatedProduct.secondImageUrl,
        isDisabled: savedProduct.IsDisabled === 1,
        isNoAddOns: savedProduct.IsNoAddOns || false,
        smallPrice: savedProduct.SmallPrice,
        mediumPrice: savedProduct.MediumPrice,
        largePrice: savedProduct.LargePrice,
        productTypeId: savedProduct.ProductTypeID,
        productType: updatedProduct.productType || getProductTypeName(savedProduct.ProductTypeID || 0),
        sortOrder: savedProduct.SortOrder || 0,
        isDeleted: savedProduct.isDeleted === 1 || savedProduct.isDeleted === true
      };
      
      setProducts((prevProducts: Product[]) => 
        prevProducts.map((product: Product) => 
          product.id === productId ? productWithType : product
        )
      );
      setIsEditModalOpen(false);
      setEditingProduct(null);
      addFlashMessage('success', 'Продуктът беше обновен успешно!');
    } catch {
      addFlashMessage('error', 'Грешка при запазване на продукта.');
    }
  };

  const handleCloseEditModal = (): void => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: number): void => {
    const productToDelete = products.find(p => p.id === productId);
    
    if (productToDelete) {
      addTrackedChange({
        productId: productId,
        productName: productToDelete.name,
        productType: productToDelete.productType || 'Unknown',
        changeType: 'delete',
        originalData: productToDelete
      });
    }
    
    setProducts(prevProducts => 
      prevProducts.map((product: Product) => 
        product.id === productId 
          ? { ...product, isAnimating: true }
          : product
      )
    );

    setTimeout(() => {
      setProducts(prevProducts => 
        prevProducts.map((product: Product) => 
          product.id === productId 
            ? { ...product, isMarkedForDeletion: true, isAnimating: false }
            : product
        )
      );
      
      setDeletedProductIds(prev => new Set([...prev, productId]));
      setHasUnsavedChanges(true);
    }, 300);
  };

  const handleToggleProductStatus = async (productId: number): Promise<void> => {
    try {
      const product = products.find((p: Product) => p.id === productId);
      if (!product) return;
      
      const newDisabledStatus = !(product.isDisabled || false);
      
      const existingChangeIndex = trackedChanges.findIndex(change => 
        change.productId === productId && change.changeType === 'update'
      );
      
      if (existingChangeIndex !== -1) {
        const existingChange = trackedChanges[existingChangeIndex];
        if (existingChange.originalData?.isDisabled === newDisabledStatus) {
          setTrackedChanges(prev => prev.filter((_, index) => index !== existingChangeIndex));
        } else {
          setTrackedChanges(prev => prev.map((change, index) => 
            index === existingChangeIndex 
              ? { 
                  ...change, 
                  newData: { ...change.newData!, isDisabled: newDisabledStatus }
                }
              : change
          ));
        }
      } else {
        if (product.isDisabled !== newDisabledStatus) {
          addTrackedChange({
            productId: productId,
            productName: product.name,
            productType: product.productType || 'Unknown',
            changeType: 'update',
            originalData: product,
            newData: { ...product, isDisabled: newDisabledStatus }
          });
        }
      }
      
      setProducts(products.map((p: Product) => 
        p.id === productId 
          ? { ...p, isDisabled: newDisabledStatus }
          : p
      ));
    } catch {
    }
  };

  // Add product functions
  const handleInputChange = (field: keyof AddProductForm, value: string): void => {
    setNewProduct((prev: AddProductForm) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (url: string | null): void => {
    setNewProduct((prev: AddProductForm) => ({ ...prev, imageUrl: url || "" }));
    setImageUploadError(null);
  };

  const handleSecondImageUpload = (url: string | null): void => {
    setNewProduct((prev: AddProductForm) => ({ ...prev, secondImageUrl: url || "" }));
    setImageUploadError(null);
  };

  const handleImageUploadError = (error: string): void => {
    setImageUploadError(error);
  };

  const handleAddProduct = async (): Promise<void> => {
    if (!newProduct.name.trim()) {
      addFlashMessage('error', 'Моля, въведете име на продукта');
      return;
    }
    if (!newProduct.smallPrice || parseFloat(newProduct.smallPrice) <= 0) {
      addFlashMessage('error', 'Моля, въведете валидна цена за малката порция');
      return;
    }
    if (!newProduct.productTypeId) {
      addFlashMessage('error', 'Моля, изберете тип продукт');
      return;
    }

    setIsAddingProduct(true);
    try {
      const productData = {
        Product: newProduct.name.trim(),
        Description: newProduct.description?.trim() || null,
        ImageURL: newProduct.imageUrl?.trim() || null,
        SecondImageURL: newProduct.secondImageUrl?.trim() || null,
        IsDisabled: 0,
        SmallPrice: parseFloat(newProduct.smallPrice),
        MediumPrice: newProduct.mediumPrice ? parseFloat(newProduct.mediumPrice) : null,
        LargePrice: newProduct.largePrice ? parseFloat(newProduct.largePrice) : null,
        ProductTypeID: parseInt(newProduct.productTypeId),
        SortOrder: newProduct.sortOrder ? parseInt(newProduct.sortOrder) : 0
      };
      
      const savedProduct = await upsertProductClient(productData);
      
      const productWithType = {
        id: savedProduct.ProductID,
        name: savedProduct.Product,
        description: savedProduct.Description,
        imageUrl: savedProduct.ImageURL,
        secondImageUrl: savedProduct.SecondImageURL,
        isDisabled: savedProduct.IsDisabled === 1,
        isNoAddOns: savedProduct.IsNoAddOns || false,
        smallPrice: savedProduct.SmallPrice,
        mediumPrice: savedProduct.MediumPrice,
        largePrice: savedProduct.LargePrice,
        productTypeId: savedProduct.ProductTypeID,
        productType: getProductTypeName(savedProduct.ProductTypeID || 0),
        sortOrder: savedProduct.SortOrder || 0,
        isDeleted: savedProduct.isDeleted === 1 || savedProduct.isDeleted === true
      };
      
      setProducts([...products, productWithType]);
      setNewProduct({ 
        name: "", 
        description: "", 
        smallPrice: "", 
        mediumPrice: "", 
        largePrice: "", 
        productTypeId: "", 
        imageUrl: "",
        secondImageUrl: "",
        sortOrder: "0"
      });
      setIsModalOpen(false);
      addFlashMessage('success', 'Продуктът беше добавен успешно!');
    } catch {
      addFlashMessage('error', 'Грешка при добавяне на продукта.');
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
      imageUrl: "",
      secondImageUrl: "",
      sortOrder: "0"
    });
    setImageUploadError(null);
    setIsAddingProduct(false);
  };

  // Price formatting
  const formatPriceWithEuro = (bgnPrice: number): string => {
    return `${bgnPrice.toFixed(2)} лв`;
  };

  // Autocomplete functions
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
    setCurrentPage(1);
    
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
    setCurrentPage(1);
  };

  const clearFilters = (): void => {
    setFilters({ searchQuery: '', selectedCategoryId: '' });
    setAppliedQuery('');
    setAutocomplete({ suggestions: [], showSuggestions: false, selectedIndex: -1 });
    setShowDeletedProducts(false);
    setCurrentPage(1);
  };

  const applyFilters = (): void => {
    setAppliedQuery(filters.searchQuery.trim());
    setCurrentPage(1);
  };

  // Filtering logic
  const filteredProducts: Product[] = products.filter((product: Product) => {
    const q = appliedQuery.toLowerCase().trim();
    const name = product.name.toLowerCase();
  
    const tokens = q.split(/\s+/).filter(Boolean);
    const searchMatch: boolean = q === '' || tokens.every(t => name.includes(t));
  
    const categoryMatch: boolean =
      filters.selectedCategoryId === '' ||
      product.productTypeId === filters.selectedCategoryId;
  
    const notMarkedForDeletion: boolean = !product.isMarkedForDeletion;
    const deletedFilter: boolean = showDeletedProducts ? product.isDeleted === true : product.isDeleted !== true;
  
    return searchMatch && categoryMatch && notMarkedForDeletion && deletedFilter;
  });

  // Pagination logic
  const productsPerPage: number = isMobile ? productsPerPageMobile : productsPerPageDesktop;
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
  const inflect = (name) => {
    const n = (name ?? "").trim();
    if (!n) return "";
    if (n.toLowerCase() === "продукти") return n.slice(0, -1);     
    return  `${n.slice(0, -1)}а`; 
  };
  // Generate pagination items
  const generatePaginationItems = (): (number | string)[] => {
    const items: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      
      if (currentPage <= 4) {
        for (let i = 2; i <= 5; i++) {
          items.push(i);
        }
        items.push('...');
        items.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        items.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
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
              Търсене на {tabName}
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  setTimeout(() => {
                    setAutocomplete(prev => ({ ...prev, showSuggestions: false }));
                  }, 200);
                }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                placeholder={`Въведете име на ${tabName.slice(0, -1)} ...`}
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
                className="w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-xl text-white text-base leading-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
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
                className="inline-flex h-10 sm:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl bg-orange-600 hover:bg-orange-700 px-3 sm:px-4 text-white text-sm sm:text-base font-medium leading-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 w-full sm:w-auto mt-7 sm:mt-0"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="hidden xs:inline">Филтрирай</span>
                <span className="xs:hidden">Филтър</span>
              </button>
              <button
                onClick={clearFilters}
                className="inline-flex h-10 sm:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl bg-gray-600 hover:bg-gray-700 px-3 sm:px-4 text-white text-sm sm:text-base font-medium leading-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full sm:w-auto mt-7 sm:mt-0"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline">Изчисти</span>
                <span className="xs:hidden">Изчисти</span>
              </button>
              <button
                onClick={toggleDeletedProducts}
                className={`inline-flex h-10 sm:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl px-2 sm:px-4 text-white text-sm sm:text-base font-medium leading-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto mt-7 sm:mt-0 ${
                  showDeletedProducts 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                    : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                }`}
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{showDeletedProducts ? 'Покажи активни' : 'Изтрити'}</span>
                <span className="sm:hidden">{showDeletedProducts ? 'Активни' : 'Изтр.'}</span>
              </button>
            </div>
          </div>

          {/* Filter Results Info */}
          {(filters.searchQuery || filters.selectedCategoryId || showDeletedProducts) && (
            <div className="bg-gray-700 rounded-xl p-3 border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  Показани {filteredProducts.length} от {products.length} {tabName}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
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
                  {showDeletedProducts && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded-lg">
                      <Trash2 className="w-3 h-3" />
                      Изтрити {tabName}
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
          <span className="hidden xs:inline">Добави {inflect(tabName)}</span>
          <span className="xs:hidden">Добави {inflect(tabName)}</span>
        </button>
      </div>

      {/* Flash Messages */}
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

      {/* Tracking Changes Section */}
      {trackedChanges.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white leading-tight">
                  Проследяване на промени
                </h3>
                <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                  {trackedChanges.length} промен{trackedChanges.length > 1 ? 'и' : 'а'} в очакване
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleSaveAllChanges}
                disabled={isDeletingProducts}
                className="flex-1 inline-flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-800 disabled:to-emerald-800 disabled:cursor-not-allowed px-4 sm:px-6 py-3 sm:py-4 text-white text-sm sm:text-base font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-xl hover:shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 active:scale-95 min-h-[48px] sm:min-h-[52px]"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-bold">Запази всички</span>
              </button>
              <button
                onClick={handleUndoAllChanges}
                disabled={isDeletingProducts}
                className="flex-1 inline-flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-gray-800 disabled:to-slate-800 disabled:cursor-not-allowed px-4 sm:px-6 py-3 sm:py-4 text-white text-sm sm:text-base font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-xl hover:shadow-2xl hover:shadow-red-500/25 transform hover:scale-105 active:scale-95 min-h-[48px] sm:min-h-[52px]"
              >
                <Undo2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-bold">Отмени всички</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
            {trackedChanges.map((change: TrackedChange) => (
              <div 
                key={change.id}
                className={`rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-5 border-2 transition-all duration-300 overflow-hidden flex flex-col h-full shadow-lg hover:shadow-xl transform hover:scale-[1.02] sm:hover:scale-105 active:scale-95 min-h-[140px] sm:min-h-[160px] md:min-h-[180px] lg:min-h-[200px] ${
                  change.changeType === 'delete' 
                    ? 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-500/60 hover:from-red-900/50 hover:to-rose-900/50 hover:border-red-400/80 hover:shadow-red-500/25' 
                    : change.changeType === 'restore'
                    ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/60 hover:from-blue-900/50 hover:to-indigo-900/50 hover:border-blue-400/80 hover:shadow-blue-500/25'
                    : 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/60 hover:from-green-900/50 hover:to-emerald-900/50 hover:border-green-400/80 hover:shadow-green-500/25'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-xs sm:text-sm md:text-base lg:text-lg leading-tight mb-1 sm:mb-2 overflow-hidden ${
                      change.changeType === 'delete' ? 'text-red-100' : change.changeType === 'restore' ? 'text-blue-100' : 'text-green-100'
                    }`} style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                      {change.productName}
                    </h4>
                    <p className={`text-xs sm:text-sm font-medium ${
                      change.changeType === 'delete' ? 'text-red-300' : change.changeType === 'restore' ? 'text-blue-300' : 'text-green-300'
                    }`}>
                      {change.productType}
                    </p>
                  </div>
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 mt-0.5 sm:mt-1 shadow-lg ${
                    change.changeType === 'delete' ? 'bg-red-400 shadow-red-400/50' : change.changeType === 'restore' ? 'bg-blue-400 shadow-blue-400/50' : 'bg-green-400 shadow-green-400/50'
                  }`} />
                </div>
                  
                <div className="mb-3 sm:mb-4">
                  <span className={`inline-block text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-full shadow-md ${
                    change.changeType === 'delete' 
                      ? 'bg-red-600/80 text-red-100 shadow-red-600/30' 
                      : change.changeType === 'restore'
                      ? 'bg-blue-600/80 text-blue-100 shadow-blue-600/30'
                      : 'bg-green-600/80 text-green-100 shadow-green-600/30'
                  }`}>
                    {change.changeType === 'delete' ? 'Изтриване' : change.changeType === 'restore' ? 'Възстановяване' : 'Обновяване'}
                  </span>
                </div>
                
                <button
                  onClick={() => handleUndoChange(change.id)}
                  className={`w-full inline-flex items-center justify-center gap-1 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 mt-auto shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-h-[36px] sm:min-h-[40px] md:min-h-[44px] ${
                    change.changeType === 'delete'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-red-100 focus:ring-red-500 hover:shadow-red-500/30'
                      : change.changeType === 'restore'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-blue-100 focus:ring-blue-500 hover:shadow-blue-500/30'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-green-100 focus:ring-green-500 hover:shadow-green-500/30'
                  }`}
                >
                  <Undo2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Отмяна</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="w-full grid min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">

        {currentProducts.map((product: Product) => (
          <div 
            key={product.id} 
            className={`bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-2 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-4 lg:p-6 transition-all duration-300 group flex flex-col shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 ${
              product.isDisabled ? 'border-gray-600/50 opacity-60' : `border-gray-700/50 ${colors.border} hover:border-orange/30`
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
            <div className="relative w-full h-24 sm:h-32 lg:h-48 bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-lg sm:rounded-xl lg:rounded-2xl mb-2 sm:mb-4 lg:mb-5 flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-all duration-300">
              {product.imageUrl ? (
                <>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg sm:rounded-xl lg:rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      const nextElement = target.nextElementSibling as HTMLElement;
                      target.style.display = 'none';
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg sm:rounded-xl lg:rounded-2xl"></div>
                </>
              ) : null}
              <div className={`w-full h-full items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
                <Package className={`w-8 h-8 sm:w-12 sm:h-12 lg:w-20 lg:h-20 transition-all duration-300 group-hover:scale-110 ${
                  product.isDisabled 
                    ? 'text-gray-500' 
                    : `text-gray-600 ${colors.text} group-hover:text-orange`
                }`} />
              </div>
            </div>

            {/* Product Info - Flex container to push actions to bottom */}
            <div className="flex-1 flex flex-col">
              {/* Content Section */}
              <div className="flex-1 space-y-1 sm:space-y-2 lg:space-y-3">
                {/* Product Name and Type - Single Line */}
                <div className="space-y-1">
                  <h3 className={`font-bold leading-tight transition-colors duration-300 overflow-hidden ${
                    product.isDisabled ? 'text-gray-500' : `text-white ${colors.text} group-hover:text-orange`
                  } text-xs sm:text-sm lg:text-lg`} style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                    {product.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange opacity-60"></span>
                      <p className="text-xs text-gray-400 font-medium">{product.productType}</p>
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 truncate max-w-full sm:max-w-[100px]" title={product.description}>
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Price Fields - Individual Row Layout */}
                <div className="space-y-1 sm:space-y-2">
                  {/* Small Price - Full Width Row */}
                  <div className="flex items-center justify-between p-1.5 sm:p-2 lg:p-4 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-md sm:rounded-lg border border-gray-600/30 hover:border-green-500/50 transition-all duration-300 group/price">
                    <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover/price:shadow-green-500/30 transition-all duration-300">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <span className="text-xs sm:text-sm lg:text-base text-gray-300 font-semibold">Малка</span>
                    </div>
                    <span className="text-xs sm:text-sm lg:text-base font-bold text-green-400 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
                      {product.smallPrice ? formatPriceWithEuro(product.smallPrice) : 'N/A'}
                    </span>
                  </div>
                  
                  {/* Medium Price - Full Width Row */}
                  {product.mediumPrice && (
                    <div className="flex items-center justify-between p-1.5 sm:p-2 lg:p-4 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-md sm:rounded-lg border border-gray-600/30 hover:border-orange-500/50 transition-all duration-300 group/price">
                      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-lg group-hover/price:shadow-orange-500/30 transition-all duration-300">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                        <span className="text-xs sm:text-sm lg:text-base text-gray-300 font-semibold">Средна</span>
                      </div>
                      <span className="text-xs sm:text-sm lg:text-base font-bold text-orange-400 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent whitespace-nowrap">
                        {formatPriceWithEuro(product.mediumPrice)}
                      </span>
                    </div>
                  )}
                  
                  {/* Large Price - Full Width Row */}
                  {product.largePrice && (
                    <div className="flex items-center justify-between p-1.5 sm:p-2 lg:p-4 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-md sm:rounded-lg border border-gray-600/30 hover:border-red-500/50 transition-all duration-300 group/price">
                      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 bg-gradient-to-r from-red-600 to-rose-600 rounded-full flex items-center justify-center shadow-lg group-hover/price:shadow-red-500/30 transition-all duration-300">
                          <span className="text-white text-xs font-bold">L</span>
                        </div>
                        <span className="text-xs sm:text-sm lg:text-base text-gray-300 font-semibold">Голяма</span>
                      </div>
                      <span className="text-xs sm:text-sm lg:text-base font-bold text-red-400 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent whitespace-nowrap">
                        {formatPriceWithEuro(product.largePrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions - Always at bottom */}
              <div className="flex flex-col space-y-2 sm:space-y-3 lg:space-y-4 mt-2 sm:mt-4 lg:mt-6">
                <div className="flex flex-col gap-1.5 sm:gap-2 lg:gap-3">
                  <button 
                    className="w-full inline-flex h-8 sm:h-10 lg:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-2 sm:px-3 lg:px-6 text-xs sm:text-sm lg:text-base font-semibold text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg hover:shadow-xl hover:shadow-green-500/25 transform hover:scale-105 active:scale-95"
                    onClick={(): void => handleEditProduct(product.id)}
                    disabled={product.isDisabled || false}
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Промени</span>
                  </button>
                  {product.isDeleted ? (
                    <button 
                      className="w-full inline-flex h-8 sm:h-10 lg:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-2 sm:px-3 lg:px-6 text-xs sm:text-sm lg:text-base font-semibold text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 active:scale-95"
                      onClick={(): void => { handleRestoreProduct(product.id); }}
                    >
                      <Undo2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Отмяна</span>
                    </button>
                  ) : (
                    <button 
                      className="w-full inline-flex h-8 sm:h-10 lg:h-12 items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 px-2 sm:px-3 lg:px-6 text-xs sm:text-sm lg:text-base font-semibold text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 shadow-lg hover:shadow-xl hover:shadow-red-500/25 transform hover:scale-105 active:scale-95"
                      onClick={(): void => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Изтрий</span>
                    </button>
                  )}
                </div>

                {/* Disable Checkbox */}
                <label className="flex items-center justify-center space-x-1.5 sm:space-x-2 lg:space-x-3 cursor-pointer p-2 sm:p-3 lg:p-4 bg-gray-800/30 rounded-lg sm:rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 group/toggle">
                  <input
                    type="checkbox"
                    checked={product.isDisabled || false}
                    onChange={(): void => { handleToggleProductStatus(product.id); }}
                    className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <span className="text-xs sm:text-sm text-gray-400">
                    {'Скрито'}
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
          <div className="text-sm text-gray-400 text-center px-4">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} {tabName}
            {(filters.searchQuery || filters.selectedCategoryId) && (
              <span className="block text-xs text-gray-500 mt-1">
                (filtered from {products.length} total {tabName})
              </span>
            )}
          </div>
          
          <div className="w-full max-w-sm mx-auto">
            <div className="flex items-center justify-between bg-gray-800 rounded-2xl p-2 border border-gray-600">
              <button
                onClick={(): void => handlePreviousPage()}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-700 border border-gray-600 text-gray-300 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:hover:border-gray-600 disabled:hover:text-gray-300"
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

            <div className="hidden sm:flex items-center justify-center space-x-2 mt-4">
              <button
                onClick={(): void => handlePreviousPage()}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-800 border border-gray-600 text-gray-300 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:border-gray-600 disabled:hover:text-gray-300"
              >
                ←
              </button>

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
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
    {/* Панелът е flex колона; header и footer са фиксирани, body се скролира */}
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[95dvh] sm:max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Добавяне на {inflect(tabName)}
        </h2>
        <button
          onClick={handleCloseModal}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <form
          id="addProductForm"
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            await handleAddProduct();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Име на {tabName.slice(0, -1)}а
            </label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('name', e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              placeholder={`Име на ${tabName.slice(0, -1)}а`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Описание (опционално)
            </label>
            <textarea
              value={newProduct.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange('description', e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              placeholder={`Описание на ${tabName.slice(0, -1)}а`}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Тип продукт
            </label>
            <select
              value={newProduct.productTypeId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleInputChange('productTypeId', e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
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
              Ред на сортиране
            </label>
            <input
              type="number"
              step="1"
              value={newProduct.sortOrder}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('sortOrder', e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-400">
              По-ниските числа се показват първи в категорията
            </p>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('smallPrice', e.target.value)
                }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('mediumPrice', e.target.value)
                }
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('largePrice', e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Изображение на {tabName.slice(0, -1)}а (опционално)
            </label>
            <ImageUpload
              value={newProduct.imageUrl}
              onChange={handleImageUpload}
              onError={handleImageUploadError}
              placeholder={`Качете изображение на ${tabName.slice(0, -1)}а`}
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Второ изображение за hover ефект (опционално)
            </label>
            <ImageUpload
              value={newProduct.secondImageUrl}
              onChange={handleSecondImageUpload}
              onError={handleImageUploadError}
              placeholder={`Качете второ изображение`}
              maxSize={5}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-400">
              Това изображение ще се показва при hover/touch
            </p>
          </div>
        </form>
      </div>

      {/* Footer – винаги видим на телефон */}
      <div className="shrink-0 sticky bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-2">
          <button
            form="addProductForm"
            type="submit"
            disabled={isAddingProduct}
            className="min-h-11 sm:min-h-12 rounded-xl w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 flex items-center justify-center gap-2"
          >
            {isAddingProduct ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Добавяне.
              </>
            ) : (
              'Добави'
            )}
          </button>
          <button
            type="button"
            onClick={handleCloseModal}
            disabled={isAddingProduct}
            className="min-h-11 sm:min-h-12 rounded-xl w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-gray-100 font-semibold px-4"
          >
            Прекратяване
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        product={editingProduct}
        onSave={handleSaveProduct}
        categoryOptions={categoryOptions}
      />
    </div>
  );
};

export default ProductListManager;
