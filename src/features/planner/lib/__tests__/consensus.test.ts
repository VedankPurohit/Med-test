import { describe, expect, it } from "vitest";
import { buildConsensusTarget } from "@/features/planner/lib/consensus";
import { ExpertAnnotation } from "@/features/planner/types/planner";

const annotation = (
  id: string,
  centerX: number,
  centerY: number,
  centerZ: number,
  tr: number
): ExpertAnnotation => ({
  id,
  caseId: "brain",
  protocolId: "brain_t2_axial",
  raterId: `rater-${id}`,
  role: "radiologist",
  createdAt: "2026-02-15T00:00:00.000Z",
  target: {
    center: { x: centerX, y: centerY, z: centerZ },
    size: { x: 0.9, y: 0.8, z: 0.6 },
    rotation: { rx: -5, ry: 2, rz: 9 },
    params: { TR: tr, TE: 100, FOV: 220, Slices: 24, SliceThickness: 5, SliceGap: 0.5 }
  }
});

describe("consensus builder", () => {
  it("computes median target from expert annotations", () => {
    const consensus = buildConsensusTarget([
      annotation("a", 0.01, -0.05, 0.1, 4700),
      annotation("b", 0.03, -0.04, 0.11, 4800),
      annotation("c", 0.02, -0.06, 0.12, 4900)
    ]);

    expect(consensus.method).toBe("median");
    expect(consensus.sourceAnnotationIds.length).toBe(3);
    expect(consensus.target.center.x).toBeCloseTo(0.02, 6);
    expect(consensus.target.center.y).toBeCloseTo(-0.05, 6);
    expect(consensus.target.params.TR).toBe(4800);
  });

  it("handles outlier while clamping tolerance range", () => {
    const consensus = buildConsensusTarget([
      annotation("a", 0.02, -0.05, 0.1, 4800),
      annotation("b", 0.03, -0.04, 0.11, 4820),
      annotation("c", 0.8, 0.8, 0.8, 15000)
    ]);

    expect(consensus.target.center.x).toBeCloseTo(0.03, 6);
    expect(consensus.tolerances.center).toBeGreaterThanOrEqual(0.12);
    expect(consensus.tolerances.center).toBeLessThanOrEqual(0.35);
  });
});

