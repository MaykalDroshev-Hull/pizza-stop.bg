// src/utils/errorResponses.ts
import { NextResponse } from 'next/server';

export class ErrorResponseBuilder {
  static badRequest(message: string, details?: Record<string, string>) {
    return NextResponse.json({
      error: message,
      details,
      timestamp: new Date().toISOString(),
      type: 'validation_error'
    }, { status: 400 });
  }

  static notFound(resource: string, id?: string) {
    return NextResponse.json({
      error: `${resource} не е намерен`,
      details: id ? { id } : undefined,
      timestamp: new Date().toISOString(),
      type: 'not_found_error'
    }, { status: 404 });
  }

  static unauthorized(message: string = 'Невалидна автентикация') {
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: 'auth_error'
    }, { status: 401 });
  }

  static forbidden(message: string = 'Нямате права за достъп') {
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: 'permission_error'
    }, { status: 403 });
  }

  static conflict(message: string, details?: Record<string, string>) {
    return NextResponse.json({
      error: message,
      details,
      timestamp: new Date().toISOString(),
      type: 'conflict_error'
    }, { status: 409 });
  }

  static internalServerError(message: string = 'Вътрешна грешка на сървъра', details?: Record<string, any>) {
    return NextResponse.json({
      error: message,
      details,
      timestamp: new Date().toISOString(),
      type: 'server_error'
    }, { status: 500 });
  }

  static serviceUnavailable(message: string = 'Услугата е временно недостъпна') {
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: 'service_error'
    }, { status: 503 });
  }

  static tooManyRequests(message: string = 'Твърде много заявки') {
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: 'rate_limit_error'
    }, { status: 429 });
  }

  static payloadTooLarge(message: string = 'Заявката е твърде голяма') {
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: 'payload_error'
    }, { status: 413 });
  }

  static requestHeaderFieldsTooLarge(message: string = 'Заглавките на заявката са твърде големи') {
    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      type: 'header_error'
    }, { status: 431 });
  }
}
