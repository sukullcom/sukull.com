"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-[988px] mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center p-4 gap-2">
      <div className="relative w-[240px] h-[240px] lg:w-[424px] lg:h-[424px] mb-8 lg:mb-0">
        <Image src="/hero.svg" fill alt="Hero" />
      </div>
      <div className="flex flex-col items-center gap-y-8">
        <h1 className="text-xl lg:text-3xl font-bold text-neutral-600 max-w-[480px] text-center">
          Sukull ile öğren, pratik yap ve keşfet
        </h1>
        <div className="flex flex-col items-center gap-y-3 max-w-[330px] w-full">
          {!user && (
            <>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={() => router.push("/signup")}
              >
                Haydi Başlayalım
              </Button>
              <Button
                size="lg"
                variant="primaryOutline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Zaten hesabın var mı
              </Button>
            </>
          )}
          {user && (
            <Button size="lg" variant="secondary" className="w-full" asChild>
              <Link prefetch={false} href="/learn">Öğrenmeye Devam Et</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
