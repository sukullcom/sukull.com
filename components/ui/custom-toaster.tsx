'use client';

import { Toaster as Sonner, toast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface ToasterProps {
  customToast?: {
    messages?: {
      success?: ToastOptions;
      error?: ToastOptions;
      warning?: ToastOptions;
      info?: ToastOptions;
    };
  };
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  closeButton?: boolean;
  richColors?: boolean;
  duration?: number;
}

// Changed to CustomToaster to match the import in layout.tsx
export function CustomToaster({ 
  customToast,
  position = 'top-center',
  closeButton = true,
  richColors = true,
  duration = 3000
}: ToasterProps) {
  // Default toast messages in Turkish
  const defaultToastMessages = {
    success: {
      title: "Başarılı",
      description: "İşlem başarıyla tamamlandı.",
      variant: "default",
      duration: 3000,
    },
    error: {
      title: "Hata",
      description: "Bir hata oluştu. Lütfen tekrar deneyin.",
      variant: "destructive",
      duration: 3000,
    },
    warning: {
      title: "Uyarı",
      description: "Dikkatli olmalısınız.",
      variant: "default",
      duration: 3000,
    },
    info: {
      title: "Bilgi",
      description: "Bilgilendirme mesajı.",
      variant: "default",
      duration: 3000,
    },
  }

  const messages = customToast?.messages
    ? {
        success: { ...defaultToastMessages.success, ...customToast.messages.success },
        error: { ...defaultToastMessages.error, ...customToast.messages.error },
        warning: { ...defaultToastMessages.warning, ...customToast.messages.warning },
        info: { ...defaultToastMessages.info, ...customToast.messages.info },
      }
    : defaultToastMessages

  return (
    <Sonner
      position={position}
      closeButton={closeButton}
      richColors={richColors}
      duration={duration}
      theme="light"
    />
  )
}

// Also export as Toaster for backward compatibility
export { CustomToaster as Toaster }

// Override default toast functions with Turkish default messages
export const turkishToast = {
  error: (message: string, options?: ToastOptions) => toast.error(message, options),
  success: (message: string, options?: ToastOptions) => toast.success(message, options),
  warning: (message: string, options?: ToastOptions) => toast.warning(message, options),
  info: (message: string, options?: ToastOptions) => toast.info(message, options),
  
  // Common messages
  errorDefault: (options?: ToastOptions) => toast.error('Bir hata oluştu. Lütfen tekrar deneyin.', options),
  successDefault: (options?: ToastOptions) => toast.success('İşlem başarıyla tamamlandı.', options),
  warningDefault: (options?: ToastOptions) => toast.warning('Dikkat! Bir sorun oluşabilir.', options),
  infoDefault: (options?: ToastOptions) => toast.info('Bilginize: İşlem devam ediyor.', options),
  savedSuccess: (options?: ToastOptions) => toast.success('Başarıyla kaydedildi!', options),
  updatedSuccess: (options?: ToastOptions) => toast.success('Başarıyla güncellendi!', options),
  deletedSuccess: (options?: ToastOptions) => toast.success('Başarıyla silindi!', options),
  networkError: (options?: ToastOptions) => toast.error('Ağ hatası! Lütfen internet bağlantınızı kontrol edin.', options),
  sessionExpired: (options?: ToastOptions) => toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', options),
  permissionDenied: (options?: ToastOptions) => toast.error('İzin reddedildi. Bu işlemi yapmaya yetkiniz yok.', options),
  limitReached: (options?: ToastOptions) => toast.warning('Limite ulaştınız! Daha fazla ekleme yapamazsınız.', options),
  notFound: (options?: ToastOptions) => toast.error('İstediğiniz içerik bulunamadı.', options),
  dataLoaded: (options?: ToastOptions) => toast.success('Veriler başarıyla yüklendi.', options),
} 