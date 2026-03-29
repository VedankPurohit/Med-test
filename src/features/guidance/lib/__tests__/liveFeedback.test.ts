import { describe, expect, it } from "vitest";
import { computeLiveFeedback } from "../liveFeedback";
import type { PlannerBox, ProtocolTarget, ProtocolTolerance } from "@/features/planner/types/planner";

const target: ProtocolTarget = {
  center: { x: 0, y: 0, z: 0 },
  size: { x: 0.8, y: 0.7, z: 0.5 },
  rotation: { rx: 0, ry: 0, rz: 0 },
  params: { TR: 3000 },
};

const tolerances: ProtocolTolerance = {
  center: 0.2,
  size: 0.2,
  rotation: 15,
  param: 0.2,
};

describe("computeLiveFeedback", () => {
  it('returns "looks good" when box matches target', () => {
    const box: PlannerBox = {
      center: { x: 0, y: 0, z: 0 },
      size: { x: 0.8, y: 0.7, z: 0.5 },
      rotation: { rx: 0, ry: 0, rz: 0 },
    };
    const hints = computeLiveFeedback(box, target, tolerances);
    expect(hints).toContain("Planning looks good");
  });

  it("returns position hints when box is off-center", () => {
    const box: PlannerBox = {
      center: { x: 0.5, y: 0, z: 0 },
      size: { x: 0.8, y: 0.7, z: 0.5 },
      rotation: { rx: 0, ry: 0, rz: 0 },
    };
    const hints = computeLiveFeedback(box, target, tolerances);
    expect(hints.some((h) => h.includes("left"))).toBe(true);
  });

  it("returns coverage hints when size differs", () => {
    const box: PlannerBox = {
      center: { x: 0, y: 0, z: 0 },
      size: { x: 0.3, y: 0.3, z: 0.2 },
      rotation: { rx: 0, ry: 0, rz: 0 },
    };
    const hints = computeLiveFeedback(box, target, tolerances);
    expect(hints.some((h) => h.includes("coverage"))).toBe(true);
  });

  it("limits hints to 3", () => {
    const box: PlannerBox = {
      center: { x: 0.9, y: -0.9, z: 0.9 },
      size: { x: 0.2, y: 0.2, z: 0.2 },
      rotation: { rx: 40, ry: 40, rz: 40 },
    };
    const hints = computeLiveFeedback(box, target, tolerances);
    expect(hints.length).toBeLessThanOrEqual(3);
  });
});
