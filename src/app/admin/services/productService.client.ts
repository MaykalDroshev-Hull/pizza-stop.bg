// Database Product Type (matches server-side)
export interface DatabaseProduct {
  ProductID: number;
  Product: string;
  Description?: string | null;
  ImageURL?: string | null;
  IsDisabled?: number;
  SmallPrice?: number | null;
  MediumPrice?: number | null;
  LargePrice?: number | null;
  ProductTypeID?: number | null;
  isDeleted?: number | boolean;
}

/**
 * Check if admin is authenticated and get auth token
 */
function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  // Check if admin is logged in
  const isAdminLoggedIn = localStorage.getItem('admin_authenticated') === 'true';

  if (!isAdminLoggedIn) {
    throw new Error('Unauthorized - Admin access required');
  }

  // Get the admin API token from environment (it should be available on client-side)
  // Note: In production, this should come from a secure source, not exposed to client
  const adminToken = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN;

  if (!adminToken) {
    console.error('Admin API token not found. Please set NEXT_PUBLIC_ADMIN_API_TOKEN environment variable.');
    throw new Error('Admin configuration error');
  }

  return {
    'x-admin-auth': adminToken,
    'Content-Type': 'application/json'
  };
}

export async function getProductsClient(): Promise<DatabaseProduct[]> {
  const headers = getAdminAuthHeaders();
  const res = await fetch('/api/admin/products', {
    cache: 'no-store',
    headers
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
  const headers = getAdminAuthHeaders();
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers,
    body: JSON.stringify(p),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DatabaseProduct;
}

export async function setProductDisabledClient(id: number, isDisabled: boolean) {
  const headers = getAdminAuthHeaders();
  const res = await fetch('/api/admin/products', {
    method: 'PUT',
    headers,
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
  const headers = getAdminAuthHeaders();
  const res = await fetch('/api/admin/products', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DeleteProductsResponse;
}

export async function softDeleteProductsClient(ids: number[]): Promise<{ success: boolean; message: string }> {
  const headers = getAdminAuthHeaders();
  const res = await fetch('/api/admin/products/soft-delete', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}

export async function restoreProductsClient(ids: number[]): Promise<{ success: boolean; message: string }> {
  const headers = getAdminAuthHeaders();
  const res = await fetch('/api/admin/products/restore', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}