"use server";

import db from "@/db/drizzle";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

const log = logger.child({ labels: { module: "actions/payment-reconciliation" } });

/**
 * "Orphan" ödeme: Iyzico tarafında başarılı bildirildi (response_data.status =
 * "success") ama uygulama tarafında kredi/abonelik yazımı yapılmadı. Pratikte
 * şu senaryolarda oluşur:
 *
 *   • Server crash / lambda timeout — Iyzico cevabı geldi, settle bloğu
 *     yarıda kesildi.
 *   • DB rollback (statement_timeout, deadlock) — Iyzico para çekti, biz
 *     rollback ettik.
 *   • Iyzico cevap formatı değişimi — `paymentId` farklı bir alana taşındı,
 *     bizim INSERT/UPDATE yanlış kolonu okudu.
 *
 * Kullanıcı parasını ödedi ama hizmeti almadı → finansal sorumluluğumuz +
 * destek tiketleri. Bu fonksiyon orphan'ları tespit eder; **kararı operatör
 * verir** (kredi elle yaz / Iyzico cancel API ile iade / kullanıcıyı ara).
 *
 * Niye otomatik refund yok? Iyzico `payment.cancel` 24 saatten eski işlemleri
 * reddeder, kısmi iade davranışı belirsizdir; otomatik çağrı yanlış kullanıcıya
 * para iadesi gibi geri alınması zor hatalara yol açabilir. Manuel reconcile,
 * destek ekibinin Iyzico portalı + bizim panel ile cross-check yapması daha
 * profesyonel.
 */

export type OrphanPayment = {
  userId: string;
  paymentLogId: number;
  iyzicoPaymentId: string;
  conversationId: string;
  amountTry: number;
  creditsAmount: number | null;
  phase: "credit" | "subscribe" | "unknown";
  loggedStatus: string;
  createdAt: string;
};

/**
 * Son `withinDays` gün içindeki "Iyzico success ama hizmet yok" durumlarını
 * döndürür. Cron tarafından çağrılır; admin paneli aynı query ile listeleyebilir.
 */
export async function detectOrphanPayments(withinDays = 7): Promise<OrphanPayment[]> {
  const result = await db.execute<{
    payment_log_id: number;
    user_id: string;
    iyzico_payment_id: string;
    conversation_id: string;
    amount_try: string;
    credits_amount: number | null;
    phase: string;
    logged_status: string;
    created_at: string;
  }>(sql`
    WITH iyzico_success AS (
      SELECT
        pl.id AS payment_log_id,
        pl.user_id,
        pl.payment_id AS conversation_id,
        -- Iyzico'nun atadığı asıl paymentId, response_data içinde.
        COALESCE(
          (pl.response_data ->> 'paymentId'),
          (pl.response_data ->> 'paymentTransactionId')
        ) AS iyzico_payment_id,
        COALESCE(
          (pl.response_data ->> 'paidPrice'),
          (pl.response_data ->> 'price'),
          (pl.request_data ->> 'paidPrice'),
          (pl.request_data ->> 'price'),
          '0'
        ) AS amount_try,
        -- credit_<N> id'sinden adet çek
        NULLIF(
          regexp_replace(
            COALESCE(pl.request_data #>> '{basketItems,0,id}', ''),
            '^credit_(\\d+).*$',
            '\\1'
          ),
          ''
        )::int AS credits_amount,
        CASE
          WHEN pl.request_data #>> '{basketItems,0,id}' LIKE 'credit_%' THEN 'credit'
          WHEN pl.request_data #>> '{basketItems,0,id}' = 'infinite_hearts_subscription' THEN 'subscribe'
          ELSE 'unknown'
        END AS phase,
        pl.status AS logged_status,
        pl.created_at
      FROM payment_logs pl
      WHERE pl.created_at > NOW() - (${withinDays}::int * INTERVAL '1 day')
        AND (
          pl.response_data ->> 'status' = 'success'
          OR pl.status = 'success'
        )
        AND COALESCE(
          (pl.response_data ->> 'paymentId'),
          (pl.response_data ->> 'paymentTransactionId')
        ) IS NOT NULL
    )
    SELECT *
    FROM iyzico_success s
    WHERE
      -- Kredi alımı için credit_transactions success satırı olmalı
      (s.phase = 'credit' AND NOT EXISTS (
        SELECT 1 FROM credit_transactions ct
        WHERE ct.user_id = s.user_id
          AND ct.payment_id = s.iyzico_payment_id
          AND ct.status = 'success'
      ))
      OR
      -- Abonelik için user_subscriptions active satırı olmalı
      (s.phase = 'subscribe' AND NOT EXISTS (
        SELECT 1 FROM user_subscriptions us
        WHERE us.payment_id = s.iyzico_payment_id
          AND us.status = 'active'
      ))
    ORDER BY s.created_at DESC
    LIMIT 200
  `);

  const rows =
    (result as unknown as { rows?: typeof result }).rows ??
    (Array.isArray(result) ? (result as unknown as Array<Record<string, unknown>>) : []);

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    paymentLogId: Number(r.payment_log_id),
    userId: String(r.user_id),
    iyzicoPaymentId: String(r.iyzico_payment_id),
    conversationId: String(r.conversation_id),
    amountTry: Number(r.amount_try ?? 0),
    creditsAmount: r.credits_amount != null ? Number(r.credits_amount) : null,
    phase: (r.phase === "credit" || r.phase === "subscribe" ? r.phase : "unknown") as
      | "credit"
      | "subscribe"
      | "unknown",
    loggedStatus: String(r.logged_status),
    createdAt: new Date(String(r.created_at)).toISOString(),
  }));
}

/**
 * Cron'dan çağrılır. Orphan bulursa her satır için `error_log`'a yüksek
 * önemde kayıt düşer (admin günlük taramada görür). Sayıyı döndürür.
 */
export async function reconcilePaymentsCronStep(): Promise<{
  orphansDetected: number;
  withinDays: number;
}> {
  const withinDays = 7;
  const orphans = await detectOrphanPayments(withinDays);

  for (const orphan of orphans) {
    log.error({
      message: "payment reconciliation: orphan detected",
      source: "cron",
      location: "actions/payment-reconciliation/reconcilePaymentsCronStep",
      fields: {
        severity: "high",
        paymentLogId: orphan.paymentLogId,
        userId: orphan.userId,
        iyzicoPaymentId: orphan.iyzicoPaymentId,
        conversationId: orphan.conversationId,
        amountTry: orphan.amountTry,
        creditsAmount: orphan.creditsAmount,
        phase: orphan.phase,
        loggedStatus: orphan.loggedStatus,
        createdAt: orphan.createdAt,
        action: "manual_reconcile_required",
      },
    });
  }

  if (orphans.length > 0) {
    log.error({
      message: `payment reconciliation: ${orphans.length} orphan(s) need manual review`,
      source: "cron",
      location: "actions/payment-reconciliation/reconcilePaymentsCronStep",
      fields: { severity: "high", count: orphans.length, withinDays },
    });
  } else {
    log.info("payment reconciliation: no orphans detected", {
      source: "cron",
      location: "actions/payment-reconciliation/reconcilePaymentsCronStep",
      withinDays,
    });
  }

  return { orphansDetected: orphans.length, withinDays };
}
