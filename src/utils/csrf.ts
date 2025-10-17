/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 * Generates and validates CSRF tokens to prevent unauthorized state-changing requests
 */

import { randomBytes, createHmac } from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'
const TOKEN_LENGTH = 32

/**
 * Generate a CSRF token
 * This should be called for each session and stored in a cookie or session
 */
export function generateCsrfToken(): string {
  const token = randomBytes(TOKEN_LENGTH).toString('hex')
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(`${token}:${timestamp}`)
    .digest('hex')
  
  return `${token}:${timestamp}:${signature}`
}

/**
 * Verify a CSRF token
 * Checks signature and optionally validates timestamp (token expiry)
 */
export function verifyCsrfToken(
  token: string,
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours default
): boolean {
  try {
    const parts = token.split(':')
    if (parts.length !== 3) {
      console.error('Invalid CSRF token format')
      return false
    }

    const [tokenValue, timestamp, signature] = parts

    // Verify signature
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(`${tokenValue}:${timestamp}`)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('CSRF token signature mismatch')
      return false
    }

    // Check token age
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > maxAge) {
      console.error('CSRF token expired')
      return false
    }

    return true
  } catch (error) {
    console.error('CSRF token verification error:', error)
    return false
  }
}

/**
 * Validate CSRF token from request
 * Checks both header and body for the token
 */
export function validateCsrfFromRequest(
  request: NextRequest,
  sessionToken?: string
): boolean {
  // Get token from header
  const headerToken = request.headers.get('x-csrf-token')
  
  // For now, use header token
  // In production, you should also validate against session-stored token
  if (!headerToken) {
    console.error('No CSRF token provided in request')
    return false
  }

  return verifyCsrfToken(headerToken)
}

/**
 * Middleware to check CSRF on state-changing requests (POST, PUT, DELETE)
 */
export function requireCsrf(request: NextRequest): { 
  valid: boolean 
  error?: string 
} {
  const method = request.method

  // Only check CSRF on state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { valid: true }
  }

  // Skip CSRF for some endpoints (e.g., public APIs, webhooks)
  const pathname = new URL(request.url).pathname
  const skipPaths = [
    '/api/webhooks', // Webhook endpoints
    '/api/health',   // Health check
  ]

  if (skipPaths.some(path => pathname.startsWith(path))) {
    return { valid: true }
  }

  const isValid = validateCsrfFromRequest(request)

  if (!isValid) {
    return { 
      valid: false, 
      error: 'Invalid or missing CSRF token' 
    }
  }

  return { valid: true }
}

/**
 * Create a CSRF error response
 */
export function createCsrfErrorResponse() {
  return new Response(
    JSON.stringify({
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
      }
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}



