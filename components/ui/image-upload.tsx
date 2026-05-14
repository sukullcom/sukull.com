"use client";

import { useState, useRef, useCallback } from "react";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";
import { deleteImageFromStorage } from "@/utils/image-cleanup";
import { clientLogger } from "@/lib/client-logger";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Sunucu (`app/api/upload/image/route.ts`) SVG'yi XSS riski nedeniyle
 * kasıtla reddediyor; UI bunlarla %100 hizalı olmalı, aksi halde kullanıcı
 * SVG seçip 400 alır ve niye olduğunu anlamaz.
 */
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUpload({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Resim yükleyin"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      // If there's an existing image, delete it first
      if (value) {
        const deleteSuccess = await deleteImageFromStorage(value);
        if (!deleteSuccess) {
          clientLogger.warn('failed to delete old image, continuing with upload');
        }
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.imageUrl);
        toast.success('Resim başarıyla yüklendi');
      } else {
        toast.error(result.error || 'Resim yüklenemedi');
      }
    } catch (error) {
      clientLogger.error({ message: 'image upload failed', error, location: 'image-upload/upload' });
      toast.error('Resim yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  }, [onChange, value]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_MIME.includes(file.type) || !ACCEPTED_EXTENSIONS.has(ext)) {
      toast.error("Geçersiz dosya türü. Sadece JPEG, PNG veya WebP yükleyebilirsin.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Dosya çok büyük. En fazla 5 MB yükleyebilirsin.");
      return;
    }
    uploadImage(file);
  }, [uploadImage]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [disabled, isUploading, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!value) {
      onChange('');
      return;
    }

    setIsUploading(true);
    
    try {
      const deleteSuccess = await deleteImageFromStorage(value);
      
      if (deleteSuccess) {
        onChange('');
        toast.success('Resim başarıyla silindi');
      } else {
        // Still clear the URL from the form even if deletion failed
        onChange('');
        toast.warning('Resim formdan kaldırıldı, ancak depolamadan silinirken hata oluştu');
      }
    } catch (error) {
      clientLogger.error({ message: 'image delete request failed', error, location: 'image-upload/delete' });
      // Still clear the URL from the form even if deletion failed
      onChange('');
      toast.warning('Resim formdan kaldırıldı, ancak depolamadan silinirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
          "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          isDragOver && "border-blue-400 bg-blue-50",
          disabled && "opacity-50 cursor-not-allowed",
          value ? "border-solid border-input" : "border-input"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {value ? (
          <div className="relative">
            <div className="relative aspect-video w-full max-w-[200px] mx-auto rounded-lg overflow-hidden">
              <Image
                src={value}
                alt="Uploaded image"
                fill
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {placeholder}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sürükleyip bırakın veya seçmek için tıklayın
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, WebP (maksimum 5 MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-card/80 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 