'use client';

import { useState, useEffect } from 'react';
import { useCache } from '@/hooks/use-cache';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DataExampleProps {
  cacheKey: string;
  ttl?: number;
}

export function CachedDataExample({ cacheKey, ttl = 60000 }: DataExampleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    data: cachedData,
    setCache,
    clearCache,
    isCached,
    getRemainingTTL
  } = useCache<any[]>(cacheKey, [], ttl);
  
  const [remainingTime, setRemainingTime] = useState<number>(0);
  
  // Update remaining time every second
  useEffect(() => {
    if (!isCached()) return;
    
    setRemainingTime(getRemainingTTL());
    
    const interval = setInterval(() => {
      const remaining = getRemainingTTL();
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isCached, getRemainingTTL]);
  
  // Simulate fetching data
  const fetchData = async () => {
    if (isCached()) {
      console.log('Using cached data');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data
      const newData = [
        { id: 1, name: 'Item ' + Math.floor(Math.random() * 100) },
        { id: 2, name: 'Item ' + Math.floor(Math.random() * 100) },
        { id: 3, name: 'Item ' + Math.floor(Math.random() * 100) },
      ];
      
      setCache(newData);
      console.log('Data fetched and cached');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on mount if not cached
  useEffect(() => {
    if (!isCached()) {
      fetchData();
    }
  }, []);
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Cached Data Example</h3>
        {isCached() && (
          <div className="text-xs text-gray-500">
            Cache expires in: {formatTime(remainingTime)}
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))
        ) : cachedData && cachedData.length > 0 ? (
          // Display data
          cachedData.map(item => (
            <div key={item.id} className="p-2 bg-gray-50 rounded">
              {item.name}
            </div>
          ))
        ) : (
          <div className="text-gray-500">No data available</div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button 
          onClick={fetchData} 
          disabled={isLoading}
          variant="default"
        >
          {isLoading ? 'Loading...' : isCached() ? 'Refresh (Cached)' : 'Fetch Data'}
        </Button>
        
        <Button 
          onClick={clearCache} 
          disabled={isLoading || !isCached()}
          variant="danger"
          size="sm"
        >
          Clear Cache
        </Button>
      </div>
    </div>
  );
} 