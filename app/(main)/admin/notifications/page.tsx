"use client";

/**
 * Admin → Bildirim Tanısı
 *
 * "İlk mesaj e-postası neden gelmedi?" sorusunu birkaç saniyede yanıtlamak
 * için tek panel:
 *  1. Resend env'leri (var/yok)
 *  2. `chat_first_message_notifications` tablosu var mı, kaç satır
 *  3. Son N bildirim claim'i + alıcı e-postası dolu mu
 *  4. Son N hata kaydı (location = first-message-email/*)
 *  5. Test e-postası gönderme butonu
 *
 * Sayfa sadece okuma yapar; "Test gönder" butonu CSRF + rate-limit altında.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Database,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { csrfHeader, mintCsrfToken } from "@/lib/mint-csrf-client";
import { clientLogger } from "@/lib/client-logger";

type NotificationRecent = {
  chatId: number;
  senderId: string;
  recipientId: string;
  recipientEmail: string | null;
  recipientName: string | null;
  context: string;
  notifiedAt: string;
};

type ErrorRecent = {
  id: number;
  createdAt: string;
  level: string;
  source: string;
  location: string | null;
  message: string;
};

type Diagnostics = {
  provider: "smtp" | "resend" | "none";
  smtp: {
    configured: boolean;
    hasHost: boolean;
    hasPort: boolean;
    hasUser: boolean;
    hasPass: boolean;
    hasFrom: boolean;
    host: string | null;
    port: string | null;
    from: string | null;
  };
  resend: {
    configured: boolean;
    hasApiKey: boolean;
    hasFrom: boolean;
    from: string | null;
  };
  notificationsTable: {
    exists: boolean;
    total: number;
    recent: NotificationRecent[];
  };
  recentErrors: ErrorRecent[];
};

export default function AdminNotificationsPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/diagnostics", {
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as Diagnostics & {
        error?: string;
      };
      if (!res.ok) {
        toast.error(json.error ?? "Tanı bilgisi alınamadı");
        return;
      }
      setData(json);
    } catch (err) {
      clientLogger.error({
        message: "diagnostics fetch failed",
        error: err,
        location: "admin/notifications/fetchData",
      });
      toast.error("Tanı bilgisi alınamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendTestEmail = useCallback(async () => {
    setSending(true);
    try {
      const token = await mintCsrfToken();
      if (!token) {
        toast.error("Güvenlik doğrulaması başarısız. Sayfayı yenileyin.");
        return;
      }
      const res = await fetch("/api/admin/notifications/diagnostics", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeader(token),
        },
        body: JSON.stringify({
          mode: "test-email",
          to: testTo.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        to?: string;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Test e-postası gönderilemedi");
        return;
      }
      toast.success(
        `Test e-postası gönderildi: ${json.to}. 1-2 dakika içinde gelmezse spam klasörüne bakın.`,
      );
    } catch (err) {
      clientLogger.error({
        message: "test email send failed",
        error: err,
        location: "admin/notifications/sendTestEmail",
      });
      toast.error("Test e-postası gönderilemedi");
    } finally {
      setSending(false);
    }
  }, [testTo]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Bildirim Tanısı
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          Yenile
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        &ldquo;İlk mesaj e-postası neden gelmedi?&rdquo; sorusuna hızlı yanıt
        için tek sayfa. Aşağıdaki tüm panel sadece bu özelliğin sağlığını
        gösterir.
      </p>

      {loading && !data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      )}

      {data && (
        <>
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-foreground" />
                  <h2 className="font-semibold">E-posta sağlayıcısı</h2>
                </div>
                <Badge
                  className={
                    data.provider === "smtp"
                      ? "bg-green-100 text-green-800"
                      : data.provider === "resend"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  Aktif:{" "}
                  {data.provider === "smtp"
                    ? "SMTP (Nodemailer)"
                    : data.provider === "resend"
                      ? "Resend HTTP API"
                      : "Yapılandırılmamış"}
                </Badge>
              </div>

              {data.provider === "none" && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  Hiçbir e-posta sağlayıcısı yapılandırılmamış. Aşağıdaki SMTP
                  veya Resend env değişkenlerinden birini ayarlayın ve
                  redeploy edin.
                </p>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  SMTP (Nodemailer) — birincil
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <ConfigBadge
                    ok={data.smtp.hasHost}
                    okLabel={`SMTP_HOST: ${data.smtp.host ?? "?"}`}
                    failLabel="SMTP_HOST: yok"
                  />
                  <ConfigBadge
                    ok={data.smtp.hasPort}
                    okLabel={`SMTP_PORT: ${data.smtp.port ?? "?"}`}
                    failLabel="SMTP_PORT: yok"
                  />
                  <ConfigBadge
                    ok={data.smtp.hasUser}
                    okLabel="SMTP_USER: var"
                    failLabel="SMTP_USER: yok"
                  />
                  <ConfigBadge
                    ok={data.smtp.hasPass}
                    okLabel="SMTP_PASS: var"
                    failLabel="SMTP_PASS: yok"
                  />
                  <ConfigBadge
                    ok={data.smtp.hasFrom}
                    okLabel={`SMTP_FROM: ${data.smtp.from ?? "?"}`}
                    failLabel="SMTP_FROM: yok"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Resend HTTP API — yedek (SMTP yoksa devreye girer)
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <ConfigBadge
                    ok={data.resend.hasApiKey}
                    okLabel="RESEND_API_KEY: var"
                    failLabel="RESEND_API_KEY: yok"
                  />
                  <ConfigBadge
                    ok={data.resend.hasFrom}
                    okLabel={`RESEND_FROM: ${data.resend.from ?? "?"}`}
                    failLabel="RESEND_FROM: yok"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  Test e-postası gönder (boş bırakırsanız adminin auth
                  e-postasına gider). Aktif sağlayıcı: <strong>
                    {data.provider === "smtp"
                      ? "SMTP"
                      : data.provider === "resend"
                        ? "Resend HTTP"
                        : "—"}
                  </strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="ornek@adres.com (opsiyonel)"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    className="sm:max-w-sm"
                  />
                  <Button
                    onClick={sendTestEmail}
                    disabled={sending || data.provider === "none"}
                    size="sm"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-1.5" />
                    )}
                    Test e-postası gönder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-foreground" />
                <h2 className="font-semibold">
                  chat_first_message_notifications tablosu
                </h2>
              </div>
              {!data.notificationsTable.exists ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  Tablo bulunamadı veya okunamadı. <strong>Migration 0050</strong>
                  &nbsp;(<code className="font-mono text-xs">
                    supabase/migrations/0050_chat_first_message_notifications.sql
                  </code>) üretim veritabanına uygulanmamış olabilir.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Toplam bildirim kaydı:{" "}
                    <span className="font-semibold text-foreground">
                      {data.notificationsTable.total}
                    </span>
                  </p>
                  {data.notificationsTable.recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Henüz hiç ilk-mesaj bildirimi tetiklenmemiş.
                    </p>
                  ) : (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="px-2 py-1">chatId</th>
                            <th className="px-2 py-1">Tür</th>
                            <th className="px-2 py-1">Alıcı</th>
                            <th className="px-2 py-1">Alıcı e-postası</th>
                            <th className="px-2 py-1">Tarih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.notificationsTable.recent.map((r) => (
                            <tr key={r.chatId} className="border-t">
                              <td className="px-2 py-1 font-mono text-xs">
                                {r.chatId}
                              </td>
                              <td className="px-2 py-1">
                                <Badge variant="secondary" className="font-normal">
                                  {r.context}
                                </Badge>
                              </td>
                              <td className="px-2 py-1">
                                <div className="font-medium">
                                  {r.recipientName ?? "—"}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {r.recipientId.slice(0, 8)}…
                                </div>
                              </td>
                              <td className="px-2 py-1">
                                {r.recipientEmail ? (
                                  <span className="text-xs">
                                    {r.recipientEmail}
                                  </span>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-800"
                                  >
                                    e-posta yok
                                  </Badge>
                                )}
                              </td>
                              <td className="px-2 py-1 text-xs text-muted-foreground">
                                {new Date(r.notifiedAt).toLocaleString("tr-TR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-foreground" />
                <h2 className="font-semibold">
                  Son ilk-mesaj e-posta hataları (error_log)
                </h2>
              </div>
              {data.recentErrors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Son zamanlarda bildirim hatası yok.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.recentErrors.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-lg border bg-card p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {e.message}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="secondary"
                          className={
                            e.level === "error"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {e.level}
                        </Badge>
                        <span className="font-mono">{e.location ?? "—"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ConfigBadge({
  ok,
  okLabel,
  failLabel,
}: {
  ok: boolean;
  okLabel: string;
  failLabel: string;
}) {
  return (
    <Badge
      className={
        ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }
    >
      {ok ? (
        <CheckCircle className="h-3 w-3 mr-1" />
      ) : (
        <XCircle className="h-3 w-3 mr-1" />
      )}
      {ok ? okLabel : failLabel}
    </Badge>
  );
}
