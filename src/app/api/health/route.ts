// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Logger } from '@/utils/logger';

interface HealthCheckResponse {
  timestamp: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: {
    database: 'healthy' | 'unhealthy' | 'unknown';
    email: 'healthy' | 'unhealthy' | 'unknown';
  };
  environment: {
    nodeEnv: string;
    hasSupabaseUrl: boolean;
    hasSupabaseKey: boolean;
    hasEmailConfig: boolean;
  };
  uptime: number;
  version: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const healthCheck: HealthCheckResponse = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: 'unknown',
      email: 'unknown'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasEmailConfig: !!(process.env.NEXT_PUBLIC_EMAIL && process.env.NEXT_PUBLIC_EMAIL_PASS)
    },
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Test database connection
    Logger.info('Health check: Testing database connection');
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('Login')
      .select('LoginID')
      .limit(1);
    
    if (error) {
      Logger.error('Health check: Database connection failed', { error: error.message });
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'unhealthy';
    } else {
      Logger.info('Health check: Database connection successful');
      healthCheck.services.database = 'healthy';
    }
  } catch (error) {
    Logger.error('Health check: Database connection exception', { error: error instanceof Error ? error.message : error });
    healthCheck.services.database = 'unhealthy';
    healthCheck.status = 'unhealthy';
  }

  // Test email configuration (without actually sending)
  try {
    if (healthCheck.environment.hasEmailConfig) {
      Logger.info('Health check: Email configuration available');
      healthCheck.services.email = 'healthy';
    } else {
      Logger.warn('Health check: Email configuration missing');
      healthCheck.services.email = 'unhealthy';
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }
  } catch (error) {
    Logger.error('Health check: Email configuration check failed', { error: error instanceof Error ? error.message : error });
    healthCheck.services.email = 'unhealthy';
    if (healthCheck.status === 'healthy') {
      healthCheck.status = 'degraded';
    }
  }

  // Check environment variables
  if (!healthCheck.environment.hasSupabaseUrl || !healthCheck.environment.hasSupabaseKey) {
    Logger.error('Health check: Missing critical environment variables', {
      hasSupabaseUrl: healthCheck.environment.hasSupabaseUrl,
      hasSupabaseKey: healthCheck.environment.hasSupabaseKey
    });
    healthCheck.status = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;
  Logger.info('Health check completed', {
    status: healthCheck.status,
    responseTime: `${responseTime}ms`,
    services: healthCheck.services
  });

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(healthCheck, { status: statusCode });
}
