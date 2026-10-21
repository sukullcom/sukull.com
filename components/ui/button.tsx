"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&:focus:not(:focus-visible)]:ring-0 [&:focus:not(:focus-visible)]:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 tracking-wide",
  {
    variants: {
      variant: {
        locked:
          "bg-gradient-to-b from-slate-300 to-slate-400 text-slate-500 border border-slate-400/50 shadow-[0_6px_0_#94a3b8]",
        default:
          "bg-gradient-to-b from-slate-50 to-slate-100 text-slate-700 border-2 border-slate-200 shadow-[0_5px_0_#cbd5e1,0_8px_14px_-2px_rgba(100,116,139,0.12)] hover:bg-slate-100 hover:border-slate-300 active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_1px_0_#cbd5e1]",
        /** Birincil eylem — marka rengi, dolu 3D */
        primary:
          "bg-gradient-to-b from-suk-brand to-suk-brand-hover text-suk-brand-fg border border-suk-brand-border/40 shadow-[0_6px_0_hsl(var(--suk-brand-border)),0_10px_16px_-2px_hsl(var(--suk-brand)/0.35)] hover:brightness-105 active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_2px_0_hsl(var(--suk-brand-border)),0_2px_4px_hsl(var(--suk-brand)/0.2)] active:brightness-95",
        primaryOutline:
          "bg-suk-surface-card text-suk-brand border-2 border-suk-brand hover:bg-suk-brand-soft",
        /** Çerçevesiz ikincil — tam genişlik CTA satırı, çıkış vb. */
        linkBrand:
          "bg-transparent text-suk-brand border-0 shadow-none hover:bg-suk-brand-soft",
        linkDanger:
          "bg-transparent text-suk-danger border-0 shadow-none hover:bg-suk-danger-soft",
        /**
         * İkincil dolu marka rengi — görsel olarak `primary` ile aynı kontrast (açık metin).
         * Aynı ekranda çerçeveli ikinci eylem gerekiyorsa `secondaryOutline` / `primaryOutline` kullanın.
         */
        secondary:
          "bg-gradient-to-b from-suk-brand to-suk-brand-hover text-suk-brand-fg border border-suk-brand-border/40 shadow-[0_6px_0_hsl(var(--suk-brand-border)),0_10px_16px_-2px_hsl(var(--suk-brand)/0.35)] hover:brightness-105 active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_2px_0_hsl(var(--suk-brand-border)),0_2px_4px_hsl(var(--suk-brand)/0.2)] active:brightness-95",
        secondaryOutline:
          "bg-suk-surface-card text-suk-brand border-2 border-suk-brand hover:bg-suk-brand-soft",
        danger:
          "bg-gradient-to-b from-suk-danger to-rose-600 text-suk-danger-fg border border-rose-700/40 shadow-[0_6px_0_hsl(var(--suk-danger-border)),0_10px_16px_-2px_rgba(225,29,72,0.35)] hover:brightness-105 active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_2px_0_hsl(var(--suk-danger-border)),0_2px_4px_rgba(225,29,72,0.2)] active:brightness-95",
        /** shadcn adıyla aynı renk ailesi — `danger` ile özdeş */
        destructive:
          "bg-gradient-to-b from-suk-danger to-rose-600 text-suk-danger-fg border border-rose-700/40 shadow-[0_6px_0_hsl(var(--suk-danger-border)),0_10px_16px_-2px_rgba(225,29,72,0.35)] hover:brightness-105 active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_2px_0_hsl(var(--suk-danger-border)),0_2px_4px_rgba(225,29,72,0.2)] active:brightness-95",
        dangerOutline:
          "bg-suk-surface-card text-suk-danger border-2 border-suk-danger-line hover:bg-suk-danger-soft",
        destructiveOutline:
          "bg-suk-surface-card text-suk-danger border-2 border-suk-danger-line hover:bg-suk-danger-soft",
        /** İptal / ikincil nötr — `default` ile aynı palet, daha belirgin dolgu */
        muted:
          "bg-muted text-foreground border-border border-2 border-b-4 active:border-b-2 active:translate-y-[2px] hover:bg-muted/85",
        /** Çerçeveli nötr (gri aile) */
        outline:
          "bg-background text-foreground border-border border-2 border-b-4 active:border-b-2 active:translate-y-[2px] hover:bg-muted",
        /** Ödeme / paket satın alma / checkout */
        payment:
          "bg-gradient-to-b from-suk-payment to-indigo-600 text-suk-payment-fg border border-indigo-700/40 shadow-[0_6px_0_hsl(var(--suk-payment-border)),0_10px_16px_-2px_rgba(99,102,241,0.35)] hover:brightness-105 active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_2px_0_hsl(var(--suk-payment-border)),0_2px_4px_rgba(99,102,241,0.2)] active:brightness-95",
        paymentOutline:
          "bg-suk-surface-card text-suk-payment-soft-fg border-2 border-suk-payment-ring border-b-4 border-b-suk-payment-border hover:bg-suk-payment-soft active:border-b-2 active:translate-y-[2px]",
        /** İstikrar / bonus / puan harcama — amber, dikkat (ödeme değil) */
        warning:
          "bg-suk-warning text-white hover:brightness-105 border border-black/10 border-b-4 border-b-suk-warning-soft-fg/35 active:border-b-2 active:translate-y-[2px]",
        super:
          "bg-gradient-to-b from-suk-play to-purple-600 text-suk-play-fg border border-purple-700/40 shadow-[0_6px_0_hsl(var(--suk-play-border)),0_10px_16px_-2px_rgba(168,85,247,0.35)] hover:brightness-105 active:translate-y-[4px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_2px_0_hsl(var(--suk-play-border)),0_2px_4px_rgba(168,85,247,0.2)] active:brightness-95",
        superOutline:
          "bg-suk-surface-card text-suk-play border-2 border-suk-play-line hover:bg-suk-play-soft",
        ghost:
          "bg-transparent text-suk-fg-muted border-transparent border-0 hover:bg-suk-surface-muted",
        sidebar:
          "bg-transparent text-suk-fg-muted border-2 border-transparent hover:bg-suk-surface-muted transition-none",
        /**
         * Aktif sidebar öğesi. Background + border tonları `ReferralInviteShopCard`
         * (mağaza sayfasındaki "Arkadaşını davet et" kartı) ile **birebir aynı yeşil
         * ailesini** kullanır — site genelinde "bu yüzey yeşil aksanlı / dikkat
         * çekici" tutumu için tek kalibrasyon. Hover, doygunluğu biraz arttırarak
         * tıklanabilirlik sinyali verir.
         */
        sidebarOutline:
          "bg-suk-brand-soft/40 text-suk-brand-border border-suk-brand/25 border-2 hover:bg-suk-brand-soft/60 transition-none",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
        rounded: "rounded-full"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
