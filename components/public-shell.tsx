import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Auth ve marketing route group'ları aynı "full-height, header+main+footer"
 * iskeletini paylaşır ama Header/Footer içerikleri kasıtlı farklıdır
 * (auth → minimal; marketing → CTA'lı). Bu shell sadece dış çerçeveyi
 * sağlar; tüketiciler Header ve Footer bileşenlerini kendileri geçirir.
 */
type PublicShellProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  /** Ana içerik sütununun hizalaması. */
  mainAlignment?: "center" | "top";
  /** <main> arka plan rengi için ek class; default transparan. */
  mainClassName?: string;
};

export function PublicShell({
  header,
  footer,
  children,
  mainAlignment = "center",
  mainClassName,
}: PublicShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {header}
      <main
        className={cn(
          "flex-1 flex flex-col",
          mainAlignment === "center" && "items-center justify-center",
          mainClassName,
        )}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
