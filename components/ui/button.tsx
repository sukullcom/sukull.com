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
          "bg-suk-neutral-locked text-suk-neutral-locked-fg hover:bg-suk-neutral-locked/90 border-suk-neutral-locked-border border-b-4 active:border-b-0",
        default:
          "bg-suk-surface-card text-suk-fg-muted border-suk-border border-2 border-b-4 active:border-b-2 hover:bg-suk-surface-muted",
        primary:
          "bg-suk-brand text-suk-brand-fg hover:bg-suk-brand-hover border-suk-brand-border border-b-4 active:border-b-0",
        primaryOutline:
          "bg-suk-surface-card text-suk-brand hover:bg-suk-surface-muted",
        secondary:
          "bg-suk-brand text-suk-brand-fg hover:bg-suk-brand-hover border-suk-brand-border border-b-4 active:border-b-0",
        secondaryOutline:
          "bg-suk-surface-card text-suk-brand hover:bg-suk-surface-muted",
        danger:
          "bg-suk-danger text-suk-danger-fg hover:bg-suk-danger-hover border-suk-danger-border border-b-4 active:border-b-0",
        /** shadcn adıyla aynı renk ailesi — `danger` ile özdeş */
        destructive:
          "bg-suk-danger text-suk-danger-fg hover:bg-suk-danger-hover border-suk-danger-border border-b-4 active:border-b-0",
        dangerOutline:
          "bg-suk-surface-card text-suk-danger border-2 border-suk-danger-line hover:bg-suk-danger-soft",
        destructiveOutline:
          "bg-suk-surface-card text-suk-danger border-2 border-suk-danger-line hover:bg-suk-danger-soft",
        /** İptal / ikincil nötr — `default` ile aynı palet, daha belirgin dolgu */
        muted:
          "bg-muted text-foreground border-border border-2 border-b-4 active:border-b-2 hover:bg-muted/85",
        /** Çerçeveli nötr (gri aile) */
        outline:
          "bg-background text-foreground border-border border-2 border-b-4 active:border-b-2 hover:bg-muted",
        /** Ödeme / kredi / checkout */
        payment:
          "bg-suk-payment text-suk-payment-fg hover:bg-suk-payment-hover border-suk-payment-border border-b-4 active:border-b-0",
        paymentOutline:
          "bg-suk-surface-card text-suk-payment-soft-fg border-2 border-suk-payment-ring border-b-4 border-b-suk-payment-border hover:bg-suk-payment-soft active:border-b-2",
        super:
          "bg-suk-play text-suk-play-fg hover:bg-suk-play-hover border-suk-play-border border-b-4 active:border-b-0",
        superOutline:
          "bg-suk-surface-card text-suk-play border-2 border-suk-play-line hover:bg-suk-play-soft",
        ghost:
          "bg-transparent text-suk-fg-muted border-transparent border-0 hover:bg-suk-surface-muted",
        sidebar:
          "bg-transparent text-suk-fg-muted border-2 border-transparent hover:bg-suk-surface-muted transition-none",
        sidebarOutline:
          "bg-suk-brand/15 text-suk-brand-border border-suk-brand/30 border-2 hover:bg-suk-brand/25 transition-none",
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
