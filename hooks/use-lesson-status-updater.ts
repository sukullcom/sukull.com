import { useEffect, useRef, useCallback } from 'react';

export function useLessonStatusUpdater() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const updateLessonStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/private-lesson/update-lesson-statuses', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.updated > 0) {
          console.log(`Updated ${data.updated} lessons status`);
          
          // Only refresh if there have been significant changes and enough time has passed
          const now = Date.now();
          if (now - lastUpdateRef.current > 30000) { // Only refresh once every 30 seconds
            lastUpdateRef.current = now;
            // Instead of hard refresh, trigger a soft reload by dispatching a custom event
            window.dispatchEvent(new CustomEvent('lessonStatusUpdated', { 
              detail: { updated: data.updated, results: data.results } 
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error updating lesson statuses:', error);
    }
  }, []);

  useEffect(() => {
    // Update lesson statuses immediately when the hook is used
    updateLessonStatuses();

    // Set up an interval to check every 2 minutes
    intervalRef.current = setInterval(updateLessonStatuses, 2 * 60 * 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateLessonStatuses]);

  return {
    updateLessonStatuses
  };
} 