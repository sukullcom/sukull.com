'use client';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useSecureLogout } from '@/hooks/use-secure-logout';
import { BRAND_MASCOT_DISPLAY_PATH } from '@/lib/brand-mascot';

const supabaseClient = createClient();

export const Header = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout, isLoggingOut } = useSecureLogout();

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabaseClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setLoading(false);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logout({
      showToast: true,
      redirectTo: '/login'
    });
  };

  return (
    <header className="h-16 w-full border-b-2 border-border px-3 sm:h-20 sm:px-4">
      <div className="lg:max-w-screen-lg mx-auto flex items-center justify-between gap-2 h-full">
        <div className="flex items-center gap-x-2 sm:gap-x-3 min-w-0">
          <Image
            src={BRAND_MASCOT_DISPLAY_PATH}
            height={40}
            width={40}
            alt="Sukull"
            className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10"
          />
          <h1 className="truncate text-xl font-extrabold tracking-wide text-suk-brand sm:text-2xl">
            Sukull
          </h1>
        </div>
        {loading && <div className="text-xs text-muted-foreground sm:text-sm">Yükleniyor...</div>}
        {!loading && session ? (
          <Button
            variant="ghost"
            size="sm"
            className="sm:h-11 sm:px-5 shrink-0"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Çıkış...' : 'Çıkış Yap'}
          </Button>
        ) : !loading ? (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="sm:h-11 sm:px-5 px-3"
              onClick={() => router.push('/login')}
            >
              Giriş Yap
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="sm:h-11 sm:px-5 px-3"
              onClick={() => router.push('/create-account')}
            >
              Kayıt Ol
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
