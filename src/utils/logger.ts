// src/utils/logger.ts
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  endpoint?: string;
  userId?: string;
  requestId?: string;
  details?: Record<string, any>;
  stack?: string;
}

export class Logger {
  private static generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private static formatLog(level: LogEntry['level'], message: string, details?: Record<string, any>, endpoint?: string, userId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      endpoint,
      userId,
      requestId: Logger.generateRequestId(),
      details,
      stack: level === 'error' && details?.error instanceof Error ? details.error.stack : undefined
    };
  }

  static info(message: string, details?: Record<string, any>, endpoint?: string, userId?: string) {
    const logEntry = Logger.formatLog('info', message, details, endpoint, userId);
    console.log(JSON.stringify(logEntry));
  }

  static warn(message: string, details?: Record<string, any>, endpoint?: string, userId?: string) {
    const logEntry = Logger.formatLog('warn', message, details, endpoint, userId);
    console.warn(JSON.stringify(logEntry));
  }

  static error(message: string, details?: Record<string, any>, endpoint?: string, userId?: string) {
    const logEntry = Logger.formatLog('error', message, details, endpoint, userId);
    console.error(JSON.stringify(logEntry));
  }

  static debug(message: string, details?: Record<string, any>, endpoint?: string, userId?: string) {
    const logEntry = Logger.formatLog('debug', message, details, endpoint, userId);
    console.debug(JSON.stringify(logEntry));
  }

  static logRequest(method: string, endpoint: string, userId?: string, details?: Record<string, any>) {
    Logger.info(`${method} ${endpoint}`, {
      method,
      endpoint,
      ...details
    }, endpoint, userId);
  }

  static logValidationError(endpoint: string, validationErrors: string[], details?: Record<string, any>, userId?: string) {
    Logger.warn('Validation failed', {
      validationErrors,
      ...details
    }, endpoint, userId);
  }

  static logResourceNotFound(endpoint: string, resourceType: string, resourceId: string, userId?: string) {
    Logger.warn('Resource not found', {
      resourceType,
      resourceId
    }, endpoint, userId);
  }

  static logDatabaseError(endpoint: string, error: any, operation: string, userId?: string) {
    Logger.error('Database operation failed', {
      operation,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    }, endpoint, userId);
  }

  static logEmailError(endpoint: string, error: any, emailType: string, userId?: string) {
    Logger.error('Email sending failed', {
      emailType,
      error: error instanceof Error ? error.message : error
    }, endpoint, userId);
  }

  static logAuthError(endpoint: string, error: any, authType: string, userId?: string) {
    Logger.error('Authentication failed', {
      authType,
      error: error instanceof Error ? error.message : error
    }, endpoint, userId);
  }
}
