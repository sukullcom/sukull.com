import { describe, it, expect } from "vitest";
import { getAuthError } from "@/utils/auth-errors";

describe("getAuthError", () => {
  describe("returns Turkish messages — never English", () => {
    it("translates invalid credentials", () => {
      const r = getAuthError({ message: "Invalid login credentials" });
      expect(r.type).toBe("InvalidCredentials");
      expect(r.message).toContain("Geçersiz e-posta veya şifre");
    });

    it("translates email not confirmed", () => {
      const r = getAuthError({ message: "Email not confirmed" });
      expect(r.type).toBe("EmailNotConfirmed");
      expect(r.message).toContain("e-postanızı doğrulayınız");
    });

    it("translates user already registered", () => {
      const r = getAuthError({ message: "User already registered" });
      expect(r.type).toBe("EmailInUse");
      expect(r.message).toContain("zaten kayıtlı");
    });

    it("translates weak password", () => {
      const r = getAuthError({ message: "Password should be at least 6 characters" });
      expect(r.type).toBe("WeakPassword");
    });

    it("translates rate limit", () => {
      const r = getAuthError({ message: "Email rate limit exceeded" });
      expect(r.type).toBe("RateLimit");
    });

    it("translates network error", () => {
      const r = getAuthError({ message: "Failed to fetch" });
      expect(r.type).toBe("NetworkError");
    });
  });

  describe("prioritises Supabase error codes when present", () => {
    it("uses invalid_credentials code", () => {
      const r = getAuthError({ code: "invalid_credentials", message: "whatever" });
      expect(r.type).toBe("InvalidCredentials");
    });

    it("uses email_exists code", () => {
      const r = getAuthError({ code: "email_exists", message: "" });
      expect(r.type).toBe("EmailInUse");
    });

    it("uses weak_password code", () => {
      const r = getAuthError({ code: "weak_password", message: "" });
      expect(r.type).toBe("WeakPassword");
    });
  });

  describe("Postgres error codes", () => {
    it("treats 23505 unique violation as EmailInUse", () => {
      const r = getAuthError({ code: "23505", message: "duplicate key" });
      expect(r.type).toBe("EmailInUse");
    });
  });

  describe("fallback behaviour", () => {
    it("handles string input", () => {
      const r = getAuthError("Invalid login credentials");
      expect(r.type).toBe("InvalidCredentials");
    });

    it("handles null/undefined safely", () => {
      expect(getAuthError(null).type).toBe("Default");
      expect(getAuthError(undefined).type).toBe("Default");
    });

    it("returns Turkish default for unknown errors", () => {
      const r = getAuthError({ message: "Some totally unknown error xyz" });
      expect(r.type).toBe("Default");
      expect(r.message).toMatch(/hata|deneyiniz/i);
      // Make sure we never leak the English message
      expect(r.message).not.toContain("xyz");
    });

    it("uses error_description when message is empty", () => {
      const r = getAuthError({
        message: "",
        error_description: "Invalid login credentials",
      });
      expect(r.type).toBe("InvalidCredentials");
    });
  });
});
