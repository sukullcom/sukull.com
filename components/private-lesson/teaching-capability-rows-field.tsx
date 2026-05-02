"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import { TEACHING_GRADES, TEACHING_SUBJECTS } from "@/lib/teaching-offerings";
import { Plus, Trash2 } from "lucide-react";

export type CapabilityRow = { subject: string; grade: string };

type Props = {
  value: CapabilityRow[];
  onChange: (rows: CapabilityRow[]) => void;
};

/**
 * Eğitmen başvurusunda birden fazla ders + sınıf çifti seçimi.
 */
export function TeachingCapabilityRowsField({ value, onChange }: Props) {
  const addRow = () => {
    onChange([...value, { subject: "", grade: "" }]);
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, patch: Partial<CapabilityRow>) => {
    onChange(
      value.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-base font-medium">
          Verdiğin dersler ve sınıflar <span className="text-destructive">*</span>
        </Label>
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" />
          Satır ekle
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Birden fazla branş veya sınıf ekleyebilirsin; her satır bir ders + sınıf
        çiftidir. Onay sonrası ilanlar bu alanlarla eşleştirilir.
      </p>

      <div className="space-y-2">
        {value.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
          >
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Ders / alan</span>
              <Select
                value={row.subject}
                onValueChange={(v) => updateRow(index, { subject: v })}
              >
                <SelectValue placeholder="Seç" />
                {TEACHING_SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Sınıf / seviye</span>
              <Select
                value={row.grade}
                onValueChange={(v) => updateRow(index, { grade: v })}
              >
                <SelectValue placeholder="Seç" />
                {TEACHING_GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => removeRow(index)}
              disabled={value.length <= 1}
              aria-label="Satırı sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
