import { describe, expect, it } from "vitest";
import { teacherPrivateLessonDisplayName } from "@/lib/teacher-private-lesson-name";

describe("teacherPrivateLessonDisplayName", () => {
  it("uses application first+last when present", () => {
    expect(
      teacherPrivateLessonDisplayName("Ayşe", "Yılmaz", "nick123"),
    ).toBe("Ayşe Yılmaz");
  });

  it("falls back to account name when application empty", () => {
    expect(teacherPrivateLessonDisplayName("", "  ", "Ali Veli")).toBe("Ali Veli");
    expect(teacherPrivateLessonDisplayName(null, undefined, "  Z  ")).toBe("Z");
  });

  it("defaults when both missing", () => {
    expect(teacherPrivateLessonDisplayName(null, null, "")).toBe("Eğitmen");
  });
});
