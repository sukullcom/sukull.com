import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Eğitmenler | Sukull",
  description: "Onaylı eğitmenlerle birebir özel ders talebi oluştur ve iletişim kur.",
};

export default function TeachersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
