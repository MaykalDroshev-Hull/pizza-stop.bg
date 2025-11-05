// src/utils/envValidator.ts
import { Logger } from './logger';

export interface EnvironmentValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  details: Record<string, boolean>;
}

export class EnvironmentValidator {
  private static requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATECS_TERMINAL_ID',
    'DATECS_MERCHANT_ID',
    'DATECS_PRIVATE_KEY_PATH',
    'DATECS_BORICA_PUBLIC_KEY_PATH'
  ];

  private static optionalVars = [
    'EMAIL_USER',
    'EMAIL_PASS',
    'NODE_ENV',
    'DATECS_MERCHANT_NAME',
    'DATECS_MERCHANT_URL',
    'DATECS_GATEWAY_URL',
    'DATECS_BACKREF_URL',
    'DATECS_COUNTRY',
    'DATECS_TIMEZONE',
    'DATECS_CURRENCY',
    'DATECS_PRIVATE_KEY_PASSWORD',
    'DATECS_LANG'
  ];

  static validateEnvironment(): EnvironmentValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];
    const details: Record<string, boolean> = {};

    // Check required variables
    for (const varName of EnvironmentValidator.requiredVars) {
      const exists = !!process.env[varName];
      details[varName] = exists;
      
      if (!exists) {
        missing.push(varName);
      }
    }

    // Check optional variables
    for (const varName of EnvironmentValidator.optionalVars) {
      const exists = !!process.env[varName];
      details[varName] = exists;
      
      if (!exists) {
        warnings.push(varName);
      }
    }

    // Additional validations
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      warnings.push('NEXT_PUBLIC_SUPABASE_URL appears to be a placeholder');
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')) {
      warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be a placeholder');
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY && 
        process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY appears to be a placeholder');
    }

    const isValid = missing.length === 0;

    if (!isValid) {
      Logger.error('Environment validation failed', {
        missing,
        warnings,
        details
      });
    } else if (warnings.length > 0) {
      Logger.warn('Environment validation passed with warnings', {
        warnings,
        details
      });
    } else {
      Logger.info('Environment validation passed', { details });
    }

    return {
      isValid,
      missing,
      warnings,
      details
    };
  }

  static ensureEnvironmentValid(): void {
    const validation = EnvironmentValidator.validateEnvironment();
    
    if (!validation.isValid) {
      const errorMessage = `Missing required environment variables: ${validation.missing.join(', ')}`;
      Logger.error('Environment validation failed - throwing error', {
        missing: validation.missing,
        errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  static getEnvironmentInfo(): Record<string, any> {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasEmailConfig: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      supabaseAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      supabaseServiceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      hasDatecsConfig: !!(process.env.DATECS_TERMINAL_ID && process.env.DATECS_MERCHANT_ID),
      hasDatecsKeys: !!(process.env.DATECS_PRIVATE_KEY_PATH && process.env.DATECS_BORICA_PUBLIC_KEY_PATH),
      datecsGatewayUrl: process.env.DATECS_GATEWAY_URL || 'https://3dsgate-dev.borica.bg/cgi-bin/cgi_link',
      datecsTerminalId: process.env.DATECS_TERMINAL_ID?.substring(0, 4) + '***' || 'Not set'
    };
  }
}
