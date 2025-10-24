/**
 * Authentication utilities for admin panel
 */

/**
 * Check if user is authenticated as admin
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin_authenticated') === 'true';
}

/**
 * Get admin login time
 */
export function getLoginTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_login_time');
}

/**
 * Clear authentication data and logout
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('admin_authenticated');
  localStorage.removeItem('admin_login_time');
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
}

/**
 * Set authentication data
 */
export function setAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('admin_authenticated', 'true');
  localStorage.setItem('admin_login_time', new Date().toISOString());
}

/**
 * Check if authentication has expired (optional - for future use)
 */
export function isAuthExpired(): boolean {
  if (typeof window === 'undefined') return true;
  
  const loginTime = getLoginTime();
  if (!loginTime) return true;
  
  const loginDate = new Date(loginTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
  
  // Consider auth expired after 24 hours
  return hoursDiff > 24;
}

/**
 * Get admin access token for API requests
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_access_token');
}

/**
 * Get admin refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_refresh_token');
}




