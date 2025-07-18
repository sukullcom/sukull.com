'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const supabaseClient = createClient();

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
    });
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_: unknown, session: Session | null) => {
        setSession(session);
      }    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      <div className="relative aspect-square max-h-[300px] w-full">
        <Image src="/hero.svg" fill alt="Hero" sizes="100vw" />
      </div>
      <div className="flex flex-col items-center gap-y-8">
        <h1 className="text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center">
          Sukull ile öğren, pratik yap ve keşfet
        </h1>
        <div className="flex flex-col items-center gap-y-3 max-w-[330px] w-full">
          {!session && (
            <>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/create-account')}
              >
                Haydİ Başlayalım
              </Button>
              <Button
                size="lg"
                variant="primaryOutline"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Zaten hesabın var mı
              </Button>
            </>
          )}
          {session && (
            <Button size="lg" variant="secondary" className="w-full" asChild>
              <Link prefetch={false} href="/learn">
                Öğrenmeye Devam Et
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
