/**
 * Rate limiting utilities using Upstash Redis
 * Protects API endpoints from abuse
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// Initialize Redis client (only if env vars are set)
let redis: Redis | null = null
let rateLimiters: Record<string, Ratelimit> | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Define rate limiters for different endpoints
    rateLimiters = {
      // Authentication endpoints - strict limits
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: 'ratelimit:login',
      }),
      
      // Registration - moderate limits
      register: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'ratelimit:register',
      }),
      
      // Order placement - prevent spam
      order: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        analytics: true,
        prefix: 'ratelimit:order',
      }),
      
      // Password reset - strict limits
      passwordReset: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'ratelimit:password-reset',
      }),
      
      // Admin actions - very strict
      admin: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        analytics: true,
        prefix: 'ratelimit:admin',
      }),
      
      // Contact form - prevent spam
      contact: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'),
        analytics: true,
        prefix: 'ratelimit:contact',
      }),
      
      // General API - lenient
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api',
      }),
    }

    console.log('✅ Rate limiting initialized with Upstash Redis')
  } else {
    console.warn('⚠️ Rate limiting disabled - UPSTASH_REDIS environment variables not set')
  }
} catch (error) {
  console.error('❌ Failed to initialize rate limiting:', error)
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // Fallback
  return '0.0.0.0'
}

/**
 * Check rate limit for a request
 * Returns { success: true } if allowed, or { success: false, reset: timestamp } if blocked
 */
export async function checkRateLimit(
  limiterType: 'login' | 'register' | 'order' | 'passwordReset' | 'admin' | 'contact' | 'api',
  identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number; retryAfter?: number }> {
  // If rate limiting is not configured, allow all requests
  if (!rateLimiters || !rateLimiters[limiterType]) {
    console.warn(`⚠️ Rate limiting bypassed for ${limiterType} - not configured`)
    return { success: true }
  }

  try {
    const result = await rateLimiters[limiterType].limit(identifier)
    
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
      console.warn(`🚫 Rate limit exceeded for ${limiterType}:${identifier}`, {
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset).toISOString(),
        retryAfter
      })
      
      return {
        success: false,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter
      }
    }
    
    return {
      success: true,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    }
  } catch (error) {
    console.error(`❌ Rate limit check failed for ${limiterType}:${identifier}:`, error)
    // On error, allow the request but log the issue
    return { success: true }
  }
}

/**
 * Rate limit middleware wrapper for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  limiterType: 'login' | 'register' | 'order' | 'passwordReset' | 'admin' | 'contact' | 'api',
  customIdentifier?: string
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const ip = getClientIp(request)
  const identifier = customIdentifier || `${limiterType}:${ip}`
  
  const result = await checkRateLimit(limiterType, identifier)
  
  const headers: Record<string, string> = {}
  
  if (result.limit !== undefined) {
    headers['X-RateLimit-Limit'] = result.limit.toString()
  }
  
  if (result.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = result.remaining.toString()
  }
  
  if (result.reset !== undefined) {
    headers['X-RateLimit-Reset'] = result.reset.toString()
  }
  
  if (!result.success && result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString()
  }
  
  return {
    allowed: result.success,
    headers
  }
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(headers: Record<string, string>) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: headers['Retry-After'] ? parseInt(headers['Retry-After']) : undefined
      }
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  )
}






