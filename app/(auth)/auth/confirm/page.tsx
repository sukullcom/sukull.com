"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icons } from "@/components/icons";
import { XCircle } from "lucide-react";

function ConfirmContent() {
  const [status, setStatus] = useState<"redirecting" | "error">("redirecting");
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenHash = searchParams?.get("token_hash");
    const type = searchParams?.get("type");
    const next = searchParams?.get("next");

    if (!tokenHash || !type) {
      setStatus("error");
      setErrorMessage("Doğrulama parametreleri eksik");
      return;
    }

    const callbackUrl = new URL("/api/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("token_hash", tokenHash);
    callbackUrl.searchParams.set("type", type);
    if (next) callbackUrl.searchParams.set("next", next);

    window.location.href = callbackUrl.toString();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 max-w-md mx-auto text-center">
      {status === "redirecting" && (
        <>
          <Icons.spinner className="h-10 w-10 animate-spin text-suk-brand" />
          <h1 className="text-xl font-bold">Doğrulanıyor...</h1>
          <p className="text-muted-foreground">Lütfen bekleyin, yönlendiriliyorsunuz.</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold text-destructive">Doğrulama hatası</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </>
      )}
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-4">
          <Icons.spinner className="h-10 w-10 animate-spin text-suk-brand" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
