/** Aynı site içi yönlendirme. Açık yönlendirme (//, şema) kabul edilmez. */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  const next = value.trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.includes("://") || next.includes("\\") || next.includes("\n") || next.includes("\r")) {
    return fallback;
  }
  return next;
}
