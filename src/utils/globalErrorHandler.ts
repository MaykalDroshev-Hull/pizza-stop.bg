// src/utils/globalErrorHandler.ts
import { NextResponse } from 'next/server';
import { Logger } from './logger';
import { ErrorResponseBuilder } from './errorResponses';

export function handleApiError(error: unknown, context: string, endpoint?: string, userId?: string) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  Logger.error(`API Error in ${context}`, {
    message: errorMessage,
    stack: errorStack,
    context,
    errorType: error instanceof Error ? error.constructor.name : typeof error
  }, endpoint, userId);

  // Return appropriate response based on error type and message
  if (errorMessage.includes('validation') || errorMessage.includes('Invalid') || errorMessage.includes('Missing')) {
    return ErrorResponseBuilder.badRequest(errorMessage);
  }

  if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
    return ErrorResponseBuilder.notFound('Ресурс', errorMessage);
  }

  if (errorMessage.includes('unauthorized') || errorMessage.includes('Unauthorized') || errorMessage.includes('authentication')) {
    return ErrorResponseBuilder.unauthorized(errorMessage);
  }

  if (errorMessage.includes('forbidden') || errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
    return ErrorResponseBuilder.forbidden(errorMessage);
  }

  if (errorMessage.includes('conflict') || errorMessage.includes('Conflict') || errorMessage.includes('already exists')) {
    return ErrorResponseBuilder.conflict(errorMessage);
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return ErrorResponseBuilder.serviceUnavailable('Заявката изтече');
  }

  if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
    return ErrorResponseBuilder.tooManyRequests(errorMessage);
  }

  if (errorMessage.includes('payload too large') || errorMessage.includes('Payload too large')) {
    return ErrorResponseBuilder.payloadTooLarge(errorMessage);
  }

  if (errorMessage.includes('header too large') || errorMessage.includes('Header too large')) {
    return ErrorResponseBuilder.requestHeaderFieldsTooLarge(errorMessage);
  }

  // Default to 500 for unexpected errors
  return ErrorResponseBuilder.internalServerError('Вътрешна грешка на сървъра', {
    context,
    errorType: error instanceof Error ? error.constructor.name : typeof error
  });
}

export function handleValidationError(validationErrors: string[], endpoint?: string, userId?: string) {
  Logger.logValidationError(endpoint || 'unknown', validationErrors, undefined, userId);
  
  return ErrorResponseBuilder.badRequest(
    validationErrors.length === 1 ? validationErrors[0] : 'Множество валидационни грешки',
    validationErrors.reduce((acc, error, index) => {
      acc[`error_${index}`] = error;
      return acc;
    }, {} as Record<string, string>)
  );
}

export function handleResourceNotFoundError(resourceType: string, resourceId: string, endpoint?: string, userId?: string) {
  Logger.logResourceNotFound(endpoint || 'unknown', resourceType, resourceId, userId);
  
  return ErrorResponseBuilder.notFound(resourceType, resourceId);
}

export function handleDatabaseError(error: any, operation: string, endpoint?: string, userId?: string) {
  Logger.logDatabaseError(endpoint || 'unknown', error, operation, userId);
  
  return ErrorResponseBuilder.internalServerError('Грешка при работа с базата данни', {
    operation,
    errorType: error instanceof Error ? error.constructor.name : typeof error
  });
}

export function handleEmailError(error: any, emailType: string, endpoint?: string, userId?: string) {
  Logger.logEmailError(endpoint || 'unknown', error, emailType, userId);
  
  return ErrorResponseBuilder.internalServerError('Грешка при изпращане на имейл', {
    emailType,
    errorType: error instanceof Error ? error.constructor.name : typeof error
  });
}

export function handleAuthError(error: any, authType: string, endpoint?: string, userId?: string) {
  Logger.logAuthError(endpoint || 'unknown', error, authType, userId);
  
  if (authType === 'login') {
    return ErrorResponseBuilder.unauthorized('Невалиден имейл или парола');
  }
  
  if (authType === 'token') {
    return ErrorResponseBuilder.unauthorized('Невалиден или изтекъл токен');
  }
  
  return ErrorResponseBuilder.unauthorized('Грешка при автентикация');
}

// Wrapper function for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: string,
  endpoint?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw handleApiError(error, context, endpoint);
    }
  };
}
