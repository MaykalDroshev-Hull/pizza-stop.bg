import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type Product = {
  ProductID?: number;
  Product: string;
  Description?: string | null;
  ImageURL?: string | null;
  IsDisabled?: number;
  SmallPrice?: number | null;
  MediumPrice?: number | null;
  LargePrice?: number | null;
  ProductTypeID?: number | null;
};

export async function listProducts() {
  const { data, error } = await supabaseAdmin
    .from('Product')
    .select('*')
    .order('ProductID', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertProduct(p: Product) {
  const { data, error } = await supabaseAdmin.from('Product').upsert(p).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setProductDisabled(id: number, isDisabled: boolean) {
  const { error } = await supabaseAdmin.from('Product')
    .update({ IsDisabled: isDisabled ? 1 : 0 })
    .eq('ProductID', id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: number) {
  const { error } = await supabaseAdmin.from('Product')
    .delete()
    .eq('ProductID', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteProducts(ids: number[]) {
  try {
    // First, delete related records from LkOrderProduct table
    const { error: orderProductError } = await supabaseAdmin
      .from('LkOrderProduct')
      .delete()
      .in('ProductID', ids);
    
    if (orderProductError) {
      console.warn('Warning: Could not delete related order products:', orderProductError.message);
      // Continue with product deletion even if order products couldn't be deleted
    }

    // Then delete the products themselves
    const { error } = await supabaseAdmin.from('Product')
      .delete()
      .in('ProductID', ids);
    
    if (error) throw new Error(error.message);
    
    return { success: true, deletedCount: ids.length };
  } catch (error) {
    throw new Error(`Failed to delete products: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}