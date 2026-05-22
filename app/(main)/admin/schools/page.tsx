"use client";

/**
 * Admin → Okul Yönetimi
 *
 * Eksik okulları tek tek manuel olarak `schools` tablosuna ekler. Eklendiği
 * an `revalidateTag(CACHE_TAGS.schoolsMaster)` ile şehir/ilçe/kategori
 * aggregate cache'i bust edilir; yeni okul:
 *   - Onboarding okul seçim akışında sonraki istekte görünür.
 *   - Public okul listesi `/api/schools?action=schools` cevabı browser/CDN'de
 *     en fazla 120 s cache'li olduğu için en geç 2 dakikada görünür.
 *
 * UX tasarım kararları:
 *   - "Önce var mı?" paneli: ad yazıldıkça debounce'lu olarak `/api/admin/schools`
 *     GET'ine vurur ve olası eşleşmeleri yan panelde gösterir; admin'i
 *     yazım varyantlarına karşı uyarır.
 *   - İl/ilçe için `<datalist>` tabanlı combobox: serbest yazıma izin
 *     verilir (yeni bir il/ilçe için), ama mevcut listeden seçim önerilir;
 *     server tarafı zaten `normalizeDistrictName` ile yazım birleştirmesi
 *     yapar (BAGCILAR → BAĞCILAR vb.) yani admin yanlışlıkla yeni varyant
 *     üretmez.
 *   - "Bu oturumda eklenenler" listesi: form sonrası kaybolan yeni satırın
 *     "duplicate'ime sebep miyim?" hissini kesmek için ekranda kalır.
 *
 * Güvenlik:
 *   - Layout zaten admin gate yapıyor; sayfa salt UI.
 *   - POST tarafında server-side same-origin + CSRF + rate-limit (auth) +
 *     audit log. Bkz. `app/api/admin/schools/route.ts`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { csrfHeader, mintCsrfToken } from "@/lib/mint-csrf-client";
import { clientLogger } from "@/lib/client-logger";

type SchoolTypeValue =
  | "university"
  | "high_school"
  | "secondary_school"
  | "elementary_school";

type SchoolRow = {
  id: number;
  name: string;
  city: string;
  district: string;
  category: string;
  kind: string | null;
  type: SchoolTypeValue;
};

type CityAggregate = { city: string; count: number };
type DistrictAggregate = { district: string; count: number };

const TYPE_OPTIONS: {
  value: SchoolTypeValue;
  label: string;
  hint: string;
}[] = [
  {
    value: "elementary_school",
    label: "İlkokul",
    hint: "1–4. sınıf (Primary School)",
  },
  {
    value: "secondary_school",
    label: "Ortaokul",
    hint: "5–8. sınıf (Secondary School)",
  },
  {
    value: "high_school",
    label: "Lise",
    hint: "9–12. sınıf (High School) — alt tür: Anadolu / İmam Hatip / Fen…",
  },
  {
    value: "university",
    label: "Üniversite",
    hint: "İlçe alanı otomatik 'Kampüs' olarak kaydedilir",
  },
];

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
const MAX_NAME = 200;
const MAX_KIND = 100;

export default function AdminSchoolsPage() {
  // ─── Form state ─────────────────────────────────────────────────────────
  const [schoolType, setSchoolType] =
    useState<SchoolTypeValue>("high_school");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [kind, setKind] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Cities / districts (catalog from public schools endpoint) ──────────
  const [cities, setCities] = useState<CityAggregate[]>([]);
  const [districts, setDistricts] = useState<DistrictAggregate[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // ─── Duplicate-check panel ──────────────────────────────────────────────
  const [duplicateMatches, setDuplicateMatches] = useState<SchoolRow[]>([]);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const duplicateAbortRef = useRef<AbortController | null>(null);

  // ─── Recent additions (this session) ────────────────────────────────────
  const [recent, setRecent] = useState<SchoolRow[]>([]);

  // ─── Load city catalog on mount ─────────────────────────────────────────
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/schools?action=cities", {
          credentials: "include",
        });
        const data = (await res.json().catch(() => ({}))) as {
          cities?: CityAggregate[];
          error?: string;
        };
        if (aborted) return;
        if (!res.ok) {
          toast.error(data.error ?? "Şehir listesi yüklenemedi.");
          return;
        }
        setCities(data.cities ?? []);
      } catch (err) {
        clientLogger.warn("admin schools: cities fetch failed", {
          location: "admin/schools/loadCities",
          error:
            err instanceof Error
              ? { name: err.name, message: err.message }
              : { raw: String(err) },
        });
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  // ─── Load districts when city changes (skip for university) ─────────────
  useEffect(() => {
    setDistricts([]);
    if (!city.trim() || schoolType === "university") return;
    const ctrl = new AbortController();
    setLoadingDistricts(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/schools?action=districts&city=${encodeURIComponent(city.trim())}`,
          { credentials: "include", signal: ctrl.signal },
        );
        const data = (await res.json().catch(() => ({}))) as {
          districts?: DistrictAggregate[];
          error?: string;
        };
        if (ctrl.signal.aborted) return;
        if (res.ok) setDistricts(data.districts ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          clientLogger.warn("admin schools: districts fetch failed", {
            location: "admin/schools/loadDistricts",
            error:
              err instanceof Error
                ? { name: err.name, message: err.message }
                : { raw: String(err) },
          });
        }
      } finally {
        if (!ctrl.signal.aborted) setLoadingDistricts(false);
      }
    })();
    return () => ctrl.abort();
  }, [city, schoolType]);

  // ─── Auto-fill 'Kampüs' for universities; clear when leaving university ─
  useEffect(() => {
    if (schoolType === "university") {
      setDistrict("Kampüs");
    } else if (district === "Kampüs") {
      setDistrict("");
    }
    // Bilinçli: `district` dependency listesinden hariç — kullanıcı "Kampüs"ü
    // üniversite dışı bir tipte el ile yazsın istemiyoruz, ama her seferinde
    // tip değişikliğinde resetlemek istiyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolType]);

  // ─── Duplicate-check (debounced) ────────────────────────────────────────
  useEffect(() => {
    duplicateAbortRef.current?.abort();
    const trimmed = name.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setDuplicateMatches([]);
      return;
    }
    const timer = setTimeout(async () => {
      const ctrl = new AbortController();
      duplicateAbortRef.current = ctrl;
      setDuplicateLoading(true);
      try {
        const url = new URL(
          "/api/admin/schools",
          window.location.origin,
        );
        url.searchParams.set("q", trimmed);
        if (city.trim()) url.searchParams.set("city", city.trim());
        const res = await fetch(url.toString(), {
          credentials: "include",
          signal: ctrl.signal,
        });
        const data = (await res.json().catch(() => ({}))) as {
          schools?: SchoolRow[];
          error?: string;
        };
        if (ctrl.signal.aborted) return;
        if (!res.ok) {
          setDuplicateMatches([]);
          return;
        }
        setDuplicateMatches(data.schools ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setDuplicateMatches([]);
        }
      } finally {
        if (!ctrl.signal.aborted) setDuplicateLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [name, city]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (name.trim().length < 3) return false;
    if (!city.trim()) return false;
    if (!district.trim()) return false;
    return true;
  }, [submitting, name, city, district]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!canSubmit) return;

      setSubmitting(true);
      try {
        const token = await mintCsrfToken();
        if (!token) {
          toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyin.");
          return;
        }

        const res = await fetch("/api/admin/schools", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeader(token),
          },
          body: JSON.stringify({
            name: name.trim(),
            city: city.trim(),
            district: district.trim(),
            type: schoolType,
            kind: kind.trim() || null,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          school?: SchoolRow;
          existing?: SchoolRow;
          error?: string;
        };

        if (res.status === 409 && data.existing) {
          toast.error(
            `Bu okul zaten kayıtlı: "${data.existing.name}" (${data.existing.city}, ${data.existing.district})`,
          );
          setDuplicateMatches([data.existing]);
          return;
        }

        if (!res.ok || !data.ok || !data.school) {
          toast.error(data.error ?? "Okul eklenemedi.");
          return;
        }

        const created = data.school;
        toast.success(
          `Eklendi: ${created.name} · ${created.city} / ${created.district}`,
        );
        setRecent((prev) => [created, ...prev].slice(0, 20));
        setName("");
        setKind("");
        setDuplicateMatches([]);
      } catch (err) {
        clientLogger.error({
          message: "admin school create failed",
          error: err,
          location: "admin/schools/handleSubmit",
        });
        toast.error("Okul eklenemedi: bağlantı hatası.");
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, name, city, district, schoolType, kind],
  );

  const showKindField = schoolType === "high_school";
  const districtDisabled = schoolType === "university";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-foreground" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Okul Yönetimi
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Listede eksik bir okul olduğunda buradan ekleyebilirsiniz. Eklenen
        okul, onboarding ve profil sayfalarındaki okul seçimlerinde anında
        görünür hale gelir. Aynı il/ilçe/tip altında aynı isimde başka bir
        okul varsa kayıt reddedilir.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ──────────── Form ──────────── */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Okul tipi</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const active = schoolType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSchoolType(opt.value)}
                        className={
                          "rounded-lg border px-3 py-2 text-left text-sm transition " +
                          (active
                            ? "border-lime-500 bg-lime-50 text-lime-900 shadow-sm"
                            : "border-input bg-card text-foreground hover:border-lime-300")
                        }
                        aria-pressed={active}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                          {opt.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="school-name" className="text-sm font-semibold">
                  Okul adı
                </Label>
                <Input
                  id="school-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME}
                  placeholder="örn. Ataköy Anadolu Lisesi"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Yazdıkça benzer kayıtlar sağdaki panelde gösterilir.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="school-city" className="text-sm font-semibold">
                    İl
                  </Label>
                  <Input
                    id="school-city"
                    list="schools-cities-list"
                    value={city}
                    onChange={(e) =>
                      setCity(
                        e.target.value.toLocaleUpperCase("tr-TR"),
                      )
                    }
                    placeholder="örn. İSTANBUL"
                    autoComplete="off"
                  />
                  <datalist id="schools-cities-list">
                    {cities.map((c) => (
                      <option key={c.city} value={c.city}>
                        {c.count.toLocaleString("tr-TR")} okul
                      </option>
                    ))}
                  </datalist>
                  <p className="text-[11px] text-muted-foreground">
                    Listeden seçin veya yeni bir il yazın (BÜYÜK harfle).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="school-district"
                    className="text-sm font-semibold"
                  >
                    İlçe
                  </Label>
                  <Input
                    id="school-district"
                    list="schools-districts-list"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder={
                      districtDisabled
                        ? "Kampüs (üniversite için otomatik)"
                        : "örn. BAKIRKÖY"
                    }
                    disabled={districtDisabled}
                    autoComplete="off"
                  />
                  <datalist id="schools-districts-list">
                    {districts.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.count.toLocaleString("tr-TR")} okul
                      </option>
                    ))}
                  </datalist>
                  <p className="text-[11px] text-muted-foreground">
                    {districtDisabled
                      ? "Üniversitelerde ilçe yerine 'Kampüs' tutulur."
                      : loadingDistricts
                        ? "İlçe listesi yükleniyor…"
                        : "Listeden seçin veya yeni bir ilçe yazın."}
                  </p>
                </div>
              </div>

              {showKindField && (
                <div className="space-y-1.5">
                  <Label htmlFor="school-kind" className="text-sm font-semibold">
                    Alt tür (opsiyonel)
                  </Label>
                  <Select
                    id="school-kind"
                    value={kind}
                    onValueChange={setKind}
                    aria-label="Lise alt türü"
                  >
                    <option value="">— Seçilmedi —</option>
                    <option value="Anadolu Lisesi">Anadolu Lisesi</option>
                    <option value="Fen Lisesi">Fen Lisesi</option>
                    <option value="Sosyal Bilimler Lisesi">
                      Sosyal Bilimler Lisesi
                    </option>
                    <option value="İmam Hatip Lisesi">İmam Hatip Lisesi</option>
                    <option value="Mesleki ve Teknik Anadolu Lisesi">
                      Mesleki ve Teknik Anadolu Lisesi
                    </option>
                    <option value="Güzel Sanatlar Lisesi">
                      Güzel Sanatlar Lisesi
                    </option>
                    <option value="Spor Lisesi">Spor Lisesi</option>
                    <option value="Özel Lise">Özel Lise</option>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Yalnızca lise için anlamlı. Boş bırakılırsa kayıt
                    yapılır; bu alan görüntüleme amaçlıdır.
                  </p>
                  {kind && kind.length > MAX_KIND && (
                    <p className="text-xs text-red-600">
                      Alt tür en fazla {MAX_KIND} karakter olabilir.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  variant="primary"
                  size="sm"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1.5" />
                  )}
                  Okulu Ekle
                </Button>
                {!canSubmit && !submitting && (
                  <span className="text-xs text-muted-foreground">
                    Ad, il ve ilçe zorunludur.
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ──────────── Duplicate-check panel ──────────── */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Benzer kayıtlar
              </h2>
              {duplicateLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            {name.trim().length < MIN_SEARCH_LENGTH ? (
              <p className="text-xs text-muted-foreground">
                Okul adı yazıldıkça benzer kayıtlar burada listelenir; aynı
                okulu iki kez eklemekten kaçınmak için göz atın.
              </p>
            ) : duplicateMatches.length === 0 && !duplicateLoading ? (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-lime-600" />
                Benzer kayıt bulunamadı.
              </p>
            ) : (
              <ul className="space-y-2">
                {duplicateMatches.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border bg-card p-3 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold text-foreground truncate">
                          {s.name}
                        </p>
                        <p className="text-muted-foreground">
                          {s.city} · {s.district} · {humanCategory(s.type)}
                          {s.kind ? ` · ${s.kind}` : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ──────────── Recent (this session) ──────────── */}
      {recent.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-lime-600" />
              <h2 className="text-sm font-semibold text-foreground">
                Bu oturumda eklenenler
              </h2>
              <Badge variant="secondary" className="font-normal">
                {recent.length}
              </Badge>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recent.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-lime-200 bg-lime-50/50 p-3 text-xs"
                >
                  <p className="font-semibold text-foreground truncate">
                    {s.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {s.city} · {s.district} · {humanCategory(s.type)}
                    {s.kind ? ` · ${s.kind}` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    id: {s.id}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              Eklenen okullar onboarding seçimlerinde anında, public okul
              listesi cevabı CDN&apos;de cache&apos;lendiği için en geç birkaç
              dakika içinde görünür.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function humanCategory(type: SchoolTypeValue): string {
  switch (type) {
    case "elementary_school":
      return "İlkokul";
    case "secondary_school":
      return "Ortaokul";
    case "high_school":
      return "Lise";
    case "university":
      return "Üniversite";
  }
}
