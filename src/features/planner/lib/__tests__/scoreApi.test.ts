import { describe, expect, it } from "vitest";
import { parsePlannerScorePayload, scorePlannerRequest } from "@/features/planner/lib/scoreApi";
import { PlannerScoreRequest } from "@/features/planner/types/planner";

const makePayload = (): PlannerScoreRequest => ({
  caseId: "brain",
  protocolId: "brain_t2_axial",
  box: {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 0.6, y: 0.6, z: 0.6 },
    rotation: { rx: 0, ry: 0, rz: 0 }
  },
  params: {
    TR: 4800,
    TE: 95,
    FOV: 240,
    Slices: 24,
    SliceThickness: 5,
    SliceGap: 0.5
  }
});

describe("parsePlannerScorePayload", () => {
  it("accepts valid score request payload", () => {
    const parsed = parsePlannerScorePayload(makePayload());
    expect(parsed.ok).toBe(true);
  });

  it("rejects invalid box payload", () => {
    const parsed = parsePlannerScorePayload({
      ...makePayload(),
      box: { center: { x: 0, y: 0, z: 0 } }
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.code).toBe("INVALID_BOX");
    }
  });
});

describe("scorePlannerRequest", () => {
  it("returns score response for known case/protocol", () => {
    const result = scorePlannerRequest(makePayload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.score.protocolId).toBe("brain_t2_axial");
      expect(result.data.revealTarget).toBe(true);
    }
  });

  it("rejects unknown protocol", () => {
    const result = scorePlannerRequest({
      ...makePayload(),
      protocolId: "does_not_exist"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNKNOWN_PROTOCOL");
    }
  });
});

