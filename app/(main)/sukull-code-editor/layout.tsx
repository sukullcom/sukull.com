import { redirect } from "next/navigation";
import { isCodeEditorEnabled } from "@/lib/feature-flags";

/**
 * Sukull Code Editor (ve /sukull-code-editor/snippets) soft-sunset durumda.
 * - Birincil engelleme `middleware.ts` üzerinden yapılır.
 * - Bu layout, middleware atlansa dahi sunucu tarafında ikinci bir
 *   savunma katmanı sağlar; ayrıca alt route'ları da kapsar.
 *
 * Etkinleştirmek için: NEXT_PUBLIC_ENABLE_CODE_EDITOR=true
 */
export default function CodeEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCodeEditorEnabled()) {
    redirect("/games");
  }
  return <>{children}</>;
}
