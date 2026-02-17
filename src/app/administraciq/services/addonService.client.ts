// Client-side service for Addon management in admin panel

export interface DatabaseAddon {
  AddonID?: number;
  Name: string;
  Price: number;
  ProductTypeID: number;
  AddonType: string;
  IsDisabled?: number;
  SortOrder?: number;
  SizeCategory?: string | null;
}

export interface AssignableProduct {
  ProductID: number;
  Product: string;
  ProductTypeID: number;
  IsDisabled: number;
  isDeleted: boolean | null;
}

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

// ─── Addon CRUD ───

export async function getAddonsClient(): Promise<DatabaseAddon[]> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch('/api/administraciq/addons', {
    cache: 'no-store',
    headers: { 'x-admin-auth': token }
  });
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DatabaseAddon[];
}

export async function upsertAddonClient(addon: Partial<DatabaseAddon>): Promise<DatabaseAddon> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch('/api/administraciq/addons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-auth': token },
    body: JSON.stringify(addon)
  });
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as DatabaseAddon;
}

export async function setAddonDisabledClient(id: number, isDisabled: boolean) {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch('/api/administraciq/addons', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-auth': token },
    body: JSON.stringify({ id, isDisabled })
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

export async function deleteAddonsClient(ids: number[]) {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch('/api/administraciq/addons', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-admin-auth': token },
    body: JSON.stringify({ ids })
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

// ─── Product-Addon assignment ───

export async function getProductsForAssignment(): Promise<AssignableProduct[]> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch('/api/administraciq/product-addons?products=true', {
    cache: 'no-store',
    headers: { 'x-admin-auth': token }
  });
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as AssignableProduct[];
}

export async function getAllAddonAssignmentsClient(): Promise<{ [addonId: number]: number[] }> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch('/api/administraciq/product-addons?all=true', {
    cache: 'no-store',
    headers: { 'x-admin-auth': token }
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

export async function getProductsForAddonClient(addonId: number): Promise<number[]> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch(`/api/administraciq/product-addons?addonId=${addonId}`, {
    cache: 'no-store',
    headers: { 'x-admin-auth': token }
  });
  
  // Handle unauthorized responses
  if (res.status === 401 || res.status === 403) {
    handleUnauthorized(res);
    throw new Error('Unauthorized - redirecting to login');
  }
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json.productIds;
}

export async function setProductsForAddonClient(addonId: number, productIds: number[]) {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated - please log in again');

  const res = await fetch('/api/administraciq/product-addons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-auth': token },
    body: JSON.stringify({ addonId, productIds })
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
