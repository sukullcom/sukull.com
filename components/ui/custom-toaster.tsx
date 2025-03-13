'use client';

import { Toaster as Sonner, toast } from 'sonner';
import styles from '@/styles/toast.module.css';

interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  richColors?: boolean;
  closeButton?: boolean;
  duration?: number;
}

export function CustomToaster({
  position = 'top-center',
  richColors = true,
  closeButton = true,
  duration = 4000,
  ...props
}: ToasterProps) {
  return (
    <Sonner
      position={position}
      richColors={richColors}
      closeButton={closeButton}
      duration={duration}
      theme="light"
      className={styles.toastContainer}
      toastOptions={{
        classNames: {
          toast: styles.toast,
          error: styles.errorToast,
          success: styles.successToast,
          warning: styles.warningToast,
          info: styles.infoToast,
          title: styles.toastTitle,
          description: styles.toastDescription,
          actionButton: styles.actionButton,
          closeButton: styles.closeButton,
        },
        style: {
          opacity: '1', // Ensure not transparent
        },
      }}
      {...props}
    />
  );
}

// Override default toast functions with Turkish default messages
export const turkishToast = {
  error: (message: string, options?: any) => toast.error(message, options),
  success: (message: string, options?: any) => toast.success(message, options),
  warning: (message: string, options?: any) => toast.warning(message, options),
  info: (message: string, options?: any) => toast.info(message, options),
  
  // Common messages
  errorDefault: (options?: any) => toast.error('Bir hata oluştu. Lütfen tekrar deneyin.', options),
  successDefault: (options?: any) => toast.success('İşlem başarıyla tamamlandı.', options),
  warningDefault: (options?: any) => toast.warning('Dikkat! Bir sorun oluşabilir.', options),
  infoDefault: (options?: any) => toast.info('Bilginize: İşlem devam ediyor.', options),
  savedSuccess: (options?: any) => toast.success('Başarıyla kaydedildi!', options),
  updatedSuccess: (options?: any) => toast.success('Başarıyla güncellendi!', options),
  deletedSuccess: (options?: any) => toast.success('Başarıyla silindi!', options),
  networkError: (options?: any) => toast.error('Ağ hatası! Lütfen internet bağlantınızı kontrol edin.', options),
  sessionExpired: (options?: any) => toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', options),
  permissionDenied: (options?: any) => toast.error('İzin reddedildi. Bu işlemi yapmaya yetkiniz yok.', options),
  limitReached: (options?: any) => toast.warning('Limite ulaştınız! Daha fazla ekleme yapamazsınız.', options),
  notFound: (options?: any) => toast.error('İstediğiniz içerik bulunamadı.', options),
  dataLoaded: (options?: any) => toast.success('Veriler başarıyla yüklendi.', options),
} 