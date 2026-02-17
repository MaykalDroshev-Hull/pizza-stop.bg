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
let redisAvailable = false
let redisErrorLogged = false

// Fallback in-memory rate limiting (if Redis is not available)
interface MemoryRateLimit {
  count: number
  resetTime: number
}

const memoryRateLimits = new Map<string, MemoryRateLimit>()

function checkMemoryRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const stored = memoryRateLimits.get(identifier)
  
  if (!stored || stored.resetTime < now) {
    // Reset or create new entry
    memoryRateLimits.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }
  
  if (stored.count >= limit) {
    return false // Rate limit exceeded
  }
  
  stored.count++
  return true
}

// Initialize Redis only if env vars are set
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
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
      
      // Registration - strict limits: 2 registrations per 5 minutes per IP
      register: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2, '5 m'),
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
      
      // Admin login - very strict to prevent brute force
      admin: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
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
    
    // Mark Redis as available (will be verified on first use)
    redisAvailable = true
  } catch (error) {
    // Only log initialization errors once
    if (!redisErrorLogged) {
      console.warn('⚠️ Redis rate limiting not available, using in-memory fallback:', error instanceof Error ? error.message : 'Unknown error')
      redisErrorLogged = true
    }
    redisAvailable = false
    rateLimiters = null
  }
} else {
  // No Redis credentials - use in-memory only
  redisAvailable = false
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
  // Rate limit configurations (for fallback)
  const rateLimitConfigs: Record<string, { limit: number; windowMs: number }> = {
    login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
    register: { limit: 2, windowMs: 5 * 60 * 1000 }, // 2 per 5 minutes
    order: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    admin: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
    contact: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    api: { limit: 60, windowMs: 60 * 1000 }, // 60 per minute
  }

  // If Redis rate limiters are configured and available, use them
  if (redisAvailable && rateLimiters && rateLimiters[limiterType]) {
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
      // If Redis fails, disable it and fall back to memory
      if (redisAvailable) {
        redisAvailable = false
        if (!redisErrorLogged) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.warn(`⚠️ Redis connection failed, switching to in-memory rate limiting: ${errorMessage}`)
          redisErrorLogged = true
        }
      }
      // Fall through to memory-based rate limiting
    }
  }

  // Fallback: Use in-memory rate limiting if Redis is not available
  const config = rateLimitConfigs[limiterType]
  if (config) {
    const allowed = checkMemoryRateLimit(identifier, config.limit, config.windowMs)
    const stored = memoryRateLimits.get(identifier)
    
    if (!allowed) {
      const retryAfter = stored ? Math.ceil((stored.resetTime - Date.now()) / 1000) : config.windowMs / 1000
      console.warn(`🚫 Memory rate limit exceeded for ${limiterType}:${identifier}`, {
        limit: config.limit,
        remaining: 0,
        retryAfter
      })
      
      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        reset: stored?.resetTime || Date.now() + config.windowMs,
        retryAfter
      }
    }
    
    const remaining = stored ? Math.max(0, config.limit - stored.count) : config.limit - 1
    
    return {
      success: true,
      limit: config.limit,
      remaining,
      reset: stored?.resetTime || Date.now() + config.windowMs
    }
  }

  // If no configuration found, allow the request but log a warning
  console.warn(`⚠️ Rate limiting not configured for ${limiterType}`)
  return { success: true }
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
  const retryAfter = headers['Retry-After'] ? parseInt(headers['Retry-After']) : undefined
  const retryMinutes = retryAfter ? Math.ceil(retryAfter / 60) : 5
  
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Твърде много опити. Моля, изчакайте ${retryMinutes} минути преди да опитате отново.`,
        retryAfter: retryAfter
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






