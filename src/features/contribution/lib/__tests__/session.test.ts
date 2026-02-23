import { describe, expect, it } from "vitest";
import {
  createPlacementMap,
  getPlacementForProtocol,
  savePlacementSnapshot
} from "@/features/contribution/lib/session";
import { ContributionPlacement } from "@/features/contribution/types";

const makePlacement = (x: number): ContributionPlacement => ({
  box: {
    center: { x, y: x, z: x },
    size: { x: 0.6, y: 0.6, z: 0.6 },
    rotation: { rx: 1, ry: 2, rz: 3 }
  },
  params: { TR: 4000 + x, TE: 100 },
  boxRenderMode: "flat2d"
});

describe("contribution placement session", () => {
  it("initializes placement map for protocol ids", () => {
    const map = createPlacementMap(["p1", "p2"]);
    expect(Object.keys(map)).toEqual(["p1", "p2"]);
    expect(map.p1).not.toBeNull();
  });

  it("saves active protocol placement snapshot", () => {
    const initial = createPlacementMap(["p1"]);
    const next = savePlacementSnapshot(initial, {
      protocolId: "p1",
      placement: makePlacement(0.4)
    });

    expect(next).not.toBe(initial);
    expect(next.p1?.box.center.x).toBe(0.4);
  });

  it("returns original map when snapshot is incomplete", () => {
    const initial = createPlacementMap(["p1"]);
    const next = savePlacementSnapshot(initial, {
      protocolId: null,
      placement: makePlacement(0.2)
    });

    expect(next).toBe(initial);
  });

  it("restores deep clone for protocol placement", () => {
    const map = savePlacementSnapshot(createPlacementMap(["p1"]), {
      protocolId: "p1",
      placement: makePlacement(0.3)
    });

    const restored = getPlacementForProtocol(map, "p1");
    if (!restored) {
      throw new Error("Expected placement");
    }

    restored.box.center.x = 99;

    const reloaded = getPlacementForProtocol(map, "p1");
    expect(reloaded?.box.center.x).toBe(0.3);
  });
});
