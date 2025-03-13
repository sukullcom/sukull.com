'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CacheStatusProps {
  className?: string;
  showToast?: boolean;
}

export function CacheStatus({ className, showToast = false }: CacheStatusProps) {
  const [cacheStatus, setCacheStatus] = useState<string>('Checking...');
  const [isFromCache, setIsFromCache] = useState<boolean | null>(null);

  useEffect(() => {
    // Get the cache status from the headers
    const checkCacheStatus = async () => {
      try {
        // Make a HEAD request to the current URL to check headers
        const response = await fetch(window.location.href, { 
          method: 'HEAD',
          cache: 'no-store' // To ensure we get the actual headers
        });
        
        // Check for headers that indicate cache status
        const cfCache = response.headers.get('cf-cache-status');
        const vercelCache = response.headers.get('x-vercel-cache');
        const ageHeader = response.headers.get('age');
        const cacheControl = response.headers.get('cache-control');
        
        let status = 'Unknown';
        let fromCache = false;
        
        if (cfCache) {
          status = `Cloudflare: ${cfCache}`;
          fromCache = cfCache === 'HIT';
        } else if (vercelCache) {
          status = `Vercel: ${vercelCache}`;
          fromCache = vercelCache === 'HIT';
        } else if (ageHeader && parseInt(ageHeader) > 0) {
          status = `CDN Cached (Age: ${ageHeader})`;
          fromCache = true;
        } else if (cacheControl && cacheControl.includes('public')) {
          status = `Cacheable (${cacheControl})`;
          fromCache = false;
        } else {
          status = 'Fresh';
          fromCache = false;
        }
        
        setCacheStatus(status);
        setIsFromCache(fromCache);
        
        if (showToast) {
          toast(fromCache ? 'Loaded from cache' : 'Fresh content loaded', {
            description: status,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error checking cache status:', error);
        setCacheStatus('Error checking cache');
        setIsFromCache(null);
      }
    };

    // Run on mount
    checkCacheStatus();
    
    // Listen for navigation events if using App Router
    const handleRouteChange = () => {
      // Reset states
      setCacheStatus('Checking...');
      setIsFromCache(null);
      
      // Check again after a small delay to allow headers to be updated
      setTimeout(() => checkCacheStatus(), 100);
    };
    
    window.addEventListener('routechange', handleRouteChange);
    
    return () => {
      window.removeEventListener('routechange', handleRouteChange);
    };
  }, [showToast]);

  // Only render if we have a definitive answer
  if (isFromCache === null) return null;

  return (
    <div 
      className={`px-2 py-1 text-xs rounded ${
        isFromCache 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      } ${className}`}
      title="Cache status indicator"
    >
      {cacheStatus}
    </div>
  );
} 