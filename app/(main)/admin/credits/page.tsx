"use client";

/**
 * Admin → Kredi Yönetimi
 *
 * Kullanıcıyı isim veya e-postaya göre arar, sonuç listesinden seçilen
 * kullanıcıya pozitif (verme) veya negatif (geri alma) kredi ataması
 * yapılır. Tüm işlemler `credit_adjustments` defterine ve `admin_audit`
 * tablosuna yazılır.
 *
 * Güvenlik akışı sunucu tarafında (`/api/admin/credits`):
 *  - isAdmin + same-origin + CSRF + rate-limit
 *  - Atomik transaction; bakiye negatife düşemez
 *  - Adli iz (`admin_audit`) ve defter (`credit_adjustments`) tek
 *    transaction'a yazılır
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Loader2,
  Search,
  Plus,
  Minus,
  History,
  Mail,
  User as UserIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { csrfHeader, mintCsrfToken } from "@/lib/mint-csrf-client";
import { clientLogger } from "@/lib/client-logger";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
};

type AdjustmentRow = {
  id: number;
  delta: number;
  reason: string;
  balanceAfter: number;
  adminEmail: string | null;
  adminId: string;
  createdAt: string;
};

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_DELTA = 1000;

export default function AdminCreditsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [history, setHistory] = useState<AdjustmentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [delta, setDelta] = useState<string>("");
  const [reason, setReason] = useState("");
  const [granting, setGranting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Debounce arama girdisi → API çağrısı.
  useEffect(() => {
    const t = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchResults = useCallback(async () => {
    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/credits?q=${encodeURIComponent(searchQuery)}`,
        { signal: ctrl.signal, credentials: "include" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        users?: UserRow[];
        error?: string;
      };
      if (ctrl.signal.aborted) return;
      if (!res.ok) {
        toast.error(data.error ?? "Arama başarısız");
        setResults([]);
        return;
      }
      setResults(data.users ?? []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Arama başarısız");
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchResults();
    return () => abortRef.current?.abort();
  }, [fetchResults]);

  const fetchHistory = useCallback(async (userId: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/admin/credits/${encodeURIComponent(userId)}/history`,
        { credentials: "include" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        history?: AdjustmentRow[];
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Geçmiş yüklenemedi");
        setHistory([]);
        return;
      }
      setHistory(data.history ?? []);
    } catch (err) {
      clientLogger.warn("admin credits history failed", {
        location: "admin/credits/fetchHistory",
        error:
          err instanceof Error
            ? { name: err.name, message: err.message }
            : { raw: String(err) },
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleSelect = useCallback(
    (user: UserRow) => {
      setSelected(user);
      setDelta("");
      setReason("");
      fetchHistory(user.id);
    },
    [fetchHistory],
  );

  const parsedDelta = useMemo(() => {
    const n = Number(delta);
    return Number.isInteger(n) ? n : NaN;
  }, [delta]);

  const canSubmit =
    selected !== null &&
    Number.isInteger(parsedDelta) &&
    parsedDelta !== 0 &&
    Math.abs(parsedDelta) <= MAX_DELTA &&
    reason.trim().length >= 3;

  const handleGrant = useCallback(
    async (sign: 1 | -1) => {
      if (!selected) return;
      const magnitude = Math.abs(Number(delta) || 0);
      if (
        !Number.isInteger(magnitude) ||
        magnitude === 0 ||
        magnitude > MAX_DELTA
      ) {
        toast.error(`Miktar 1–${MAX_DELTA} arasında bir tamsayı olmalı.`);
        return;
      }
      if (reason.trim().length < 3) {
        toast.error("Sebep en az 3 karakter olmalı.");
        return;
      }

      setGranting(true);
      try {
        const token = await mintCsrfToken();
        if (!token) {
          toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyin.");
          return;
        }
        const finalDelta = sign * magnitude;
        const res = await fetch("/api/admin/credits", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeader(token),
          },
          body: JSON.stringify({
            userId: selected.id,
            delta: finalDelta,
            reason: reason.trim(),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          newAvailable?: number;
          previousAvailable?: number;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "İşlem başarısız");
          return;
        }
        toast.success(
          `${selected.name ?? selected.email ?? "Kullanıcı"} → ${finalDelta > 0 ? "+" : ""}${finalDelta} kredi (yeni bakiye: ${data.newAvailable})`,
        );
        setDelta("");
        setReason("");
        const updated: UserRow = {
          ...selected,
          totalCredits: selected.totalCredits + (finalDelta > 0 ? finalDelta : 0),
          availableCredits: data.newAvailable ?? selected.availableCredits,
        };
        setSelected(updated);
        setResults((prev) =>
          prev.map((u) => (u.id === selected.id ? updated : u)),
        );
        fetchHistory(selected.id);
      } catch (err) {
        clientLogger.error({
          message: "admin credits grant failed",
          error: err,
          location: "admin/credits/handleGrant",
        });
        toast.error("İşlem başarısız: bağlantı hatası");
      } finally {
        setGranting(false);
      }
    },
    [selected, delta, reason, fetchHistory],
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-foreground" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Kredi Yönetimi
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Kullanıcıyı ad veya e-postayla arayın, kullanılabilir bakiyesini
        görün ve manuel olarak kredi atayın veya geri alın. Tüm hareketler
        denetim defterine yazılır.
      </p>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          autoFocus
          placeholder="İsim veya e-posta ara (en az 2 karakter)..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Aranıyor…
        </div>
      )}

      {!loading && searchQuery.length >= MIN_QUERY_LENGTH && results.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-sm text-muted-foreground">
              Eşleşen kullanıcı bulunamadı.
            </p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <Card
              key={user.id}
              className={`cursor-pointer transition-shadow ${
                selected?.id === user.id
                  ? "ring-2 ring-lime-500 shadow"
                  : "hover:shadow"
              }`}
              onClick={() => handleSelect(user)}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {user.name || "İsimsiz"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email ?? "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    Kullanılabilir: {user.availableCredits}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    Toplam: {user.totalCredits}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    Kullanılan: {user.usedCredits}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Card className="border-lime-200 bg-lime-50/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Seçili kullanıcı
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {selected.name ?? "İsimsiz"}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {selected.email ?? "—"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">id: {selected.id}</p>
              </div>
              <Badge className="bg-lime-600 text-white">
                Bakiye: {selected.availableCredits}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Miktar (1–{MAX_DELTA})
                </label>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="number"
                  min={1}
                  max={MAX_DELTA}
                  placeholder="örn. 10"
                  value={delta}
                  onChange={(e) =>
                    setDelta(e.target.value.replace(/[^0-9-]/g, ""))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Sebep (3–200 karakter)
                </label>
                <Textarea
                  placeholder="örn. Hatalı satın alma iadesi, hoş geldin hediyesi…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleGrant(1)}
                disabled={!canSubmit || granting}
                variant="primaryOutline"
                size="sm"
              >
                {granting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                Kredi Ekle
              </Button>
              <Button
                onClick={() => handleGrant(-1)}
                disabled={!canSubmit || granting}
                variant="danger"
                size="sm"
              >
                {granting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Minus className="h-4 w-4 mr-1.5" />
                )}
                Kredi Düşür
              </Button>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Son ayarlamalar
                </h2>
              </div>
              {historyLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Yükleniyor…
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Bu kullanıcı için henüz manuel ayarlama yok.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="rounded-lg border bg-card p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={
                            h.delta >= 0
                              ? "font-semibold text-lime-700"
                              : "font-semibold text-red-700"
                          }
                        >
                          {h.delta > 0 ? "+" : ""}
                          {h.delta} kredi
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {h.reason} · Bakiye sonrası: {h.balanceAfter}
                      </p>
                      {h.adminEmail && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Yapan: {h.adminEmail}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
