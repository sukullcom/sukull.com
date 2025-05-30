'use client';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useSecureLogout } from '@/hooks/use-secure-logout';

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
    <header className="h-20 w-full border-b-2 border-slate-200 px-4">
      <div className="lg:max-w-screen-lg mx-auto flex items-center justify-between h-full">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image src="/mascot_purple.svg" height={40} width={40} alt="Mascot" />
          <h1 className="text-2xl font-extrabold text-green-600 tracking-wide">Sukull</h1>
        </div>
        {loading && <div className="text-sm">Yükleniyor...</div>}
        {!loading && session ? (
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
          </Button>
        ) : (
          <Button size="lg" variant="ghost" onClick={() => router.push('/login')}>
            Gİrİş Yap
          </Button>
        )}
      </div>
    </header>
  );
};
