import { describe, it, expect } from "vitest";
import { isValidTcKimlik } from "@/lib/tc-kimlik";

describe("isValidTcKimlik", () => {
  describe("valid numbers", () => {
    // Known valid test TC numbers (commonly used in test environments;
    // they satisfy the algorithm but do not correspond to real citizens).
    it.each([
      "10000000146",
      "11111111110",
      "12345678950",
    ])("accepts checksum-valid number %s", (tc) => {
      expect(isValidTcKimlik(tc)).toBe(true);
    });
  });

  describe("rejects by format", () => {
    it("rejects empty string", () => {
      expect(isValidTcKimlik("")).toBe(false);
    });

    it("rejects non-strings", () => {
      expect(isValidTcKimlik(12345678901 as unknown as string)).toBe(false);
      expect(isValidTcKimlik(null)).toBe(false);
      expect(isValidTcKimlik(undefined)).toBe(false);
      expect(isValidTcKimlik({})).toBe(false);
    });

    it("rejects shorter than 11 digits", () => {
      expect(isValidTcKimlik("1234567890")).toBe(false);
    });

    it("rejects longer than 11 digits", () => {
      expect(isValidTcKimlik("123456789012")).toBe(false);
    });

    it("rejects non-numeric characters", () => {
      expect(isValidTcKimlik("1234567890a")).toBe(false);
      expect(isValidTcKimlik("12 34567 890")).toBe(false);
    });

    it("rejects leading zero", () => {
      expect(isValidTcKimlik("01234567890")).toBe(false);
    });
  });

  describe("rejects by checksum", () => {
    it("rejects when 10th digit fails", () => {
      // Mutate last-but-one digit from a known valid number.
      expect(isValidTcKimlik("10000000156")).toBe(false);
    });

    it("rejects when 11th digit fails", () => {
      // Mutate last digit from a known valid number.
      expect(isValidTcKimlik("10000000147")).toBe(false);
    });

    it("rejects obviously fake sequences", () => {
      expect(isValidTcKimlik("12345678901")).toBe(false);
      expect(isValidTcKimlik("99999999999")).toBe(false);
    });
  });

  it("tolerates leading/trailing whitespace", () => {
    expect(isValidTcKimlik("  10000000146  ")).toBe(true);
  });
});
