import { getDrinks } from "../services/productService.client";
import ProductListManager from "../mixin/ProductListManager";

// Category options for beverages (ProductTypeID: 4)
const categoryOptions = [
  { id: 4, name: 'Напитки' }
];

// Product type mapping function for beverages
const getProductTypeName = (productTypeId: number): string => {
  switch (productTypeId) {
    case 4:
      return 'Напитки';
    default:
      return 'Неизвестно';
  }
};

const BeverageTab = (): React.JSX.Element => {
  return (
    <ProductListManager
      fetchProducts={getDrinks}
      categoryOptions={categoryOptions}
      getProductTypeName={getProductTypeName}
      accentColor="blue"
      tabName="напитки"
      productsPerPageDesktop={9}
      productsPerPageMobile={6}
    />
  );
};

export default BeverageTab;
