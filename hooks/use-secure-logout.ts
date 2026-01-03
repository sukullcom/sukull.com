import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@/utils/auth';

export function useSecureLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

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

    if (isLoggingOut) {
      console.log('Logout already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsLoggingOut(true);
      
      if (showToast) {
        toast.loading('Çıkış yapılıyor...', { id: 'logout' });
      }

      // First try server-side logout for complete session cleanup
      if (!bypassServerLogout) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.warn('Server logout failed, falling back to client logout');
          } else {
            console.log('Server logout successful');
          }
        } catch (serverError) {
          console.warn('Server logout error, continuing with client logout:', serverError);
        }
      }

      // Always perform client-side logout as well
      await auth.signOut();

      if (showToast) {
        toast.success('Başarıyla çıkış yapıldı', { id: 'logout' });
      }

      // Redirect to login page with logout flag to prevent middleware loop
      if (typeof window !== 'undefined') {
        const logoutUrl = redirectTo.includes('?') 
          ? `${redirectTo}&logout=true` 
          : `${redirectTo}?logout=true`;
        window.location.href = logoutUrl;
      }

    } catch (error) {
      console.error('Logout error:', error);
      
      if (showToast) {
        toast.error('Çıkış yapılırken bir hata oluştu', { id: 'logout' });
      }

      // Force redirect even on error for security
      if (typeof window !== 'undefined') {
        const errorRedirect = redirectTo.includes('?') 
          ? `${redirectTo}&error=logout_failed` 
          : `${redirectTo}?error=logout_failed`;
        window.location.href = errorRedirect;
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  return {
    logout,
    isLoggingOut,
  };
} 