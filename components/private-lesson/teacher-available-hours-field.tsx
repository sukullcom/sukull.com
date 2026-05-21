"use client";

import { Calendar, Info } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  TEACHER_AVAILABLE_HOURS_FLEXIBLE,
  TEACHER_AVAILABLE_HOURS_HELPER,
  allTeacherAvailableHourOptions,
  joinTeacherAvailableHours,
  parseTeacherAvailableHours,
} from "@/lib/teacher-available-hours";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
};

/**
 * Eğitmen müsaitlik — çoklu seçim; DB'ye virgülle ayrılmış metin olarak yazılır.
 */
export function TeacherAvailableHoursField({
  value,
  onChange,
  id = "availableHours",
  className,
}: Props) {
  const selected = new Set(parseTeacherAvailableHours(value));
  const options = allTeacherAvailableHourOptions();

  const toggle = (option: string) => {
    const next = new Set(selected);
    const isFlexible = option === TEACHER_AVAILABLE_HOURS_FLEXIBLE;

    if (next.has(option)) {
      next.delete(option);
    } else if (isFlexible) {
      onChange(TEACHER_AVAILABLE_HOURS_FLEXIBLE);
      return;
    } else {
      next.delete(TEACHER_AVAILABLE_HOURS_FLEXIBLE);
      next.add(option);
    }
    onChange(joinTeacherAvailableHours(next));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label htmlFor={id} className="flex items-center gap-2">
        <Calendar className="h-4 w-4" aria-hidden />
        Ders verebileceğin saatler
      </Label>
      <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
        {TEACHER_AVAILABLE_HOURS_HELPER}
      </p>
      <div
        role="group"
        aria-labelledby={id}
        aria-describedby={`${id}-hint`}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((option) => {
          const checked = selected.has(option);
          const isLegacy =
            option.includes("(12:00-17:00)") ||
            option === "Hafta sonu" ||
            option === "Esnek / Farketmez";
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-sm transition-colors",
                "hover:border-suk-brand/40 hover:bg-suk-brand-soft/30",
                checked && "border-suk-brand/50 bg-suk-brand-soft/50",
                isLegacy && !checked && "opacity-70",
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-suk-brand"
                checked={checked}
                onChange={() => toggle(option)}
              />
              <span className="leading-snug text-foreground">{option}</span>
            </label>
          );
        })}
      </div>
      {selected.size > 0 ? (
        <p className="text-xs text-muted-foreground">
          Seçilen: <span className="font-medium text-foreground">{value}</span>
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-lg border border-suk-brand/20 bg-suk-brand-soft/40 px-3 py-2 text-xs text-suk-brand-soft-fg">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-suk-brand" aria-hidden />
          Henüz seçim yapılmadı — en az bir aralık veya «Esnek» işaretlemen önerilir.
        </p>
      )}
    </div>
  );
}
