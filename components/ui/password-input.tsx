"use client";

import * as React from "react";

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
            <EyeOffIcon />
          ) : (
            <EyeIcon />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-3.2 4.2" />
      <path d="M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.1-.8" />
    </svg>
  );
}
