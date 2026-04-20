import { useEffect, useCallback } from 'react';

/**
 * Triggers a one-shot lesson status refresh when a teacher dashboard page mounts,
 * so stale "pending/confirmed" rows are normalized on first view.
 *
 * Periodic updates for ALL users are now handled by a Vercel Cron job
 * (see vercel.json → /api/private-lesson/update-lesson-statuses).
 * We no longer run a client-side setInterval, which prevented cross-tab
 * duplicate UPDATEs and ensured lessons advance even when no teacher is online.
 */
export function useLessonStatusUpdater() {
  const updateLessonStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/private-lesson/update-lesson-statuses', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.updated > 0) {
          window.dispatchEvent(new CustomEvent('lessonStatusUpdated', {
            detail: { updated: data.updated, results: data.results },
          }));
        }
      }
    } catch (error) {
      console.error('Error updating lesson statuses:', error);
    }
  }, []);

  useEffect(() => {
    updateLessonStatuses();
  }, [updateLessonStatuses]);

  return {
    updateLessonStatuses,
  };
}
