"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/utils/auth";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getAuthError } from "@/utils/auth-errors";
import { Icons } from "@/components/icons";

interface Props {
  isLoading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  redirectUrl?: string;
}

function OAuthButtons({ isLoading, onLoadingChange, redirectUrl }: Props) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const nextUrl = redirectUrl || searchParams.get("next") || "/courses";
  const loading = isLoading ?? internalLoading;
  const setLoading = onLoadingChange ?? setInternalLoading;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setProviderLoading(true);
      await auth.signInWithOAuth('google', nextUrl);
    } catch (error) {
      const { message } = getAuthError(error);
      toast.error(`Google girişi başarısız: ${message}`);
      setLoading(false);
      setProviderLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      type="button"
      disabled={loading}
      onClick={handleGoogleSignIn}
      className="w-full"
    >
      {providerLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icons.google className="mr-2 h-4 w-4" />
      )}
      Google ile devam et
    </Button>
  );
}

export function OAuthSignIn(props: Props) {
  return (
    <div className="w-full">
      {/* -----
        The line + text + line container 
        (removes absolute positioning, 
        instead uses a flex layout to show lines on both sides) 
      */}
      <div className="flex items-center mb-4 space-x-2">
        <div className="flex-grow border-t border-gray-300" />
        <span className="text-xs uppercase text-muted-foreground">
          Veya
        </span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      <Suspense
        fallback={
          <Button variant="default" disabled className="w-full">
            <Icons.google className="mr-2 h-4 w-4" />
            Google ile devam et
          </Button>
        }
      >
        <OAuthButtons {...props} />
      </Suspense>
    </div>
  );
}
