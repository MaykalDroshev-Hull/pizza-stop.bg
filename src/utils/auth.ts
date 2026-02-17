/**
 * JWT Authentication utility
 * Handles token generation, verification, and request authentication
 */

import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// JWT secret key - MUST be set in environment variables
function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

// Token expiration: 7 days
const TOKEN_EXPIRATION = '7d'

interface TokenPayload {
  userId: number
  email: string
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(userId: number, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(getJwtSecret())

  return token
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return {
      userId: payload.userId as number,
      email: payload.email as string
    }
  } catch {
    return null
  }
}

/**
 * Extract and verify the authenticated user from a request
 * Returns the user's LoginID and email, or an error response
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  error: string | null
  status: number
  user: { LoginID: number; email: string } | null
}> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Неоторизиран достъп - моля, влезте в акаунта си', status: 401, user: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = await verifyToken(token)

  if (!payload) {
    return { error: 'Невалидна или изтекла сесия', status: 401, user: null }
  }

  return {
    error: null,
    status: 200,
    user: { LoginID: payload.userId, email: payload.email }
  }
}

/**
 * Helper: return a JSON error response for auth failures
 */
export function authErrorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

/**
 * Sanitize a string by rejecting HTML tags and SQL-like patterns
 * Returns { safe: true } or { safe: false, reason: string }
 */
export function sanitizeInput(value: string, fieldName: string): { safe: boolean; reason?: string } {
  // Reject HTML/script tags
  if (/<[^>]*>/i.test(value)) {
    return { safe: false, reason: `${fieldName} не може да съдържа HTML тагове или скрипт код` }
  }

  // Reject dangerous SQL patterns
  if (/(\bdrop\b|\bdelete\b|\binsert\b|\bupdate\b|\bselect\b|\bunion\b|--|;)/i.test(value)) {
    return { safe: false, reason: `${fieldName} съдържа невалидни символи` }
  }

  return { safe: true }
}

/**
 * Client-side authentication functions for admin panel
 * These functions work with localStorage and can only be used in client components
 */

/**
 * Check if admin is authenticated (client-side only)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin_authenticated') === 'true'
}

/**
 * Get admin access token from localStorage (client-side only)
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_access_token')
}

/**
 * Clear all admin authentication data from localStorage (client-side only)
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_authenticated')
  localStorage.removeItem('admin_access_token')
  localStorage.removeItem('admin_refresh_token')
  localStorage.removeItem('admin_login_time')
}