"use client";

import { useSecureLogout } from "@/hooks/use-secure-logout";

export function LogoutButton() {
  const { logout, isLoggingOut } = useSecureLogout();
  return (
    <button
      type="button"
      disabled={isLoggingOut}
      onClick={() => logout({ redirectTo: "/login" })}
      className="flex min-h-14 w-full items-center px-4 py-4 text-left font-bold text-suk-danger hover:bg-suk-danger-soft active:transform-none"
    >
      Çıkış yap
    </button>
  );
}
