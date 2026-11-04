import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COMMENT_FIELDS = new Set(["live_comments", "comments"]);
const MAX_TEXT = 2200;

export type InstagramCommentField = "live_comments" | "comments";

export type InstagramCommentEvent = {
  field: InstagramCommentField;
  commentId: string;
  text: string;
  username: string | null;
  commenterId: string | null;
  mediaId: string | null;
  mediaProductType: string | null;
  accountId: string | null;
  parentId: string | null;
  eventTime: Date | null;
};

/** Karşılaştırma, değerlerin uzunluğunu sızdırmasın diye özet üzerinden yapılır. */
export function secretsMatch(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Meta, POST gövdesini uygulamanın App Secret’ı ile imzalar.
 * Başlık: `X-Hub-Signature-256: sha256=<hex>`.
 */
export function verifyMetaSignature(
  rawBody: string,
  header: string | null,
  appSecret: string,
): boolean {
  if (!header || !appSecret) return false;
  const provided = header.startsWith("sha256=") ? header.slice("sha256=".length) : header;
  const digest = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const given = hexToBuffer(provided);
  const expected = hexToBuffer(digest);
  if (!given || !expected || given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

/**
 * Instagram Login düz `field`/`value` gönderir.
 * Facebook Login ve Unified Login aynı olayı `changes` dizisinde gönderir.
 * Meta’nın örnek gövdesi bazen tek nesne, bazen dizi olur.
 */
/** İmzalı gövdede hangi alan adları var? Yorum metnini saklamaz. */
export function describeInstagramPayload(payload: unknown): string {
  const fields = new Set<string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const record = asRecord(node);
    if (!record) return;
    const field = readString(record.field);
    if (field) fields.add(field);
    if (Array.isArray(record.entry)) visit(record.entry);
    if (Array.isArray(record.changes)) visit(record.changes);
  };
  visit(payload);
  const names = Array.from(fields);
  return names.length > 0 ? names.join(",") : "no-field";
}

export function parseInstagramCommentEvents(payload: unknown): InstagramCommentEvent[] {
  const events: InstagramCommentEvent[] = [];
  for (const root of unwrapRoots(payload)) {
    const entries = Array.isArray(root.entry) ? root.entry : [];
    for (const entry of entries) {
      const record = asRecord(entry);
      if (!record) continue;
      const accountId = readString(record.id);
      const eventTime = unixToDate(record.time);
      if (Array.isArray(record.changes)) {
        for (const change of record.changes) {
          const changeRecord = asRecord(change);
          if (!changeRecord) continue;
          const field = readString(changeRecord.field);
          if (!field) continue;
          const event = readComment(field, changeRecord.value, accountId, eventTime);
          if (event) events.push(event);
        }
        continue;
      }
      const field = readString(record.field);
      if (!field) continue;
      const event = readComment(field, record.value, accountId, eventTime);
      if (event) events.push(event);
    }
  }
  return events;
}

function readComment(
  field: string,
  value: unknown,
  accountId: string | null,
  eventTime: Date | null,
): InstagramCommentEvent | null {
  if (!COMMENT_FIELDS.has(field)) return null;
  const record = asRecord(value);
  if (!record) return null;
  const commentId = readString(record.id) ?? readString(record.comment_id);
  if (!commentId) return null;
  const from = asRecord(record.from);
  const media = asRecord(record.media);
  return {
    field: field as InstagramCommentField,
    commentId,
    text: clip(readString(record.text) ?? ""),
    username: from ? readString(from.username) : null,
    commenterId: from ? readString(from.id) : null,
    mediaId: media ? readString(media.id) : null,
    mediaProductType: media ? readString(media.media_product_type) : null,
    accountId,
    parentId: readString(record.parent_id),
    eventTime,
  };
}

function unwrapRoots(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => {
      const record = asRecord(item);
      return record ? [record] : [];
    });
  }
  const root = asRecord(payload);
  return root ? [root] : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function clip(value: string): string {
  return value.length > MAX_TEXT ? value.slice(0, MAX_TEXT) : value;
}

function unixToDate(value: unknown): Date | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : NaN;
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const ms = numeric > 1e12 ? numeric : numeric * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hexToBuffer(hex: string): Buffer | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  return Buffer.from(hex, "hex");
}
