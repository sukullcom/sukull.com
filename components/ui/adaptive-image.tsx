"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface AdaptiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
}

// Check if URL is external (not from our domain or local paths)
function isExternalUrl(url: string): boolean {
  if (url.startsWith('/')) return false; // Local path
  if (url.startsWith('data:')) return false; // Data URL
  
  try {
    const urlObj = new URL(url);
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'sukull.com';
    return urlObj.hostname !== currentDomain && urlObj.hostname !== 'localhost';
  } catch {
    return false; // Invalid URL, treat as local
  }
}

export function AdaptiveImage({
  src,
  alt,
  width = 200,
  height = 200,
  fill = false,
  className = "",
  fallbackSrc = "/course_logos/default.svg",
  onError
}: AdaptiveImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.log(`Image failed to load: ${imgSrc}`);
    
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
    
    onError?.();
  };

  // Show placeholder if both original and fallback failed
  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`} style={{ width, height }}>
        <ImageIcon className="w-8 h-8" />
      </div>
    );
  }

  // Use regular img tag for external URLs to avoid Next.js optimization issues
  // This prevents 400 errors from domains not configured in next.config.js
  if (isExternalUrl(imgSrc)) {
    // Using regular img for external URLs to bypass Next.js optimization
    // eslint-disable-next-line @next/next/no-img-element
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt={alt || 'External image'}
        onError={handleError}
        className={`${className} ${fill ? 'w-full h-full object-cover' : ''}`}
        {...(fill ? {} : { width, height })}
      />
    );
  }

  // Use Next.js Image for local images
  return (
    <Image
      src={imgSrc}
      alt={alt || 'Local image'}
      onError={handleError}
      className={className}
      {...(fill ? { fill: true } : { width, height })}
    />
  );
} 