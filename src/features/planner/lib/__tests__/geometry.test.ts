import { describe, expect, it } from "vitest";
import {
  angleDiff,
  clamp,
  getProjectedGeometry,
  pointInPolygon,
  pointerToNorm,
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

  it("computes squared distance and wrapped angle difference", () => {
    expect(squaredDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
    expect(angleDiff(5, 355)).toBe(10);
    expect(angleDiff(350, 10)).toBe(20);
  });
});
