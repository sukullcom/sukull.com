/**
 * Utility function to delete an image from Supabase storage
 * @param imageUrl - The full URL of the image to delete
 * @returns Promise<boolean> - true if deletion was successful, false otherwise
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  if (!imageUrl) {
    return false;
  }

  try {
    const response = await fetch(`/api/upload/image?imageUrl=${encodeURIComponent(imageUrl)}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    return false;
  }
}

/**
 * Extract filename from a Supabase storage URL
 * @param imageUrl - The full URL of the image
 * @returns string | null - The filename or null if invalid
 */
export function extractFilenameFromUrl(imageUrl: string): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Validate that it's a course image filename
    if (filename && filename.startsWith('course_')) {
      return filename;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return null;
  }
}

/**
 * Check if an image URL is a valid Supabase course image URL
 * @param imageUrl - The URL to validate
 * @returns boolean - true if valid, false otherwise
 */
export function isValidCourseImageUrl(imageUrl: string): boolean {
  if (!imageUrl) {
    return false;
  }

  try {
    // Check if it contains the expected pattern for Supabase storage URLs
    const containsStoragePath = imageUrl.includes('/storage/v1/object/public/course-images/');
    const filename = extractFilenameFromUrl(imageUrl);
    
    return containsStoragePath && filename !== null;
  } catch (error) {
    return false;
  }
} 