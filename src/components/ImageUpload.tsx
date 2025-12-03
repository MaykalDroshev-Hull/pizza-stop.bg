"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { 
  uploadImageToSupabase, 
  validateImageFile, 
  createImagePreview, 
  revokeImagePreview,
  ImageUploadProgress,
  ImageUploadResult
} from "@/utils/imageUpload";

interface ImageUploadProps {
  value?: string; // Current image URL
  onChange: (url: string | null) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  previewUrl?: string;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onError,
  disabled = false,
  className = "",
  placeholder = "Качете изображение",
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
}): React.JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    status: 'idle'
  });

  const handleFileSelect = useCallback(async (file: File): Promise<void> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: validation.error,
        isUploading: false
      }));
      onError?.(validation.error || 'Невалиден файл');
      return;
    }

    // Create preview
    const previewUrl = createImagePreview(file);
    setUploadState(prev => ({
      ...prev,
      previewUrl,
      isUploading: true,
      status: 'uploading',
      progress: 0,
      error: undefined
    }));

    // Upload to Supabase
    const result = await uploadImageToSupabase(
      file,
      'pizza-stop',
      'public',
      (progress: ImageUploadProgress) => {
        setUploadState(prev => ({
          ...prev,
          progress: progress.progress,
          status: progress.status,
          message: progress.message
        }));
      },
      value // Pass current image URL to check for duplicates
    );

    if (result.success && result.url) {
      // Check if it's the same image (URL didn't change)
      const isSameImage = result.url === value;
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        status: 'complete',
        progress: 100,
        message: isSameImage ? 'Същото изображение е вече качено!' : 'Изображението е качено успешно!'
      }));
      onChange(result.url);
    } else {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        status: 'error',
        error: result.error || 'Грешка при качване',
        previewUrl: undefined
      }));
      onError?.(result.error || 'Грешка при качване');
    }

    // Clean up preview after a delay
    setTimeout(() => {
      revokeImagePreview(previewUrl);
      setUploadState(prev => ({
        ...prev,
        previewUrl: undefined,
        message: undefined
      }));
    }, 3000);
  }, [onChange, onError]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (disabled || uploadState.isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [disabled, uploadState.isUploading, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  }, []);

  const handleRemoveImage = useCallback((): void => {
    onChange(null);
    setUploadState({
      isUploading: false,
      progress: 0,
      status: 'idle'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleClick = useCallback((): void => {
    if (!disabled && !uploadState.isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploadState.isUploading]);

  const hasImage = value || uploadState.previewUrl;
  const isUploading = uploadState.isUploading;
  const hasError = uploadState.status === 'error';

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative border-2 border-dashed rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 transition-all duration-200 cursor-pointer min-h-[80px] sm:min-h-[120px] md:min-h-[140px]
          ${hasError 
            ? 'border-red-500 bg-red-900/20 hover:bg-red-900/30' 
            : hasImage 
            ? 'border-green-500 bg-green-900/20 hover:bg-green-900/30'
            : 'border-gray-600 bg-gray-800/50 hover:border-orange-500 hover:bg-gray-800/70'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'cursor-wait' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* Content */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3">
          {/* Icon */}
          <div className={`
            w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors duration-200
            ${hasError 
              ? 'bg-red-600 text-red-100' 
              : hasImage 
              ? 'bg-green-600 text-green-100'
              : 'bg-gray-700 text-gray-400 group-hover:text-orange-400'
            }
          `}>
            {isUploading ? (
              <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin" />
            ) : hasImage ? (
              <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            ) : (
              <Upload className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
            )}
          </div>

          {/* Text */}
          <div className="space-y-1">
            <p className={`
              text-xs sm:text-sm md:text-base font-medium transition-colors duration-200
              ${hasError 
                ? 'text-red-300' 
                : hasImage 
                ? 'text-green-300'
                : 'text-gray-300 group-hover:text-orange-300'
              }
            `}>
              {isUploading 
                ? 'Качване...' 
                : hasImage 
                ? 'Изображение качено'
                : placeholder
              }
            </p>
            
            {!isUploading && !hasImage && (
              <p className="text-xs text-gray-500 hidden sm:block">
                Кликнете или плъзнете файл тук
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="w-full max-w-xs">
              <div className="bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ease-out ${
                    uploadState.message?.includes('Същото изображение') 
                      ? 'bg-blue-500' 
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${
                uploadState.message?.includes('Същото изображение') 
                  ? 'text-blue-400' 
                  : 'text-gray-400'
              }`}>
                {uploadState.message || `${uploadState.progress}%`}
              </p>
            </div>
          )}

          {/* Error Message */}
          {hasError && uploadState.error && (
            <div className="flex items-center gap-2 text-red-300 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-center">{uploadState.error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {hasImage && (
        <div className="relative">
          <div className="relative w-full h-24 sm:h-32 md:h-40 bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden">
            <img
              src={uploadState.previewUrl || value || ''}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const nextElement = target.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'flex';
                }
              }}
            />
            <div className="hidden w-full h-full items-center justify-center bg-gray-800">
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
            </div>
            
            {/* Remove Button */}
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                type="button"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* File Info */}
      {!hasImage && !isUploading && (
        <div className="text-xs text-gray-500 text-center space-y-1 hidden sm:block">
          <p>Поддържани формати: JPG, PNG, GIF, WebP, AVIF</p>
          <p>Максимален размер: {maxSize}MB</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
