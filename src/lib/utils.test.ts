import { describe, expect, it } from "vitest";
import { cn, formatExpirationText, getDaysUntilExpiration } from "./utils";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("merges Tailwind classes with conflict resolution", () => {
    expect(cn("p-2", "p-4")).toBe("p-4"); // tailwind-merge keeps the last
  });

  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

describe("getDaysUntilExpiration", () => {
  it("returns null for undefined date", () => {
    expect(getDaysUntilExpiration(undefined)).toBe(null);
  });

  it("returns null for null date", () => {
    expect(getDaysUntilExpiration(null)).toBe(null);
  });

  it("returns 0 for today's date", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split("T")[0];
    expect(getDaysUntilExpiration(dateString)).toBe(0);
  });

  it("returns positive days for future dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const dateString = future.toISOString().split("T")[0];
    expect(getDaysUntilExpiration(dateString)).toBe(5);
  });

  it("returns negative days for past dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    const dateString = past.toISOString().split("T")[0];
    expect(getDaysUntilExpiration(dateString)).toBe(-3);
  });
});

describe("formatExpirationText", () => {
  it("formats expired dates correctly", () => {
    expect(formatExpirationText(-1)).toBe("Expired 1 day ago");
    expect(formatExpirationText(-3)).toBe("Expired 3 days ago");
  });

  it("formats today correctly", () => {
    expect(formatExpirationText(0)).toBe("Expires today");
  });

  it("formats tomorrow correctly", () => {
    expect(formatExpirationText(1)).toBe("Expires tomorrow");
  });

  it("formats future days correctly", () => {
    expect(formatExpirationText(3)).toBe("Expires in 3 days");
    expect(formatExpirationText(7)).toBe("Expires in 7 days");
  });
});
