import { describe, expect, it } from "vitest";
import {
  MAX_VIEW_FILE_BYTES,
  createSimpleRateLimiter,
  parseContributionPayload,
  sanitizeFileName,
  validateViewFile
} from "@/features/contribution/lib/exportApi";

const makePayload = () =>
  JSON.stringify({
    createdAt: "2026-02-23T00:00:00.000Z",
    sourceAppVersion: "0.1.0",
    phiAttestation: true,
    anatomy: { primaryType: "brain" },
    protocols: [],
    placements: {}
  });

describe("parseContributionPayload", () => {
  it("parses valid payload JSON", () => {
    const parsed = parseContributionPayload(makePayload());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.payload.sourceAppVersion).toBe("0.1.0");
      expect(parsed.payload.phiAttestation).toBe(true);
    }
  });

  it("rejects non-string payload", () => {
    const parsed = parseContributionPayload(new File(["{}"], "payload.json", { type: "application/json" }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.code).toBe("MISSING_PAYLOAD");
    }
  });

  it("rejects invalid payload shape", () => {
    const parsed = parseContributionPayload(JSON.stringify({ foo: "bar" }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.code).toBe("INVALID_PAYLOAD");
    }
  });
});

describe("validateViewFile", () => {
  it("accepts valid image file", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "axial.png", { type: "image/png" });
    const result = validateViewFile(file, "axial");
    expect(result.ok).toBe(true);
  });

  it("rejects unsupported mime type", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "axial.gif", { type: "image/gif" });
    const result = validateViewFile(file, "axial");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_VIEW_FILE");
    }
  });

  it("rejects oversized files", () => {
    const bytes = new Uint8Array(MAX_VIEW_FILE_BYTES + 1);
    const file = new File([bytes], "axial.png", { type: "image/png" });
    const result = validateViewFile(file, "axial");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VIEW_FILE_TOO_LARGE");
    }
  });
});

describe("sanitizeFileName", () => {
  it("removes path traversal and unsafe chars", () => {
    expect(sanitizeFileName("../../foo?.png")).toBe("foo_.png");
  });
});

describe("createSimpleRateLimiter", () => {
  it("blocks requests past limit in the same window", () => {
    const limiter = createSimpleRateLimiter(2, 1000);
    expect(limiter.consume("ip-1", 1000).ok).toBe(true);
    expect(limiter.consume("ip-1", 1100).ok).toBe(true);

    const blocked = limiter.consume("ip-1", 1200);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});

