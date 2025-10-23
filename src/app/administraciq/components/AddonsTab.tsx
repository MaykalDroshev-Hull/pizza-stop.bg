import { getAddons } from "../services/productService.client";
import ProductListManager from "../mixin/ProductListManager";

// Category options for addons (ProductTypeID: 5, 6)
const categoryOptions = [
  { id: 5, name: 'Сосове' },
  { id: 6, name: 'Добавки' }
];

// Product type mapping function for addons
const getProductTypeName = (productTypeId: number): string => {
  switch (productTypeId) {
    case 5:
      return 'Сос';
    case 6:
      return 'Добавка';
    default:
      return 'Неизвестно';
  }
};

const AddonsTab = (): React.JSX.Element => {
  return (
    <ProductListManager
      fetchProducts={getAddons}
      categoryOptions={categoryOptions}
      getProductTypeName={getProductTypeName}
      accentColor="green"
      tabName="добавки"
      productsPerPageDesktop={8}
      productsPerPageMobile={6}
    />
  );
};

export default AddonsTab;
