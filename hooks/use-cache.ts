'use client';

import { useState, useEffect, useCallback } from 'react';

// Cache structure type
interface CacheEntry<T> {
  value: T;
  expiry: number; // timestamp when this entry expires
}

// Cache storage
const cacheStore: Record<string, CacheEntry<any>> = {};

/**
 * Hook for caching data with TTL
 * @param key - Unique cache key
 * @param initialData - Initial data (optional)
 * @param ttl - Time to live in milliseconds, 0 means no expiry (default: 5 minutes)
 */
export function useCache<T>(
  key: string,
  initialData?: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes default TTL
) {
  const [data, setData] = useState<T | undefined>(() => {
    // Try to get from cache on initialization
    const cached = cacheStore[key];
    
    // If valid cache entry exists and hasn't expired
    if (cached && (cached.expiry > Date.now() || cached.expiry === 0)) {
      return cached.value;
    }
    
    // Initialize with provided initial data
    return initialData;
  });

  // Set data in cache and state
  const setCache = useCallback((newData: T) => {
    // Set in state
    setData(newData);
    
    // Set in cache store with expiry
    cacheStore[key] = {
      value: newData,
      expiry: ttl === 0 ? 0 : Date.now() + ttl
    };
  }, [key, ttl]);

  // Clear this cache entry
  const clearCache = useCallback(() => {
    delete cacheStore[key];
    setData(undefined);
  }, [key]);

  // Check if this cache key has valid data
  const isCached = useCallback(() => {
    const cached = cacheStore[key];
    return cached && (cached.expiry > Date.now() || cached.expiry === 0);
  }, [key]);

  // Get remaining TTL in milliseconds
  const getRemainingTTL = useCallback(() => {
    const cached = cacheStore[key];
    if (!cached || cached.expiry === 0) return ttl;
    return Math.max(0, cached.expiry - Date.now());
  }, [key, ttl]);

  // Clear all cache entries
  const clearAllCache = useCallback(() => {
    Object.keys(cacheStore).forEach(cacheKey => {
      delete cacheStore[cacheKey];
    });
    setData(undefined);
  }, []);

  // Clean up expired cache entries
  useEffect(() => {
    const now = Date.now();
    
    // Clean up this entry if expired
    if (cacheStore[key] && cacheStore[key].expiry !== 0 && cacheStore[key].expiry < now) {
      delete cacheStore[key];
      setData(undefined);
    }
    
    // Optional: Set a timer to check expiry again after TTL
    if (ttl > 0) {
      const timerId = setTimeout(() => {
        if (cacheStore[key] && cacheStore[key].expiry < Date.now()) {
          delete cacheStore[key];
          setData(undefined);
        }
      }, ttl);
      
      return () => clearTimeout(timerId);
    }
  }, [key, ttl]);

  return {
    data,
    setCache,
    clearCache,
    isCached,
    getRemainingTTL,
    clearAllCache
  };
} 