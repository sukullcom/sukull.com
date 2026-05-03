/**
 * Optimized Supabase query utilities
 * Provides batching, caching, and retry mechanisms to reduce costs and improve performance
 */

import { createClient } from './client';
import { appCache, schoolsCache, usersCache } from '../cache';
import { clientLogger } from '@/lib/client-logger';
import { fetchPeerProfilesForStudyBuddy } from './fetch-peer-profiles';

// Constants
const BATCH_SIZE = 100; // Maximum number of items to fetch in a single query
const CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 500; // ms

/**
 * Fetch data with automatic retries
 * @param queryFn Function that performs the Supabase query
 * @returns Query result
 */
export async function fetchWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        lastError = error;
        clientLogger.warn(`supabase query error (attempt ${attempt + 1}/${RETRY_ATTEMPTS})`, {
          error: error instanceof Error ? error.message : String(error),
        });
        
        // Wait before retrying
        if (attempt < RETRY_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        }
        continue;
      }
      
      return data as T;
    } catch (error) {
      lastError = error;
      clientLogger.warn(`supabase query threw (attempt ${attempt + 1}/${RETRY_ATTEMPTS})`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Wait before retrying
      if (attempt < RETRY_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('Query failed after multiple attempts');
}

/**
 * Fetch all schools with caching
 * @returns Array of schools
 */
export async function fetchAllSchools() {
  return schoolsCache.getOrSet('all', async () => {
    const supabase = createClient();
    
    const result = await fetchWithRetry(async () =>
      supabase.from('schools').select('id, name, type').order('name'),
    );
    
    return result || [];
  }, CACHE_TTL.LONG); // Cache for 30 minutes
}

/**
 * Fetch user data by ID with caching
 * @param userId User ID
 * @returns User data or null if not found
 */
export async function fetchUserById(userId: string) {
  return usersCache.getOrSet(userId, async () => {
    const supabase = createClient();
    const map = await fetchPeerProfilesForStudyBuddy(supabase, [userId]);
    const row = map.get(userId);
    if (!row) return null;
    return { id: row.id, name: row.name, avatar: row.avatar };
  }, CACHE_TTL.MEDIUM); // Cache for 5 minutes
}

/**
 * Fetch multiple users by IDs in an efficient batch
 * @param userIds Array of user IDs
 * @returns Map of user ID to user data
 */
export async function fetchUsersByIds(userIds: string[]) {
  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(userIds));
  
  // Check cache first
  const cachedUsers: Record<string, any> = {};
  const idsToFetch: string[] = [];
  
  for (const id of uniqueIds) {
    const cached = usersCache.get(id);
    if (cached) {
      cachedUsers[id] = cached;
    } else {
      idsToFetch.push(id);
    }
  }
  
  // If all users are cached, return immediately
  if (idsToFetch.length === 0) {
    return cachedUsers;
  }
  
  // Fetch users in batches
  const supabase = createClient();
  const fetchedUsers: Record<string, any> = {};
  
  for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
    const batchIds = idsToFetch.slice(i, i + BATCH_SIZE);
    
    const map = await fetchPeerProfilesForStudyBuddy(supabase, batchIds);
    if (map.size > 0) {
      for (const [id, user] of Array.from(map.entries())) {
        const row = { id: user.id, name: user.name, avatar: user.avatar };
        usersCache.set(id, row, CACHE_TTL.MEDIUM);
        fetchedUsers[id] = row;
      }
    }
  }
  
  // Combine cached and fetched users
  return { ...cachedUsers, ...fetchedUsers };
}

/**
 * Fetch multiple schools by IDs in an efficient batch
 * @param schoolIds Array of school IDs
 * @returns Map of school ID to school data
 */
export async function fetchSchoolsByIds(schoolIds: number[]) {
  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(schoolIds));
  
  // Check cache first
  const cachedSchools: Record<number, any> = {};
  const idsToFetch: number[] = [];
  
  for (const id of uniqueIds) {
    const cached = schoolsCache.get(id.toString());
    if (cached) {
      cachedSchools[id] = cached;
    } else {
      idsToFetch.push(id);
    }
  }
  
  // If all schools are cached, return immediately
  if (idsToFetch.length === 0) {
    return cachedSchools;
  }
  
  // Fetch schools in batches
  const supabase = createClient();
  const fetchedSchools: Record<number, any> = {};
  
  for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
    const batchIds = idsToFetch.slice(i, i + BATCH_SIZE);
    
    const result = await fetchWithRetry(async () =>
      supabase.from('schools').select('id, name, type').in('id', batchIds),
    );
    
    // Cache individual schools and add to result
    if (result && Array.isArray(result)) {
      for (const school of result) {
        schoolsCache.set(school.id.toString(), school, CACHE_TTL.LONG);
        fetchedSchools[school.id] = school;
      }
    }
  }
  
  // Combine cached and fetched schools
  return { ...cachedSchools, ...fetchedSchools };
} 