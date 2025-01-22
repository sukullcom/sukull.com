"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/app/firebase-client"; // firebase client
import { useRouter } from "next/navigation";

export const Header = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    // Firebase oturumu kapat
    await firebaseSignOut(auth);
    // sunucu cookiesini temizle
    await fetch("/api/clearToken", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="h-20 w-full border-b-2 border-slate-200 px-4">
      <div className="lg:max-w-screen-lg mx-auto flex items-center justify-between h-full">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image src="/mascot_purple.svg" height={40} width={40} alt="Mascot" />
          <h1 className="text-2xl font-extrabold text-green-600 tracking-wide">
            Sukull
          </h1>
        </div>

        {loading && (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-gray-400 rounded-full border-r-transparent"></div>
            <span>Yükleniyor...</span>
          </div>
        )}

        {!loading && (
          <>
            {user ? (
              <Button variant="ghost" size="lg" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            ) : (
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  // Login sayfasına gidelim
                  router.push("/login");
                }}
              >
                Giriş Yap
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
