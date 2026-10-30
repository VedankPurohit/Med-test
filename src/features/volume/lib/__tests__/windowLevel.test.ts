import { describe, expect, it } from "vitest";
import { applyWindowLevel } from "../windowLevel";

describe("applyWindowLevel", () => {
  it("returns 0 for values below window", () => {
    expect(applyWindowLevel(0, 100, 100)).toBe(0);
  });

  it("returns 255 for values above window", () => {
    expect(applyWindowLevel(200, 100, 100)).toBe(255);
  });

  it("returns ~128 for center value", () => {
    const result = applyWindowLevel(100, 100, 200);
    expect(result).toBe(128);
  });

  it("handles zero width gracefully", () => {
    expect(applyWindowLevel(100, 100, 0)).toBe(255);
    expect(applyWindowLevel(50, 100, 0)).toBe(0);
  });

  it("maps linearly within window", () => {
    // center=50, width=100 => lower=0, upper=100
    expect(applyWindowLevel(0, 50, 100)).toBe(0);
    expect(applyWindowLevel(25, 50, 100)).toBe(64);
    expect(applyWindowLevel(50, 50, 100)).toBe(128);
    expect(applyWindowLevel(100, 50, 100)).toBe(255);
  });
});
