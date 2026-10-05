"use client";

import type { ContactChannel } from "@/lib/private-lesson-contact-channel";

const OPTIONS: { value: ContactChannel; label: string }[] = [
  { value: "phone", label: "Telefon" },
  { value: "email", label: "E-posta" },
];

export function ContactChannelField({
  value,
  onChange,
  disabled,
  name = "contactChannel",
}: {
  value: ContactChannel | "";
  onChange: (next: ContactChannel) => void;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-1.5">
      <legend className="block text-xs font-medium text-muted-foreground mb-1">
        İletişim için hangisini tercih ediyorsun? *
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 text-sm transition-colors ${
                selected
                  ? "border-suk-brand bg-suk-brand-soft text-suk-brand-border font-medium"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Telefon seçersen cep numaran zorunlu. E-posta seçersen hesabındaki
        adres kullanılır; telefon girmen gerekmez.
      </p>
    </fieldset>
  );
}
