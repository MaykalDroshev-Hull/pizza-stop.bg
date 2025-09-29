// src/utils/validation.ts
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  details?: Record<string, string>;
}

export class ValidationService {
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return {
        isValid: false,
        errors: ['Имейлът е задължителен'],
        details: { email: 'Имейлът е задължителен' }
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        errors: ['Невалиден формат на имейл адреса'],
        details: { email: 'Имейлът трябва да е във валиден формат' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validatePhone(phone: string): ValidationResult {
    if (!phone) {
      return {
        isValid: false,
        errors: ['Телефонът е задължителен'],
        details: { phone: 'Телефонът е задължителен' }
      };
    }

    const phoneRegex = /^(\+359|0)[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        isValid: false,
        errors: ['Невалиден формат на телефонния номер'],
        details: { phone: 'Използвайте формат: +359XXXXXXXXX или 0XXXXXXXXX' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateName(name: string): ValidationResult {
    if (!name) {
      return {
        isValid: false,
        errors: ['Името е задължително'],
        details: { name: 'Името е задължително' }
      };
    }

    const nameRegex = /^[а-яА-Яa-zA-Z\s]{2,50}$/;
    if (!nameRegex.test(name.trim())) {
      return {
        isValid: false,
        errors: ['Името трябва да е между 2 и 50 символа и да съдържа само букви'],
        details: { name: 'Името трябва да е между 2 и 50 символа и да съдържа само букви' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validatePassword(password: string): ValidationResult {
    if (!password) {
      return {
        isValid: false,
        errors: ['Паролата е задължителна'],
        details: { password: 'Паролата е задължителна' }
      };
    }

    if (password.length < 8) {
      return {
        isValid: false,
        errors: ['Паролата трябва да е поне 8 символа дълга'],
        details: { password: 'Паролата трябва да е поне 8 символа дълга' }
      };
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        errors: ['Паролата трябва да съдържа поне една буква и една цифра'],
        details: { password: 'Паролата трябва да съдържа поне една буква и една цифра' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateOrderId(orderId: any): ValidationResult {
    if (!orderId) {
      return {
        isValid: false,
        errors: ['Номерът на поръчката е задължителен'],
        details: { orderId: 'Номерът на поръчката е задължителен' }
      };
    }

    const numericId = parseInt(orderId?.toString(), 10);
    if (isNaN(numericId) || numericId <= 0) {
      return {
        isValid: false,
        errors: ['Невалиден номер на поръчка'],
        details: { orderId: 'Номерът на поръчката трябва да е положително число' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateETAMinutes(etaMinutes: any): ValidationResult {
    if (!etaMinutes) {
      return {
        isValid: false,
        errors: ['Времето за доставка е задължително'],
        details: { etaMinutes: 'Времето за доставка е задължително' }
      };
    }

    const validETAs = [15, 30, 45, 60];
    if (!validETAs.includes(Number(etaMinutes))) {
      return {
        isValid: false,
        errors: ['Невалидно време за доставка'],
        details: { etaMinutes: 'ETA трябва да е 15, 30, 45 или 60 минути' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateUserId(userId: any): ValidationResult {
    if (!userId) {
      return {
        isValid: false,
        errors: ['ID на потребителя е задължително'],
        details: { userId: 'ID на потребителя е задължително' }
      };
    }

    const numericId = parseInt(userId?.toString(), 10);
    if (isNaN(numericId) || numericId <= 0) {
      return {
        isValid: false,
        errors: ['Невалиден ID на потребителя'],
        details: { userId: 'ID на потребителя трябва да е положително число' }
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateRequiredFields(fields: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    const details: Record<string, string> = {};

    for (const [fieldName, value] of Object.entries(fields)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${fieldName} е задължително`);
        details[fieldName] = `${fieldName} е задължително`;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      details: Object.keys(details).length > 0 ? details : undefined
    };
  }
}
