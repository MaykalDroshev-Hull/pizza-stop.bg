/**
 * Fetch wrapper that automatically adds authorization headers
 * Use this for authenticated API calls
 */

export interface FetchWithAuthOptions extends RequestInit {
  headers?: HeadersInit
}

/**
 * Makes authenticated fetch request with user authorization header
 * Automatically adds X-User-ID header from localStorage
 */
export async function fetchWithAuth(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null

  const headers = new Headers(options.headers || {})
  
  // Add user authorization header if available
  if (userId) {
    headers.set('X-User-ID', userId)
  }

  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Makes authenticated fetch request with admin authorization header
 * For admin API calls
 */
export async function fetchWithAdminAuth(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''

  const headers = new Headers(options.headers || {})
  
  if (adminToken) {
    headers.set('X-Admin-Auth', adminToken)
  }

  return fetch(url, {
    ...options,
    headers
  })
}








