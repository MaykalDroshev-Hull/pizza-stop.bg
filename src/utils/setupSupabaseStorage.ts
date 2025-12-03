import { supabase } from '@/lib/supabase';

/**
 * Sets up the Supabase Storage bucket for product images
 * This should be called once during application initialization
 * The bucket uses a 'public' folder structure to work with RLS policies
 */
export async function setupSupabaseStorage(): Promise<void> {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'pizza-stop');
    
    if (!bucketExists) {
      
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('pizza-stop', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });

      if (error) {
        console.error('Error creating bucket:', error);
      }
    }
    

    // Test if we can access the bucket
    await testStorageAccess();
  } catch (error) {
    console.error('Error setting up Supabase Storage:', error);
  }
}

/**
 * Tests if storage access is working correctly
 */
async function testStorageAccess(): Promise<void> {
  try {
    // Try to list files in the public folder
    const { data, error } = await supabase.storage
      .from('pizza-stop')
      .list('public', { limit: 1 });

    if (error) {
      console.warn('Storage access test failed:', error.message);
    }
  } catch (error) {
    console.warn('Storage access test error:', error);
  }
}

/**
 * Gets the public URL for a product image
 * @param imagePath - The path to the image in storage
 * @returns The public URL
 */
export function getProductImageUrl(imagePath: string): string {
  const { data } = supabase.storage
    .from('pizza-stop')
    .getPublicUrl(imagePath);
  
  return data.publicUrl;
}
