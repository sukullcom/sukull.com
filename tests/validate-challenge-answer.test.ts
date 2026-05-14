import { describe, expect, it } from "vitest";
import {
  isChallengeAnswerShape,
  validateChallengeAnswer,
  type ChallengeAnswer,
} from "@/lib/validate-challenge-answer";

type OptionLike = {
  id: number;
  challengeId: number;
  text: string;
  correct: boolean;
  imageSrc: string | null;
  audioSrc: string | null;
  correctOrder: number | null;
  pairId: number | null;
  isBlank: boolean | null;
  dragData: string | null;
};

function opt(partial: Partial<OptionLike> & { id: number }): OptionLike {
  return {
    challengeId: 1,
    text: "",
    correct: false,
    imageSrc: null,
    audioSrc: null,
    correctOrder: null,
    pairId: null,
    isBlank: false,
    dragData: null,
    ...partial,
  };
}

describe("validateChallengeAnswer / select tipleri", () => {
  const options = [
    opt({ id: 1, correct: false }),
    opt({ id: 2, correct: true }),
    opt({ id: 3, correct: false }),
  ];

  it.each(["SELECT", "ASSIST", "FILL_BLANK", "TIMER_CHALLENGE"] as const)(
    "%s: doğru option → isCorrect true",
    (type) => {
      const res = validateChallengeAnswer(
        { id: 1, type },
        options,
        { kind: "select", selectedOptionId: 2 },
      );
      expect(res).toEqual({ ok: true, isCorrect: true });
    },
  );

  it("yanlış option → isCorrect false", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SELECT" },
      options,
      { kind: "select", selectedOptionId: 3 },
    );
    expect(res).toEqual({ ok: true, isCorrect: false });
  });

  it("yabancı option id (başka ders) → invalid_payload", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SELECT" },
      options,
      { kind: "select", selectedOptionId: 9999 },
    );
    expect(res).toEqual({ ok: false, reason: "invalid_payload" });
  });

  it("tip uyumsuz (SELECT challenge'a sequence payload) → type_mismatch", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SEQUENCE" },
      options,
      { kind: "select", selectedOptionId: 2 },
    );
    expect(res).toEqual({ ok: false, reason: "type_mismatch" });
  });
});

describe("validateChallengeAnswer / SEQUENCE", () => {
  const options = [
    opt({ id: 10, correctOrder: 1 }),
    opt({ id: 11, correctOrder: 2 }),
    opt({ id: 12, correctOrder: 3 }),
  ];

  it("doğru sıra → true", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SEQUENCE" },
      options,
      { kind: "sequence", orderedOptionIds: [10, 11, 12] },
    );
    expect(res).toEqual({ ok: true, isCorrect: true });
  });

  it("yanlış sıra → false", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SEQUENCE" },
      options,
      { kind: "sequence", orderedOptionIds: [11, 10, 12] },
    );
    expect(res).toEqual({ ok: true, isCorrect: false });
  });

  it("eksik eleman → false", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SEQUENCE" },
      options,
      { kind: "sequence", orderedOptionIds: [10, 11] },
    );
    expect(res).toEqual({ ok: true, isCorrect: false });
  });

  it("aynı id iki kez → false (hile)", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SEQUENCE" },
      options,
      { kind: "sequence", orderedOptionIds: [10, 10, 12] },
    );
    expect(res).toEqual({ ok: true, isCorrect: false });
  });

  it("yabancı option id → invalid_payload", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "SEQUENCE" },
      options,
      { kind: "sequence", orderedOptionIds: [10, 999, 12] },
    );
    expect(res).toEqual({ ok: false, reason: "invalid_payload" });
  });
});

describe("validateChallengeAnswer / MATCH_PAIRS", () => {
  // İki çift: (100,101) pairId=1; (102,103) pairId=2.
  const options = [
    opt({ id: 100, pairId: 1 }),
    opt({ id: 101, pairId: 1 }),
    opt({ id: 102, pairId: 2 }),
    opt({ id: 103, pairId: 2 }),
  ];

  it("doğru eşleşmeler → true", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "MATCH_PAIRS" },
      options,
      { kind: "match_pairs", pairs: [[100, 101], [102, 103]] },
    );
    expect(res).toEqual({ ok: true, isCorrect: true });
  });

  it("ters sıralı tuple → yine doğru (pairId aynı olduğu sürece)", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "MATCH_PAIRS" },
      options,
      { kind: "match_pairs", pairs: [[101, 100], [103, 102]] },
    );
    expect(res).toEqual({ ok: true, isCorrect: true });
  });

  it("farklı pairId iki option → false", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "MATCH_PAIRS" },
      options,
      { kind: "match_pairs", pairs: [[100, 102], [101, 103]] },
    );
    expect(res).toEqual({ ok: true, isCorrect: false });
  });

  it("boş pairs (her zaman true hilesi) → false", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "MATCH_PAIRS" },
      options,
      { kind: "match_pairs", pairs: [] },
    );
    expect(res).toEqual({ ok: true, isCorrect: false });
  });

  it("eksik çift sayısı → false", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "MATCH_PAIRS" },
      options,
      { kind: "match_pairs", pairs: [[100, 101]] },
    );
    expect(res).toEqual({ ok: true, isCorrect: false });
  });

  it("aynı option id iki çiftte → invalid_payload", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "MATCH_PAIRS" },
      options,
      { kind: "match_pairs", pairs: [[100, 101], [100, 103]] },
    );
    expect(res).toEqual({ ok: false, reason: "invalid_payload" });
  });
});

describe("validateChallengeAnswer / DRAG_DROP", () => {
  it("array payload kabul edilir (mevcut UI legacy)", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "DRAG_DROP" },
      [opt({ id: 1 })],
      { kind: "drag_drop", placements: [{ zoneId: "a", itemOptionId: 1 }] },
    );
    expect(res).toEqual({ ok: true, isCorrect: true });
  });

  it("invalid placements → invalid_payload", () => {
    const res = validateChallengeAnswer(
      { id: 1, type: "DRAG_DROP" },
      [opt({ id: 1 })],
      // @ts-expect-error: kasıtlı geçersiz payload
      { kind: "drag_drop", placements: "not an array" },
    );
    expect(res).toEqual({ ok: false, reason: "invalid_payload" });
  });
});

describe("isChallengeAnswerShape", () => {
  it("doğru shape", () => {
    const a: ChallengeAnswer = { kind: "select", selectedOptionId: 1 };
    expect(isChallengeAnswerShape(a)).toBe(true);
  });
  it("undefined → false", () => {
    expect(isChallengeAnswerShape(undefined)).toBe(false);
  });
  it("bilinmeyen kind → false", () => {
    expect(isChallengeAnswerShape({ kind: "wat", foo: 1 })).toBe(false);
  });
  it("eksik alan → false", () => {
    expect(isChallengeAnswerShape({ kind: "select" })).toBe(false);
  });
});
