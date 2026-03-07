import { supabase } from '@/lib/supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageUploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

/**
 * Uploads an image file to Supabase Storage
 * @param file - The image file to upload
 * @param bucket - The storage bucket name (default: 'pizza-stop-bucket')
 * @param folder - The folder within the bucket (default: 'public')
 * @param onProgress - Optional progress callback
 * @param currentImageUrl - Current image URL to check for duplicates
 * @returns Promise with upload result
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: string = 'pizza-stop',
  folder: string = 'public',
  onProgress?: (progress: ImageUploadProgress) => void,
  currentImageUrl?: string
): Promise<ImageUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Файлът трябва да бъде изображение'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Размерът на файла не трябва да надвишава 5MB'
      };
    }

    // Check if the same image is being uploaded
    if (currentImageUrl) {
      const isSameImage = await checkIfSameImage(file, currentImageUrl);
      if (isSameImage) {
        onProgress?.({
          progress: 100,
          status: 'complete',
          message: 'Същото изображение е вече качено!'
        });
        
        return {
          success: true,
          url: currentImageUrl
        };
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    onProgress?.({
      progress: 10,
      status: 'uploading',
      message: 'Качване на изображението...'
    });

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Грешка при качване';
      if (error.message.includes('row-level security policy')) {
        errorMessage = 'Грешка при качване: Политика за сигурност не позволява качване. Моля, проверете настройките на Supabase.';
      } else if (error.message.includes('bucket')) {
        errorMessage = 'Грешка при качване: Проблем с хранилището. Моля, проверете настройките.';
      } else {
        errorMessage = `Грешка при качване: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    onProgress?.({
      progress: 50,
      status: 'processing',
      message: 'Обработка на изображението...'
    });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    onProgress?.({
      progress: 100,
      status: 'complete',
      message: 'Изображението е качено успешно!'
    });

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неочаквана грешка при качване'
    };
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 * @param bucket - The storage bucket name (default: 'pizza-stop-bucket')
 * @returns Promise with deletion result
 */
export async function deleteImageFromSupabase(
  imageUrl: string,
  bucket: string = 'pizza-stop'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(bucket);
    
    if (bucketIndex === -1) {
      return {
        success: false,
        error: 'Невалиден URL на изображението'
      };
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: `Грешка при изтриване: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Image delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неочаквана грешка при изтриване'
    };
  }
}

/**
 * Validates image file before upload
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Файлът трябва да бъде изображение (JPG, PNG, GIF, WebP, AVIF)'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Размерът на файла не трябва да надвишава 5MB'
    };
  }

  // Check file name length
  if (file.name.length > 100) {
    return {
      isValid: false,
      error: 'Името на файла е твърде дълго (максимум 100 символа)'
    };
  }

  return { isValid: true };
}

/**
 * Creates a preview URL for an image file
 * @param file - The image file
 * @returns Object URL for preview
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free memory
 * @param url - The object URL to revoke
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Checks if the uploaded file is the same as the current image
 * @param file - The file being uploaded
 * @param currentImageUrl - The current image URL
 * @returns Promise<boolean> - True if it's the same image
 */
async function checkIfSameImage(file: File, currentImageUrl: string): Promise<boolean> {
  try {
    // Get file hash for comparison
    const fileHash = await getFileHash(file);
    
    // Try to fetch the current image and get its hash
    const response = await fetch(currentImageUrl);
    if (!response.ok) {
      return false; // If we can't fetch the current image, assume it's different
    }
    
    const currentImageBlob = await response.blob();
    const currentImageFile = new File([currentImageBlob], 'current-image', { type: currentImageBlob.type });
    const currentImageHash = await getFileHash(currentImageFile);
    
    // Compare file hashes
    return fileHash === currentImageHash;
  } catch (error) {
    console.warn('Error comparing images:', error);
    return false; // If there's an error, assume it's different to be safe
  }
}

/**
 * Generates a hash for a file to compare with other files
 * @param file - The file to hash
 * @returns Promise<string> - The file hash
 */
async function getFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Gets the file size of an image from its URL
 * @param imageUrl - The URL of the image
 * @returns Promise with the file size in bytes, or null if unable to fetch
 */
export async function getImageSizeFromUrl(imageUrl: string): Promise<number | null> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) {
      // If HEAD fails, try GET but only read headers
      const getResponse = await fetch(imageUrl);
      if (!getResponse.ok) {
        return null;
      }
      const contentLength = getResponse.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : null;
    }
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : null;
  } catch (error) {
    console.warn('Error getting image size:', error);
    return null;
  }
}

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "150 KB", "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Checks if AVIF encoding is supported in the browser
 * @returns Promise<boolean> - True if AVIF is supported
 */
async function isAVIFSupported(): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    // Try to encode as AVIF
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob !== null);
      }, 'image/avif', 0.8);
    });
  } catch {
    return false;
  }
}

/**
 * Converts a blob to AVIF format using Canvas API
 * @param blob - The image blob to convert
 * @param quality - Quality (0-1)
 * @returns Promise with AVIF blob or null if not supported
 */
async function convertToAVIF(blob: Blob, quality: number = 0.8): Promise<Blob | null> {
  try {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((avifBlob) => {
          URL.revokeObjectURL(url);
          resolve(avifBlob);
        }, 'image/avif', quality);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      
      img.src = url;
    });
  } catch {
    return null;
  }
}

/**
 * Optimizes an image file to be under 100KB and converts to AVIF format
 * @param file - The image file to optimize
 * @param maxSizeKB - Maximum size in KB (default: 100)
 * @returns Promise with optimized File or null if optimization fails
 */
export async function optimizeImageToAVIF(
  file: File,
  maxSizeKB: number = 100
): Promise<File | null> {
  try {
    const imageCompression = (await import('browser-image-compression')).default;
    
    // First, compress the image to WebP (browser-image-compression supports WebP well)
    const maxSizeMB = maxSizeKB / 1024;
    let options: any = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.8
    };

    let compressedFile = await imageCompression(file, options);
    
    // If still too large, reduce quality further
    let attempts = 0;
    const maxAttempts = 5;
    while (compressedFile.size > maxSizeKB * 1024 && attempts < maxAttempts) {
      options.initialQuality = Math.max(0.3, options.initialQuality - 0.1);
      compressedFile = await imageCompression(file, options);
      attempts++;
    }

    // If still too large, reduce dimensions
    if (compressedFile.size > maxSizeKB * 1024) {
      options.maxWidthOrHeight = 1280;
      compressedFile = await imageCompression(file, options);
    }

    if (compressedFile.size > maxSizeKB * 1024) {
      options.maxWidthOrHeight = 960;
      compressedFile = await imageCompression(file, options);
    }

    if (compressedFile.size > maxSizeKB * 1024) {
      options.maxWidthOrHeight = 720;
      compressedFile = await imageCompression(file, options);
    }

    // Try to convert to AVIF if supported
    const avifSupported = await isAVIFSupported();
    if (avifSupported) {
      let quality = 0.8;
      let avifBlob = await convertToAVIF(compressedFile, quality);
      
      // If AVIF is larger, try reducing quality
      if (avifBlob && avifBlob.size > maxSizeKB * 1024) {
        quality = 0.6;
        avifBlob = await convertToAVIF(compressedFile, quality);
      }
      
      if (avifBlob && avifBlob.size <= maxSizeKB * 1024) {
        return new File([avifBlob], file.name.replace(/\.[^/.]+$/, '.avif'), {
          type: 'image/avif',
          lastModified: Date.now()
        });
      }
    }

    // If AVIF conversion failed or not supported, return WebP
    return compressedFile;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return null;
  }
}