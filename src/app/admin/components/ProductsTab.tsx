"use client";

import { getProductsForProductsTab } from "../services/productService.client";
import ProductListManager from "../mixin/ProductListManager";

// Category options for filter dropdown
const categoryOptions = [
  { id: 1, name: 'Пици' },
  { id: 2, name: 'Бургери' },
  { id: 3, name: 'Дюнери' },
  { id: 7, name: 'Десерти' }
];

// Product type mapping function
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
    return'Сосове';
    case 6:
      return 'Добавки';
    default:
      return 'Неизвестно';
  }
};

const ProductsTab: React.FC = (): React.JSX.Element => {
  return (
    <ProductListManager
      fetchProducts={getProductsForProductsTab}
      categoryOptions={categoryOptions}
      getProductTypeName={getProductTypeName}
      accentColor="red"
      tabName="продукти"
      productsPerPageDesktop={8}
      productsPerPageMobile={6}
    />
  );
};

export default ProductsTab;
