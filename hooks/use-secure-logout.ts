import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { auth } from '@/utils/auth';
import { clientLogger } from '@/lib/client-logger';

export function useSecureLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async (options?: { 
    showToast?: boolean; 
    redirectTo?: string;
    bypassServerLogout?: boolean;
  }) => {
    const { 
      showToast = true, 
      redirectTo = '/login',
      bypassServerLogout = false 
    } = options || {};

    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      
      if (showToast) {
        toast.loading('Çıkış yapılıyor...', { id: 'logout' });
      }

      if (!bypassServerLogout) {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          // Server logout failed, client logout will still clean up
        }
      }

      await auth.signOut();

      if (showToast) {
        toast.success('Başarıyla çıkış yapıldı', { id: 'logout' });
      }

      if (typeof window !== 'undefined') {
        const logoutUrl = redirectTo.includes('?') 
          ? `${redirectTo}&logout=true` 
          : `${redirectTo}?logout=true`;
        window.location.href = logoutUrl;
      }

    } catch (error) {
      clientLogger.error({ message: 'client logout failed', error, location: 'use-secure-logout' });
      
      if (showToast) {
        toast.error('Çıkış yapılırken bir hata oluştu', { id: 'logout' });
      }

      if (typeof window !== 'undefined') {
        const errorRedirect = redirectTo.includes('?') 
          ? `${redirectTo}&error=logout_failed` 
          : `${redirectTo}?error=logout_failed`;
        window.location.href = errorRedirect;
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return {
    logout,
    isLoggingOut,
  };
}