"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  fallbackSrc = "/course_logos/default.svg",
  onError
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Reset state when src prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    console.log(`Image failed to load: ${imgSrc}`);
    setHasError(true);
    
    // Try fallback if we haven't already
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      // Even fallback failed, show placeholder
      setHasError(true);
    }
    
    onError?.();
  };

  // If both original and fallback failed, show placeholder
  if (hasError && imgSrc === fallbackSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <ImageIcon className="w-8 h-8" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Image'}
      onError={handleError}
      className={className}
      {...(fill ? { fill: true } : { width: width || 200, height: height || 200 })}
    />
  );
} 