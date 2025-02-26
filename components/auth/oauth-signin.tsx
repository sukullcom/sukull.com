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
  const searchParams = useSearchParams();
  const nextUrl = redirectUrl || searchParams.get("next") || "/courses";
  const loading = isLoading ?? internalLoading;
  const setLoading = onLoadingChange ?? setInternalLoading;

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    try {
      setLoading(true);
      await auth.signInWithOAuth(provider, nextUrl);
    } catch (error) {
      const { message } = getAuthError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="primaryOutline"
        type="button"
        disabled={loading}
        onClick={() => handleOAuthSignIn("github")}
      >
        <Icons.gitHub className="mr-2 h-4 w-4" />
        Github
      </Button>
      <Button
        variant="primaryOutline"
        type="button"
        disabled={loading}
        onClick={() => handleOAuthSignIn("google")}
      >
        <Icons.google className="mr-2 h-4 w-4" />
        Google
      </Button>
    </div>
  );
}

export function OAuthSignIn(props: Props) {
  return (
    <div className="w-full">
      {/* 
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
          <div className="grid grid-cols-2 gap-4">
            <Button variant="primaryOutline" disabled>
              <Icons.gitHub className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="primaryOutline" disabled>
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        }
      >
        <OAuthButtons {...props} />
      </Suspense>
    </div>
  );
}
