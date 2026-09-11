import { redirect } from "next/navigation";

/** Eski doğrulama-yeniden-gönder bağlantıları girişe düşer. */
export default function ResendVerificationPage() {
  redirect("/login");
}
