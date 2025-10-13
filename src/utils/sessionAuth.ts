/**
 * Temporary session authentication
 * TODO: Replace with proper httpOnly cookie sessions
 */

import { NextRequest } from 'next/server'

/**
 * Extract and validate user session from request
 * For now, accepts X-User-ID header (client sends their ID)
 * This is TEMPORARY and not fully secure
 * 
 * TODO: Implement proper httpOnly cookie-based sessions
 */
export async function validateUserSession(
  request: NextRequest,
  requestedUserId: number
): Promise<{ isValid: boolean; userId?: number; error?: string }> {
  // Get user ID from header (temporary approach)
  const headerUserId = request.headers.get('x-user-id')
  
  if (!headerUserId) {
    return {
      isValid: false,
      error: 'Authentication required - Please login'
    }
  }

  const sessionUserId = parseInt(headerUserId, 10)
  
  if (isNaN(sessionUserId)) {
    return {
      isValid: false,
      error: 'Invalid session'
    }
  }

  // Check if requesting user owns the resource
  if (sessionUserId !== requestedUserId) {
    console.warn('🚨 AUTHORIZATION VIOLATION ATTEMPT:', {
      timestamp: new Date().toISOString(),
      sessionUserId,
      requestedUserId,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return {
      isValid: false,
      error: 'Unauthorized - You can only access your own data'
    }
  }

  return {
    isValid: true,
    userId: sessionUserId
  }
}

/**
 * For public endpoints (like order confirmation)
 * No authentication needed
 */
export function isPublicEndpoint(path: string): boolean {
  const publicPaths = [
    '/api/order/confirm',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/health',
    '/api/test-db'
  ]
  
  return publicPaths.some(p => path.includes(p))
}

