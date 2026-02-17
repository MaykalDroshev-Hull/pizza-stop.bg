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

/**
 * Handle unauthorized responses by clearing auth and redirecting to login
 */
function handleUnauthorized(response: Response): void {
  if (response.status === 401 || response.status === 403) {
    // Clear authentication
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_login_time');
    
    // Redirect to login
    window.location.href = '/login-admin';
  }
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
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
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
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
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
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
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
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
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
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
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
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}