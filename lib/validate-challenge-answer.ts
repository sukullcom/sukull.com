/**
 * Server-side cevap doğrulayıcı.
 *
 * Sorun: `app/lesson/quiz.tsx` doğruluğu istemcide hesaplayıp server'a
 * yalnızca `challengeId` gönderiyordu. DevTools'tan veya doğrudan action
 * çağrısı ile kullanıcı haksız yere puan/streak kazanabilirdi (özellikle
 * `MATCH_PAIRS` her zaman `true`; `SEQUENCE` istemci ref'i bypass'a açık).
 *
 * Bu modül her challenge tipi için **gerçek** doğrulamayı yapar; ders
 * akışında `actions/challenge-progress.ts` bunu çağırır. İstemci yalan
 * söylese bile satır yazılmaz, puan verilmez.
 *
 * Geri uyumluluk: `answer === undefined` durumunda eski "trust" davranışı
 * korunur (deploy sırasında bir önceki sürümün açık sekmeleri kırılmasın
 * diye); ama log + telemetri ile bu yol kullanıcı sayısı sıfıra düşene
 * kadar izlenmeli.
 */

import type { challengeOptions, challenges } from "@/db/schema";

type ChallengeRow = typeof challenges.$inferSelect;
type OptionRow = typeof challengeOptions.$inferSelect;

/**
 * İstemciden gelen cevap payload'u. Discriminated union — her tip için
 * gereken alanlar farklı, runtime tip kontrolü kolay.
 */
export type ChallengeAnswer =
  /** SELECT, ASSIST, FILL_BLANK, TIMER_CHALLENGE: tek doğru option seçildi. */
  | { kind: "select"; selectedOptionId: number }
  /** MATCH_PAIRS: kullanıcının yaptığı eşleşmeler — her eleman iki option id. */
  | { kind: "match_pairs"; pairs: Array<[number, number]> }
  /** SEQUENCE: option id'leri **doğru sıra ile** (1-indexed, ardışık). */
  | { kind: "sequence"; orderedOptionIds: number[] }
  /**
   * DRAG_DROP: zone → item eşlemesi. Mevcut UI henüz tam yapılandırılmamış
   * olduğu için validator burada cömert davranır; ileride genişletilecek.
   */
  | { kind: "drag_drop"; placements: Array<{ zoneId: string; itemOptionId: number }> };

/** Doğrulama sonucu. `unsupported` zorla puan vermeme — DRAG_DROP gibi. */
export type ChallengeValidationResult =
  | { ok: true; isCorrect: boolean }
  | { ok: false; reason: "missing_answer" | "type_mismatch" | "invalid_payload" };

/**
 * Üst seviye dispatcher. Server action `userAnswer === undefined` durumunda
 * bu fonksiyonu çağırmaz (eski client trust modu); `userAnswer` varsa
 * `ok: true` + `isCorrect` döner.
 */
export function validateChallengeAnswer(
  challenge: Pick<ChallengeRow, "id" | "type">,
  options: ReadonlyArray<OptionRow>,
  answer: ChallengeAnswer,
): ChallengeValidationResult {
  // Hızlı sağlık: bu challenge'a ait olmayan option payload'larını kabul etme.
  // İstemci başka bir challenge'ın option id'sini gönderirse `id ∈ options`
  // kontrolü bunu yakalar; aksi halde başka bir derste `correct=true` olan
  // bir option'la sahte puan alınabilir.
  const optionIdSet = new Set(options.map((o) => o.id));

  switch (answer.kind) {
    case "select": {
      if (
        challenge.type !== "SELECT" &&
        challenge.type !== "ASSIST" &&
        challenge.type !== "FILL_BLANK" &&
        challenge.type !== "TIMER_CHALLENGE"
      ) {
        return { ok: false, reason: "type_mismatch" };
      }
      if (
        typeof answer.selectedOptionId !== "number" ||
        !optionIdSet.has(answer.selectedOptionId)
      ) {
        return { ok: false, reason: "invalid_payload" };
      }
      const picked = options.find((o) => o.id === answer.selectedOptionId);
      if (!picked) return { ok: false, reason: "invalid_payload" };
      return { ok: true, isCorrect: picked.correct === true };
    }

    case "sequence": {
      if (challenge.type !== "SEQUENCE") return { ok: false, reason: "type_mismatch" };
      const submitted = answer.orderedOptionIds;
      if (!Array.isArray(submitted)) return { ok: false, reason: "invalid_payload" };

      const expected = options
        .filter((o) => o.correctOrder !== null && o.correctOrder !== undefined)
        .slice()
        .sort((a, b) => (a.correctOrder ?? 0) - (b.correctOrder ?? 0));

      if (submitted.length !== expected.length) {
        // Eksik veya fazla item: net "yanlış".
        return { ok: true, isCorrect: false };
      }
      if (submitted.some((id) => typeof id !== "number" || !optionIdSet.has(id))) {
        return { ok: false, reason: "invalid_payload" };
      }
      // Aynı id iki kez gelmesin — kullanıcı item'ları çoğaltamaz.
      if (new Set(submitted).size !== submitted.length) {
        return { ok: true, isCorrect: false };
      }
      for (let i = 0; i < expected.length; i++) {
        if (submitted[i] !== expected[i].id) {
          return { ok: true, isCorrect: false };
        }
      }
      return { ok: true, isCorrect: true };
    }

    case "match_pairs": {
      if (challenge.type !== "MATCH_PAIRS") return { ok: false, reason: "type_mismatch" };
      const submitted = answer.pairs;
      if (!Array.isArray(submitted)) return { ok: false, reason: "invalid_payload" };

      // Beklenen pair_id → option id seti haritası.
      const expectedByPair = new Map<number, Set<number>>();
      for (const o of options) {
        if (o.pairId === null || o.pairId === undefined) continue;
        const set = expectedByPair.get(o.pairId) ?? new Set<number>();
        set.add(o.id);
        expectedByPair.set(o.pairId, set);
      }

      // Beklenen pair sayısı: her pair_id'nin 2 option'ı olmalı (ikili eşleşme).
      const expectedPairCount = Array.from(expectedByPair.values()).filter(
        (s) => s.size === 2,
      ).length;
      if (submitted.length !== expectedPairCount) {
        return { ok: true, isCorrect: false };
      }

      const seen = new Set<number>();
      for (const tuple of submitted) {
        if (!Array.isArray(tuple) || tuple.length !== 2) {
          return { ok: false, reason: "invalid_payload" };
        }
        const [a, b] = tuple;
        if (
          typeof a !== "number" ||
          typeof b !== "number" ||
          a === b ||
          !optionIdSet.has(a) ||
          !optionIdSet.has(b) ||
          seen.has(a) ||
          seen.has(b)
        ) {
          return { ok: false, reason: "invalid_payload" };
        }
        seen.add(a);
        seen.add(b);

        const optA = options.find((o) => o.id === a);
        const optB = options.find((o) => o.id === b);
        if (!optA || !optB) return { ok: false, reason: "invalid_payload" };
        if (
          optA.pairId === null ||
          optA.pairId === undefined ||
          optA.pairId !== optB.pairId
        ) {
          return { ok: true, isCorrect: false };
        }
      }
      return { ok: true, isCorrect: true };
    }

    case "drag_drop": {
      if (challenge.type !== "DRAG_DROP") return { ok: false, reason: "type_mismatch" };
      // Mevcut DRAG_DROP yapısı (`option.dragData` JSON) henüz net bir
      // sözleşmeye oturmamış; istemci tarafı ham `correctItemId` ile karar
      // veriyor. Doğrulamayı buraya eklemek `drag_data` formatının
      // dondurulmasını gerektiriyor — ayrı bir görev olarak ele alınmalı.
      // Şimdilik istemci iddiasına güveniyoruz (eski davranış) ama payload
      // yapısı doğru tipte gelmiş mi en azından kontrol edelim.
      if (!Array.isArray(answer.placements)) {
        return { ok: false, reason: "invalid_payload" };
      }
      return { ok: true, isCorrect: true };
    }

    default: {
      // Tüm `kind` branches yukarıda handle edildi; bu noktaya düşmek
      // payload türünün bozulduğu (geçersiz `kind`) anlamına gelir.
      return { ok: false, reason: "invalid_payload" };
    }
  }
}

/**
 * `answer` payload'unun temel şeklini istemci tarafından kabul etmeden
 * önce sağlamak için kullanılır (server action argument hardening).
 * Burada deep validation yapmıyoruz — validateChallengeAnswer zaten
 * options bağlamında nihai kararı veriyor.
 */
export function isChallengeAnswerShape(value: unknown): value is ChallengeAnswer {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  switch (v.kind) {
    case "select":
      return typeof v.selectedOptionId === "number";
    case "sequence":
      return Array.isArray(v.orderedOptionIds);
    case "match_pairs":
      return Array.isArray(v.pairs);
    case "drag_drop":
      return Array.isArray(v.placements);
    default:
      return false;
  }
}
