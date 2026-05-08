"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

const authFieldClass =
  "w-full min-w-0 rounded-xl border border-border bg-background py-3 pl-3 pr-11 text-sm transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60";

export type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Auth formlarında şifre görünürlüğü (göz ikonu). Erişilebilirlik: `aria-label`,
 * `aria-pressed`; tıklamada odak alanda kalması için `mousedown` önlenir.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative w-full min-w-0">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(authFieldClass, className)}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          tabIndex={0}
          className={cn(
            "absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled && "pointer-events-none opacity-50",
          )}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <Eye className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
