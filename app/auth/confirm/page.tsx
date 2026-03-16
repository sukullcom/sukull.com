'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Icons } from '@/components/icons';
import { Suspense } from 'react';

function ConfirmContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verify = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite';
      const next = searchParams.get('next');

      if (!tokenHash || !type) {
        setStatus('error');
        setErrorMessage('Doğrulama parametreleri eksik');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        setTimeout(() => {
          router.push('/auth-error?error=' + encodeURIComponent(error.message));
        }, 2000);
        return;
      }

      setStatus('success');

      if (type === 'recovery') {
        setTimeout(() => router.push('/reset-password'), 1500);
      } else {
        setTimeout(() => router.push(next || '/courses'), 1500);
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-135px)] gap-4 p-4 max-w-md mx-auto text-center">
      {status === 'verifying' && (
        <>
          <Icons.spinner className="h-10 w-10 animate-spin text-green-500" />
          <h1 className="text-xl font-bold">E-posta doğrulanıyor...</h1>
          <p className="text-gray-500">Lütfen bekleyin, hesabınız doğrulanıyor.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold text-green-600">E-posta doğrulandı!</h1>
          <p className="text-gray-500">Yönlendiriliyorsunuz...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold text-red-600">Doğrulama hatası</h1>
          <p className="text-gray-500">{errorMessage}</p>
          <p className="text-sm text-gray-400">Hata sayfasına yönlendiriliyorsunuz...</p>
        </>
      )}
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-135px)] gap-4">
          <Icons.spinner className="h-10 w-10 animate-spin text-green-500" />
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
