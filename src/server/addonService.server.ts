import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface DatabaseAddon {
  AddonID?: number;
  Name: string;
  Price: number;
  ProductTypeID: number;
  AddonType: string;
  IsDisabled?: number;
  SortOrder?: number;
  SizeCategory?: string | null;
}

/**
 * List all addons ordered by AddonType then SortOrder
 */
export async function listAddons() {
  const { data, error } = await supabaseAdmin
    .from('Addon')
    .select('*')
    .order('AddonType', { ascending: true })
    .order('SortOrder', { ascending: true })
    .order('Name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Upsert (create or update) an addon
 */
export async function upsertAddon(addon: Partial<DatabaseAddon>) {
  const { data, error } = await supabaseAdmin
    .from('Addon')
    .upsert(addon)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Toggle IsDisabled for an addon
 */
export async function setAddonDisabled(addonId: number, isDisabled: boolean) {
  const { error } = await supabaseAdmin
    .from('Addon')
    .update({ IsDisabled: isDisabled ? 1 : 0 })
    .eq('AddonID', addonId);
  if (error) throw new Error(error.message);
}

/**
 * Delete addon(s) by ID
 */
export async function deleteAddons(ids: number[]) {
  // First delete related LkProductAddon entries
  const { error: linkError } = await supabaseAdmin
    .from('LkProductAddon')
    .delete()
    .in('AddonID', ids);
  if (linkError) {
    console.warn('Warning: Could not delete related product addon links:', linkError.message);
  }

  // Also delete from LkProductTypeAddons
  const { error: linkError2 } = await supabaseAdmin
    .from('LkProductTypeAddons')
    .delete()
    .in('AddonID', ids);
  if (linkError2) {
    console.warn('Warning: Could not delete related product type addon links:', linkError2.message);
  }

  const { error } = await supabaseAdmin
    .from('Addon')
    .delete()
    .in('AddonID', ids);
  if (error) throw new Error(error.message);
  return { success: true, deletedCount: ids.length };
}

// ─── LkProductAddon management ───

/**
 * Get all ProductIDs assigned to a specific addon
 */
export async function getProductsForAddon(addonId: number) {
  const { data, error } = await supabaseAdmin
    .from('LkProductAddon')
    .select('ProductID')
    .eq('AddonID', addonId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(row => row.ProductID);
}

/**
 * Set which products are assigned to an addon (replaces all existing assignments)
 */
export async function setProductsForAddon(addonId: number, productIds: number[]) {
  // Delete existing assignments for this addon
  const { error: deleteError } = await supabaseAdmin
    .from('LkProductAddon')
    .delete()
    .eq('AddonID', addonId);
  if (deleteError) throw new Error(deleteError.message);

  // Insert new assignments (if any)
  if (productIds.length > 0) {
    const rows = productIds.map(productId => ({
      ProductID: productId,
      AddonID: addonId
    }));
    const { error: insertError } = await supabaseAdmin
      .from('LkProductAddon')
      .insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  return { success: true, addonId, productCount: productIds.length };
}

/**
 * Get all addon assignments (bulk) - returns map of AddonID -> ProductID[]
 */
export async function getAllAddonAssignments() {
  const { data, error } = await supabaseAdmin
    .from('LkProductAddon')
    .select('ProductID, AddonID');
  if (error) throw new Error(error.message);

  const assignments: { [addonId: number]: number[] } = {};
  (data ?? []).forEach(row => {
    if (!assignments[row.AddonID]) {
      assignments[row.AddonID] = [];
    }
    assignments[row.AddonID].push(row.ProductID);
  });
  return assignments;
}

/**
 * Get all products (for the assignment UI)
 */
export async function listProductsForAssignment() {
  const { data, error } = await supabaseAdmin
    .from('Product')
    .select('ProductID, Product, ProductTypeID, IsDisabled, isDeleted')
    .or('isDeleted.eq.false,isDeleted.is.null')
    .order('ProductTypeID', { ascending: true })
    .order('Product', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
