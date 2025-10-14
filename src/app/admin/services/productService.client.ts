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
 * Get admin authentication token for API calls
 */
async function getAdminAuthToken(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot get auth token on server side');
  }

  // Check if admin is logged in
  const isAdminLoggedIn = localStorage.getItem('admin_authenticated') === 'true';

  if (!isAdminLoggedIn) {
    throw new Error('Unauthorized - Admin access required');
  }

  // Get Supabase session for access token
  const { supabase } = await import('@/lib/supabase');
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('No valid session found - please log in again');
  }

  return session.access_token;
}

/**
 * Check if admin is authenticated for client-side validation
 */
async function validateAdminAuth(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  // Check if admin is logged in
  const isAdminLoggedIn = localStorage.getItem('admin_authenticated') === 'true';

  if (!isAdminLoggedIn) {
    throw new Error('Unauthorized - Admin access required');
  }

  // Validate session exists
  await getAdminAuthToken();
}

export async function getProductsClient(): Promise<DatabaseProduct[]> {
  await validateAdminAuth();
  const authToken = await getAdminAuthToken();
  const res = await fetch('/api/admin/products', {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': authToken
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
  await validateAdminAuth();
  const authToken = await getAdminAuthToken();
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': authToken
    },
    body: JSON.stringify(p),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DatabaseProduct;
}

export async function setProductDisabledClient(id: number, isDisabled: boolean) {
  await validateAdminAuth();
  const authToken = await getAdminAuthToken();
  const res = await fetch('/api/admin/products', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': authToken
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
  await validateAdminAuth();
  const authToken = await getAdminAuthToken();
  const res = await fetch('/api/admin/products', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': authToken
    },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DeleteProductsResponse;
}

export async function softDeleteProductsClient(ids: number[]): Promise<{ success: boolean; message: string }> {
  await validateAdminAuth();
  const authToken = await getAdminAuthToken();
  const res = await fetch('/api/admin/products/soft-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': authToken
    },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}

export async function restoreProductsClient(ids: number[]): Promise<{ success: boolean; message: string }> {
  await validateAdminAuth();
  const authToken = await getAdminAuthToken();
  const res = await fetch('/api/admin/products/restore', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-auth': authToken
    },
    body: JSON.stringify({ ids }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}