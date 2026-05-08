"use client";

/**
 * Iyzico / ödeme sayfalarında tüketiciye güven vermek için Visa, Mastercard
 * ve resmî "iyzico ile Öde" görseli. Görseller `public/payment/` altında.
 */
export function PaymentTrustStrip({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  const gap = variant === "compact" ? "gap-3" : "gap-5";
  const h = variant === "compact" ? "h-5" : "h-7";

  return (
    <div
      className={`flex flex-wrap items-center justify-center ${gap} opacity-95 ${className}`}
      aria-label="Kabul edilen ödeme yöntemleri"
    >
      <img
        src="/payment/visa.svg"
        alt="Visa"
        width={72}
        height={24}
        className={`${h} w-auto object-contain`}
        loading="lazy"
        decoding="async"
      />
      <img
        src="/payment/mastercard.svg"
        alt="Mastercard"
        width={40}
        height={28}
        className={`${h} w-auto object-contain`}
        loading="lazy"
        decoding="async"
      />
      <img
        src="/payment/iyzico-ile-ode-horizontal.svg"
        alt="iyzico ile Öde"
        width={200}
        height={40}
        className={`${variant === "compact" ? "h-6" : "h-8"} w-auto max-w-[min(100%,200px)] object-contain object-left`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
