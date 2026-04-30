import { describe, expect, it } from "vitest";
import {
  isValidTurkeyMobileForProfile,
  sanitizeTeacherProfilePlainText,
  validateCapabilitiesMatchPrimaryField,
} from "@/lib/teacher-profile-mutation";

describe("sanitizeTeacherProfilePlainText", () => {
  it("strips angle brackets and caps length", () => {
    expect(sanitizeTeacherProfilePlainText(`a<b>alert</b>c`, 20)).toBe("a alert c");
    expect(sanitizeTeacherProfilePlainText("x".repeat(100), 5)).toBe("xxxxx");
  });
});

describe("isValidTurkeyMobileForProfile", () => {
  it("accepts common TR formats", () => {
    expect(isValidTurkeyMobileForProfile("05321234567")).toBe(true);
    expect(isValidTurkeyMobileForProfile("+90 532 123 45 67")).toBe(true);
    expect(isValidTurkeyMobileForProfile("5321234567")).toBe(true);
  });
  it("rejects invalid", () => {
    expect(isValidTurkeyMobileForProfile("123")).toBe(false);
    expect(isValidTurkeyMobileForProfile("4321234567")).toBe(false);
  });
});

describe("validateCapabilitiesMatchPrimaryField", () => {
  it("requires every capability subject to match field", () => {
    expect(
      validateCapabilitiesMatchPrimaryField("Matematik", [
        { subject: "Matematik", grade: "10.sınıf" },
        { subject: "Matematik", grade: "11.sınıf" },
      ]),
    ).toBe(true);
    expect(
      validateCapabilitiesMatchPrimaryField("Matematik", [
        { subject: "Fizik", grade: "10.sınıf" },
      ]),
    ).toBe(false);
  });
});
