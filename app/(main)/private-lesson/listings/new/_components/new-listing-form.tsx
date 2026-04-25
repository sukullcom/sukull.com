"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";

/**
 * Create-listing form. Kept intentionally opinionated:
 *   - `subject` is a free-text field so students aren't boxed into a
 *     static dropdown we'd have to curate per curriculum year.
 *   - `lessonMode` is capped to a known enum so queries can filter on
 *     it cleanly.
 *   - `budgetMin`/`budgetMax` are both optional and validated
 *     client-side; server re-validates.
 */
export function NewListingForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonMode, setLessonMode] = useState<"online" | "in_person" | "both">(
    "online",
  );
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [preferredHours, setPreferredHours] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const canSubmit =
    subject.trim().length > 0 &&
    title.trim().length > 0 &&
    description.trim().length >= 10 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const bMin = budgetMin ? Number(budgetMin) : null;
    const bMax = budgetMax ? Number(budgetMax) : null;
    if (bMin != null && bMax != null && bMin > bMax) {
      toast.error("Minimum bütçe maksimum bütçeden büyük olamaz");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/private-lesson/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          grade: grade.trim() || null,
          title: title.trim(),
          description: description.trim(),
          lessonMode,
          city: city.trim() || null,
          district: district.trim() || null,
          budgetMin: bMin,
          budgetMax: bMax,
          preferredHours: preferredHours.trim() || null,
          contactPhone: contactPhone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "İlan oluşturulamadı");
        return;
      }
      toast.success("İlan oluşturuldu!");
      router.push(`/private-lesson/listings/${data.listing.id}`);
    } catch (error) {
      clientLogger.error({
        message: "create listing failed",
        error,
        location: "NewListingForm/handleSubmit",
      });
      toast.error("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border rounded-xl p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Konu *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={80}
            placeholder="Örn. Matematik, İngilizce, Fizik"
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Sınıf / Seviye
          </label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            maxLength={40}
            placeholder="Örn. 10. sınıf, YKS, Üniversite"
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          İlan Başlığı *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Kısa ve öz bir başlık"
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
        />
        <div className="text-[10px] text-gray-400 mt-1 text-right">
          {title.length}/120
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Açıklama *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="Neyi öğrenmek istiyorsun? Hangi konularda zorlanıyorsun? Öğretmenden beklentilerin neler?"
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 resize-none"
        />
        <div className="text-[10px] text-gray-400 mt-1 text-right">
          {description.length}/2000
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Ders Tipi *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { v: "online", l: "Online" },
              { v: "in_person", l: "Yüz yüze" },
              { v: "both", l: "Her ikisi" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setLessonMode(opt.v)}
              className={`py-2 text-sm rounded-lg border transition-colors ${
                lessonMode === opt.v
                  ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          İletişim telefonu (teklif veren öğretmenlerle paylaşılır){" "}
          <span className="text-gray-400 font-normal">— isteğe bağlı</span>
        </label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          maxLength={30}
          placeholder="Örn. 05xx xxx xx xx"
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Doldurursan profilinde de güncellenir. Teklif atan öğretmen ve açık
          sohbet ekranında gösterilir.
        </p>
      </div>

      {(lessonMode === "in_person" || lessonMode === "both") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Şehir
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={60}
              placeholder="Örn. İstanbul"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              İlçe / Semt
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              maxLength={60}
              placeholder="Örn. Kadıköy"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Saatlik Bütçe Min (₺)
          </label>
          <input
            type="number"
            min={0}
            max={100000}
            step={10}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Saatlik Bütçe Max (₺)
          </label>
          <input
            type="number"
            min={0}
            max={100000}
            step={10}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Tercih Edilen Saatler
        </label>
        <input
          type="text"
          value={preferredHours}
          onChange={(e) => setPreferredHours(e.target.value)}
          maxLength={160}
          placeholder="Örn. Hafta içi akşam 19:00 sonrası"
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
        />
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        variant="primary"
        size="lg"
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Oluşturuluyor...
          </>
        ) : (
          "İlanı Yayınla"
        )}
      </Button>
    </form>
  );
}
