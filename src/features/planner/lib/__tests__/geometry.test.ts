import { describe, expect, it } from "vitest";
import {
  angleDiff,
  clamp,
  getFlatGeometry,
  getProjectedGeometry,
  hitTestCube,
  hitTestFlat,
  pointInPolygon,
  pointerToNorm,
  pointToSegmentDistance,
  projectPoint,
  squaredDistance
} from "@/features/planner/lib/geometry";
import type { PlannerBox } from "@/features/planner/types/planner";

const baseBox: PlannerBox = {
  center: { x: 0, y: 0, z: 0 },
  size: { x: 0.8, y: 0.6, z: 0.4 },
  rotation: { rx: 0, ry: 0, rz: 0 }
};

describe("geometry core", () => {
  it("clamps numeric ranges", () => {
    expect(clamp(5, 0, 2)).toBe(2);
    expect(clamp(-1, 0, 2)).toBe(0);
    expect(clamp(1.2, 0, 2)).toBe(1.2);
  });

  it("projects points to expected view axes", () => {
    const p = { x: 0.2, y: -0.4, z: 0.9 };
    expect(projectPoint(p, "axial")).toEqual({ x: 0.2, y: -0.4 });
    expect(projectPoint(p, "sagittal")).toEqual({ x: -0.4, y: 0.9 });
    expect(projectPoint(p, "coronal")).toEqual({ x: 0.2, y: 0.9 });
  });

  it("maps pointer center to normalized origin", () => {
    const rect = {
      left: 10,
      top: 20,
      width: 320,
      height: 320
    } as DOMRect;

    const point = pointerToNorm(170, 180, rect, 320, 320);
    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(0, 6);
  });

  it("builds projected hull and hit-tests center", () => {
    const geometry = getProjectedGeometry(baseBox, "axial");
    expect(geometry.hull.length).toBeGreaterThanOrEqual(4);
    expect(pointInPolygon(geometry.center2D, geometry.hull)).toBe(true);

    const outside = { x: 0.95, y: 0.95 };
    expect(pointInPolygon(outside, geometry.hull)).toBe(false);
  });

  it("builds flat-view rectangle geometry", () => {
    const geometry = getFlatGeometry(baseBox, "axial");
    expect(geometry.projected.length).toBe(4);
    expect(geometry.hull.length).toBe(4);
    expect(geometry.center2D.x).toBeCloseTo(0, 6);
    expect(geometry.center2D.y).toBeCloseTo(0, 6);
  });

  it("computes squared distance and wrapped angle difference", () => {
    expect(squaredDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
    expect(angleDiff(5, 355)).toBe(10);
    expect(angleDiff(350, 10)).toBe(20);
  });
});

describe("pointToSegmentDistance", () => {
  it("returns zero for a point on the segment", () => {
    const result = pointToSegmentDistance({ x: 0.5, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(result.distance).toBeCloseTo(0, 6);
    expect(result.t).toBeCloseTo(0.5, 6);
  });

  it("returns perpendicular distance for point off segment", () => {
    const result = pointToSegmentDistance({ x: 0.5, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(result.distance).toBeCloseTo(1, 6);
    expect(result.t).toBeCloseTo(0.5, 6);
  });

  it("clamps to segment start", () => {
    const result = pointToSegmentDistance({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(result.distance).toBeCloseTo(1, 6);
    expect(result.t).toBe(0);
  });

  it("clamps to segment end", () => {
    const result = pointToSegmentDistance({ x: 2, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(result.distance).toBeCloseTo(1, 6);
    expect(result.t).toBe(1);
  });

  it("handles zero-length segment", () => {
    const result = pointToSegmentDistance({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 });
    expect(result.distance).toBeCloseTo(1, 6);
    expect(result.t).toBe(0);
  });
});

describe("hitTestFlat", () => {
  const centeredBox: PlannerBox = {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 0.6, y: 0.4, z: 0.4 },
    rotation: { rx: 0, ry: 0, rz: 0 }
  };

  it("detects corner hit", () => {
    // Corner 0 of flat axial box is at (-0.3, -0.2) with no rotation
    const result = hitTestFlat({ x: -0.3, y: -0.2 }, centeredBox, "axial");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("corner");
  });

  it("detects edge hit at midpoint", () => {
    // Edge 0 runs from corner0 (-0.3,-0.2) to corner1 (0.3,-0.2)
    // Midpoint is at (0, -0.2), slightly below to hit the edge band
    const result = hitTestFlat({ x: 0, y: -0.23 }, centeredBox, "axial");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("edge");
  });

  it("detects interior/move hit", () => {
    const result = hitTestFlat({ x: 0, y: 0 }, centeredBox, "axial");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("move");
  });

  it("detects rotation zone hit", () => {
    // Half-diagonal for axial: sqrt(0.3^2 + 0.2^2) ≈ 0.36
    // Rotation ring starts at 0.36 + 0.02 = 0.38
    const result = hitTestFlat({ x: 0.42, y: 0 }, centeredBox, "axial");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("rotate");
  });

  it("returns null for point far away", () => {
    const result = hitTestFlat({ x: 0.9, y: 0.9 }, centeredBox, "axial");
    expect(result).toBeNull();
  });
});

describe("hitTestCube", () => {
  const cubeBox: PlannerBox = {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 0.6, y: 0.4, z: 0.4 },
    rotation: { rx: 0, ry: 0, rz: 0 }
  };

  it("detects interior/move hit", () => {
    const result = hitTestCube({ x: 0, y: 0 }, cubeBox, "axial");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("move");
  });

  it("detects rotation zone hit", () => {
    // Hull max corner dist ≈ 0.36, ring is 0.38-0.48
    const result = hitTestCube({ x: 0.42, y: 0 }, cubeBox, "axial");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("rotate");
  });

  it("returns null for point far away", () => {
    const result = hitTestCube({ x: 0.95, y: 0.95 }, cubeBox, "axial");
    expect(result).toBeNull();
  });

  it("does not return corner or edge handles", () => {
    // Even near a corner, cube mode should only return move or rotate
    const result = hitTestCube({ x: 0.3, y: 0.2 }, cubeBox, "axial");
    if (result) {
      expect(result.kind === "move" || result.kind === "rotate").toBe(true);
    }
  });
});
