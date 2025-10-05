// src/utils/resourceValidator.ts
import { createServerClient } from '@/lib/supabase';
import { Logger } from './logger';

export class ResourceValidator {
  private supabase = createServerClient();

  async validateOrderExists(orderId: number): Promise<{ exists: boolean; order?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('Order')
        .select('OrderID, OrderStatusID, LoginID')
        .eq('OrderID', orderId)
        .single();
      
      if (error) {
        Logger.logDatabaseError('/api/resource-validator', error, 'validateOrderExists');
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data, order: data };
    } catch (error) {
      Logger.logDatabaseError('/api/resource-validator', error, 'validateOrderExists');
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async validateUserExists(userId: number): Promise<{ exists: boolean; user?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('Login')
        .select('LoginID, Name, email')
        .eq('LoginID', userId)
        .single();
      
      if (error) {
        Logger.logDatabaseError('/api/resource-validator', error, 'validateUserExists');
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data, user: data };
    } catch (error) {
      Logger.logDatabaseError('/api/resource-validator', error, 'validateUserExists');
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async validateOrderStatusExists(statusId: number): Promise<{ exists: boolean; status?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('RfOrderStatus')
        .select('OrderStatusID, OrderStatus')
        .eq('OrderStatusID', statusId)
        .single();
      
      if (error) {
        Logger.logDatabaseError('/api/resource-validator', error, 'validateOrderStatusExists');
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data, status: data };
    } catch (error) {
      Logger.logDatabaseError('/api/resource-validator', error, 'validateOrderStatusExists');
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async validatePaymentMethodExists(paymentMethodId: number): Promise<{ exists: boolean; paymentMethod?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('RfPaymentMethod')
        .select('PaymentMethodID, PaymentMethod')
        .eq('PaymentMethodID', paymentMethodId)
        .single();
      
      if (error) {
        Logger.logDatabaseError('/api/resource-validator', error, 'validatePaymentMethodExists');
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data, paymentMethod: data };
    } catch (error) {
      Logger.logDatabaseError('/api/resource-validator', error, 'validatePaymentMethodExists');
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async validateProductExists(productId: number): Promise<{ exists: boolean; product?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('Product')
        .select('ProductID, Product, IsDisabled')
        .eq('ProductID', productId)
        .single();
      
      if (error) {
        Logger.logDatabaseError('/api/resource-validator', error, 'validateProductExists');
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data, product: data };
    } catch (error) {
      Logger.logDatabaseError('/api/resource-validator', error, 'validateProductExists');
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async validateCompositeProductExists(compositeProductId: number): Promise<{ exists: boolean; compositeProduct?: any; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('CompositeProduct')
        .select('CompositeProductID, Size, PricingMethod')
        .eq('CompositeProductID', compositeProductId)
        .single();
      
      if (error) {
        Logger.logDatabaseError('/api/resource-validator', error, 'validateCompositeProductExists');
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data, compositeProduct: data };
    } catch (error) {
      Logger.logDatabaseError('/api/resource-validator', error, 'validateCompositeProductExists');
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async validateEmailExists(email: string): Promise<{ exists: boolean; user?: any; error?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check for real accounts first (exclude guest accounts)
      const { data, error } = await this.supabase
        .from('Login')
        .select('LoginID, Name, email')
        .eq('email', normalizedEmail)
        .neq('Password', 'guest_password') // Only real accounts
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        Logger.logDatabaseError('/api/resource-validator', error, 'validateEmailExists');
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data, user: data };
    } catch (error) {
      Logger.logDatabaseError('/api/resource-validator', error, 'validateEmailExists');
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
