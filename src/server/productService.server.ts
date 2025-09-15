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