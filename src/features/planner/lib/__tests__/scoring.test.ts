import { describe, expect, it } from "vitest";
import { computeScore, deepClone, withFallbackTarget } from "@/features/planner/lib/scoring";
import {
  PlannerBox,
  PlannerParams,
  ProtocolConfig,
  ProtocolParameterSpec,
  ProtocolTarget
} from "@/features/planner/types/planner";

const params = (
  TR: number,
  TE: number,
  FOV: number,
  Slices: number,
  SliceThickness: number,
  SliceGap: number
): PlannerParams => ({
  TR,
  TE,
  FOV,
  Slices,
  SliceThickness,
  SliceGap
});

const parameterSpecs: ProtocolParameterSpec[] = [
  { key: "TR", label: "TR", min: 0, step: 1, weight: 1 },
  { key: "TE", label: "TE", min: 0, step: 1, weight: 1 },
  { key: "FOV", label: "FOV", min: 0, step: 1, weight: 1 },
  { key: "Slices", label: "Slices", min: 1, step: 1, integer: true, weight: 1 },
  { key: "SliceThickness", label: "Slice Thickness", min: 0, step: 0.1, weight: 1 },
  { key: "SliceGap", label: "Slice Gap", min: 0, step: 0.1, weight: 1 }
];

const protocol: ProtocolConfig = {
  id: "test_protocol",
  label: "Test Protocol",
  target: {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 0.8, y: 0.7, z: 0.5 },
    rotation: { rx: 4, ry: -3, rz: 8 },
    params: params(3000, 90, 220, 20, 4, 0.5)
  },
  acceptedTargets: [
    {
      center: { x: 0.25, y: 0.25, z: 0.25 },
      size: { x: 0.75, y: 0.66, z: 0.5 },
      rotation: { rx: 5, ry: -2, rz: 9 },
      params: params(3050, 92, 220, 20, 4, 0.5)
    }
  ],
  initial: {
    center: { x: 0.2, y: 0.2, z: 0.2 },
    size: { x: 0.5, y: 0.5, z: 0.5 },
    rotation: { rx: 0, ry: 0, rz: 0 },
    params: params(2500, 70, 260, 14, 5, 1.2)
  },
  tolerances: { center: 0.2, size: 0.2, rotation: 15, param: 0.2 },
  parameterSpecs
};

describe("scoring core", () => {
  it("returns perfect score when attempt matches target", () => {
    const box: PlannerBox = {
      center: deepClone(protocol.target.center),
      size: deepClone(protocol.target.size),
      rotation: deepClone(protocol.target.rotation)
    };

    const score = computeScore(protocol, box, deepClone(protocol.target.params), false, "brain");
    expect(score.finalScorePercent).toBe(100);
    expect(score.pass).toBe(true);
    expect(score.componentScores.positionPercent).toBe(100);
    expect(score.scoreSchemaVersion).toBe(2);
    expect(score.matchedTargetIndex).toBe(0);
    expect(score.findings[0]?.code).toBe("planning_ready");
  });

  it("matches accepted alternate target when closer", () => {
    const alt = protocol.acceptedTargets?.[0];
    if (!alt) {
      throw new Error("Missing accepted target in test setup.");
    }

    const attemptBox: PlannerBox = {
      center: deepClone(alt.center),
      size: deepClone(alt.size),
      rotation: deepClone(alt.rotation)
    };

    const score = computeScore(protocol, attemptBox, deepClone(alt.params), false, "brain");
    expect(score.finalScorePercent).toBeGreaterThanOrEqual(95);
    expect(score.matchedTargetKind).toBe("accepted");
    expect(score.matchedTargetIndex).toBe(1);
  });

  it("fails clearly when attempt is far from target", () => {
    const badBox: PlannerBox = {
      center: { x: 0.95, y: -0.95, z: 0.95 },
      size: { x: 0.2, y: 1.6, z: 1.6 },
      rotation: { rx: 40, ry: -40, rz: 40 }
    };
    const badParams = params(600, 20, 400, 3, 10, 4);

    const score = computeScore(protocol, badBox, badParams, true, "cspine");
    expect(score.finalScorePercent).toBeLessThan(40);
    expect(score.pass).toBe(false);
    expect(score.rawErrors.center).toBeGreaterThan(0.5);
    expect(score.calibratedTargetUsed).toBe(true);
    expect(score.feedback.length).toBeGreaterThan(0);
    expect(score.findings.some((finding) => finding.code === "coverage_off_center")).toBe(true);
  });

  it("merges fallback target fields when calibration is partial", () => {
    const partial = {
      center: { x: 0.4 }
    } as unknown as ProtocolTarget;

    const merged = withFallbackTarget(protocol, partial);
    expect(merged.target.center.x).toBe(0.4);
    expect(merged.target.center.y).toBe(protocol.target.center.y);
    expect(merged.target.params.TR).toBe(protocol.target.params.TR);
    expect(merged.target.rotation.rz).toBe(protocol.target.rotation.rz);
  });

  it("deep clones nested objects", () => {
    const cloned = deepClone(protocol.target);
    cloned.center.x = 999;
    expect(protocol.target.center.x).toBe(0);
  });
});
