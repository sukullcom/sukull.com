/**
 * Global caching utility for the application
 * Provides memory caching with TTL and LRU eviction
 */

type CacheEntry<T> = {
  value: T;
  expiry: number;
  lastAccessed: number;
};

class AppCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number;
  
  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.value as T;
  }
  
  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in milliseconds (optional, defaults to constructor value)
   */
  set<T>(key: string, value: T, ttl = this.defaultTTL): void {
    // Evict entries if we're at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      lastAccessed: Date.now(),
    });
  }
  
  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get a value from the cache, or compute and cache it if not found
   * @param key The cache key
   * @param factory Function to compute the value if not in cache
   * @param ttl Time to live in milliseconds (optional)
   * @returns The cached or computed value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    
    try {
      const value = await factory();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.error(`Error computing cached value for key ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Create a singleton instance
export const appCache = new AppCache();

// Export a namespace-based cache factory for domain-specific caches
export const createNamespacedCache = (namespace: string) => {
  return {
    get: <T>(key: string): T | undefined => {
      return appCache.get<T>(`${namespace}:${key}`);
    },
    set: <T>(key: string, value: T, ttl?: number): void => {
      appCache.set<T>(`${namespace}:${key}`, value, ttl);
    },
    delete: (key: string): void => {
      appCache.delete(`${namespace}:${key}`);
    },
    getOrSet: <T>(
      key: string,
      factory: () => Promise<T>,
      ttl?: number
    ): Promise<T> => {
      return appCache.getOrSet<T>(`${namespace}:${key}`, factory, ttl);
    },
  };
};

// Create domain-specific caches
export const schoolsCache = createNamespacedCache('schools');
export const usersCache = createNamespacedCache('users');
export const postsCache = createNamespacedCache('posts');
export const chatsCache = createNamespacedCache('chats'); 