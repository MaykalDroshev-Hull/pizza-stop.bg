// Database Product Type (matches server-side)
export interface DatabaseProduct {
  ProductID: number;
  Product: string;
  Description?: string | null;
  ImageURL?: string | null;
  SecondImageURL?: string | null; // Second image for hover effect
  IsDisabled?: number;
  IsNoAddOns?: boolean;
  SmallPrice?: number | null;
  MediumPrice?: number | null;
  LargePrice?: number | null;
  ProductTypeID?: number | null;
  SortOrder?: number | null;
  isDeleted?: number | boolean;
}

/**
 * Get JWT token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_access_token');
}

export async function getProductsClient(): Promise<DatabaseProduct[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated - please log in again');
  }

  const res = await fetch('/api/administraciq/products', { 
    cache: 'no-store',
    headers: {
      'x-admin-auth': token
    }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DatabaseProduct[];
}

// Filter products for ProductsTab (ProductTypeID: 1, 2, 3, 7)
export async function getProductsForProductsTab(): Promise<DatabaseProduct[]> {
  const allProducts = await getProductsClient();
  return allProducts.filter((product: DatabaseProduct) => 
    product.ProductTypeID === 1 || 
    product.ProductTypeID === 2 || 
    product.ProductTypeID === 3 || 
    product.ProductTypeID === 7
  );
}

// Filter drinks (ProductTypeID: 4)
export async function getDrinks(): Promise<DatabaseProduct[]> {
  const allProducts = await getProductsClient();
  return allProducts.filter((product: DatabaseProduct) => product.ProductTypeID === 4);
}

// Filter add-ons (ProductTypeID: 5, 6)
export async function getAddons(): Promise<DatabaseProduct[]> {
  const allProducts = await getProductsClient();
  return allProducts.filter((product: DatabaseProduct) => 
    product.ProductTypeID === 5 || product.ProductTypeID === 6
  );
}

export async function upsertProductClient(p: Partial<DatabaseProduct>): Promise<DatabaseProduct> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated - please log in again');
  }

  const res = await fetch('/api/administraciq/products', {
    method: 'POST', 
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-auth': token
    },
    body: JSON.stringify(p),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DatabaseProduct;
}

export async function setProductDisabledClient(id: number, isDisabled: boolean) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated - please log in again');
  }

  const res = await fetch('/api/administraciq/products', {
    method: 'PUT', 
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-auth': token
    },
    body: JSON.stringify({ id, isDisabled }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}

export interface DeleteProductsResponse {
  success: boolean;
  deleted: number[];
  disabled: number[];
  message: string;
  deletedCount: number;
}

export async function deleteProductsClient(ids: number[]): Promise<DeleteProductsResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated - please log in again');
  }

  const res = await fetch('/api/administraciq/products', {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-auth': token
    },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DeleteProductsResponse;
}

export async function softDeleteProductsClient(ids: number[]): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated - please log in again');
  }

  const res = await fetch('/api/administraciq/products/soft-delete', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-auth': token
    },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}

export async function restoreProductsClient(ids: number[]): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated - please log in again');
  }

  const res = await fetch('/api/administraciq/products/restore', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-auth': token
    },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}