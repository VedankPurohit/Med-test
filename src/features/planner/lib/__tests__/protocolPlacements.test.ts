import { describe, expect, it } from "vitest";
import {
  getSavedPlacement,
  placementKey,
  savePlacementSnapshot,
  type PlacementMap
} from "@/features/planner/lib/protocolPlacements";
import { type PlannerBox, type PlannerParams, type PlannerScore } from "@/features/planner/types/planner";

const makeBox = (x = 0): PlannerBox => ({
  center: { x, y: x, z: x },
  size: { x: 0.6, y: 0.7, z: 0.8 },
  rotation: { rx: 1, ry: 2, rz: 3 }
});

const makeParams = (TR = 3000): PlannerParams => ({
  TR,
  TE: 80,
  FOV: 220,
  Slices: 24,
  SliceThickness: 4,
  SliceGap: 0.4
});

const makeScore = (protocolId: string): PlannerScore => ({
  scoreSchemaVersion: 2,
  timestamp: "2026-01-01T00:00:00.000Z",
  caseId: "brain",
  protocolId,
  calibratedTargetUsed: false,
  matchedTargetIndex: 0,
  matchedTargetKind: "primary",
  finalScorePercent: 88,
  pass: true,
  feedback: [],
  findings: [],
  componentScores: {
    positionPercent: 90,
    coveragePercent: 85,
    angulationPercent: 87,
    parametersPercent: 89
  },
  rawErrors: {
    center: 0.1,
    size: 0.1,
    rotationDegreesMean: 2,
    paramRelativeMean: 0.05,
    perParamRelative: { TR: 0.03 }
  },
  target: {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 1, y: 1, z: 1 },
    rotation: { rx: 0, ry: 0, rz: 0 },
    params: makeParams()
  },
  attempt: {
    box: makeBox(),
    params: makeParams()
  }
});

describe("protocolPlacements", () => {
  it("builds stable case+protocol keys", () => {
    expect(placementKey("brain", "brain_t2_axial")).toBe("[\"brain\",\"brain_t2_axial\"]");
  });

  it("serializes protocol ids with special and unicode characters safely", () => {
    const quoted = placementKey("brain", "proto\"with\"quotes");
    const slashed = placementKey("brain", "proto/with/slashes");
    const unicode = placementKey("brain", "脳-プロトコル-α");

    expect(quoted).toBe("[\"brain\",\"proto\\\"with\\\"quotes\"]");
    expect(slashed).toBe("[\"brain\",\"proto/with/slashes\"]");
    expect(unicode).toBe("[\"brain\",\"脳-プロトコル-α\"]");
    expect(quoted).not.toBe(slashed);
    expect(slashed).not.toBe(unicode);
  });

  it("keeps very long protocol ids collision-safe", () => {
    const longA = `proto-${"a".repeat(512)}`;
    const longB = `proto-${"a".repeat(511)}b`;
    expect(placementKey("brain", longA)).not.toBe(placementKey("brain", longB));
  });

  it("returns same map when snapshot is incomplete", () => {
    const current: PlacementMap = {};
    const next = savePlacementSnapshot(current, {
      caseId: "brain",
      protocolId: "brain_t2_axial",
      box: null,
      params: makeParams(),
      lastScore: null
    });
    expect(next).toBe(current);
  });

  it("saves and clones placement snapshots", () => {
    const box = makeBox(0.2);
    const params = makeParams(4200);
    const score = makeScore("brain_t2_axial");

    const placements = savePlacementSnapshot({}, {
      caseId: "brain",
      protocolId: "brain_t2_axial",
      box,
      params,
      lastScore: score
    });

    box.center.x = 99;
    params.TR = 1;
    score.finalScorePercent = 5;

    const saved = placements[placementKey("brain", "brain_t2_axial")];
    expect(saved.box.center.x).toBe(0.2);
    expect(saved.params.TR).toBe(4200);
    expect(saved.lastScore?.finalScorePercent).toBe(88);
  });

  it("skips saving when protocol matches skipProtocolId", () => {
    const placements = savePlacementSnapshot({}, {
      caseId: "brain",
      protocolId: "brain_t2_axial",
      box: makeBox(),
      params: makeParams(),
      lastScore: null
    }, { skipProtocolId: "brain_t2_axial" });

    expect(placements).toEqual({});
  });

  it("restores saved placement as a deep clone", () => {
    const placements = savePlacementSnapshot({}, {
      caseId: "brain",
      protocolId: "brain_t2_axial",
      box: makeBox(0.4),
      params: makeParams(3600),
      lastScore: makeScore("brain_t2_axial")
    });

    const restored = getSavedPlacement(placements, "brain", "brain_t2_axial");
    if (!restored) {
      throw new Error("Expected a saved placement.");
    }
    restored.box.center.x = -0.7;
    restored.params.TR = 999;

    const reloaded = getSavedPlacement(placements, "brain", "brain_t2_axial");
    expect(reloaded?.box.center.x).toBe(0.4);
    expect(reloaded?.params.TR).toBe(3600);
  });
});
