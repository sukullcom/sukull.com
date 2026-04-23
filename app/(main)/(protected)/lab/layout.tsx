import { redirect } from "next/navigation";
import { isLabEnabled } from "@/lib/feature-flags";

/**
 * Lab bölümü soft-sunset durumda.
 * - Birincil engelleme `middleware.ts` üzerinden yapılır.
 * - Bu layout, middleware atlansa dahi (örn. edge config değişirse)
 *   sunucu tarafında ikinci bir savunma katmanı sağlar.
 *
 * Etkinleştirmek için: NEXT_PUBLIC_ENABLE_LAB=true
 */
export default function LabLayout({ children }: { children: React.ReactNode }) {
  if (!isLabEnabled()) {
    redirect("/games");
  }
  return <>{children}</>;
}
