import { describe, expect, it } from "vitest";
import { placementKey, type PlacementMap } from "@/features/planner/lib/protocolPlacements";
import { type PlannerScore } from "@/features/planner/types/planner";
import { buildExamSubmissionSummary, haveVisitedAllSelectedProtocols } from "@/features/workstation/lib/examSummary";
import { type ProtocolListItem } from "@/features/workstation/types/workstation";

const makeScore = (protocolId: string, finalScorePercent: number, pass: boolean): PlannerScore => ({
  scoreSchemaVersion: 2,
  timestamp: "2026-02-23T08:00:00.000Z",
  caseId: "brain",
  protocolId,
  calibratedTargetUsed: false,
  matchedTargetIndex: 0,
  matchedTargetKind: "primary",
  finalScorePercent,
  pass,
  feedback: pass ? ["Good alignment."] : ["Re-center on anatomy."],
  componentScores: {
    positionPercent: finalScorePercent,
    coveragePercent: finalScorePercent,
    angulationPercent: finalScorePercent,
    parametersPercent: finalScorePercent
  },
  rawErrors: {
    center: 0.1,
    size: 0.1,
    rotationDegreesMean: 2,
    paramRelativeMean: 0.1,
    perParamRelative: {}
  },
  target: {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 1, y: 1, z: 1 },
    rotation: { rx: 0, ry: 0, rz: 0 },
    params: { TR: 3000, TE: 90, FOV: 220, Slices: 24, SliceThickness: 4, SliceGap: 0.4 }
  },
  attempt: {
    box: {
      center: { x: 0, y: 0, z: 0 },
      size: { x: 1, y: 1, z: 1 },
      rotation: { rx: 0, ry: 0, rz: 0 }
    },
    params: { TR: 3000, TE: 90, FOV: 220, Slices: 24, SliceThickness: 4, SliceGap: 0.4 }
  }
});

describe("examSummary", () => {
  it("detects when not all selected protocols were visited", () => {
    const protocols: ProtocolListItem[] = [
      {
        protocolId: "axial-t2-tse",
        label: "Ax T2 TSE",
        shortName: "Ax T2",
        orientation: "TRA",
        region: "brain",
        status: "pending"
      },
      {
        protocolId: "axial-dwi",
        label: "Ax DWI",
        shortName: "Ax DWI",
        orientation: "TRA",
        region: "brain",
        status: "active"
      }
    ];
    expect(haveVisitedAllSelectedProtocols(protocols)).toBe(false);
  });

  it("builds summary with per-protocol score and aggregate metrics", () => {
    const protocols: ProtocolListItem[] = [
      {
        protocolId: "axial-t2-tse",
        label: "Ax T2 TSE",
        shortName: "Ax T2",
        orientation: "TRA",
        region: "brain",
        status: "completed"
      },
      {
        protocolId: "axial-dwi",
        label: "Ax DWI",
        shortName: "Ax DWI",
        orientation: "TRA",
        region: "brain",
        status: "active"
      }
    ];

    const placements: PlacementMap = {
      [placementKey("brain", "brain_t2_axial")]: {
        box: {
          center: { x: 0, y: 0, z: 0 },
          size: { x: 1, y: 1, z: 1 },
          rotation: { rx: 0, ry: 0, rz: 0 }
        },
        params: { TR: 3000, TE: 90, FOV: 220, Slices: 24, SliceThickness: 4, SliceGap: 0.4 },
        lastScore: makeScore("brain_t2_axial", 88, true)
      },
      [placementKey("brain", "brain_dwi_axial")]: {
        box: {
          center: { x: 0, y: 0, z: 0 },
          size: { x: 1, y: 1, z: 1 },
          rotation: { rx: 0, ry: 0, rz: 0 }
        },
        params: { TR: 3000, TE: 90, FOV: 220, Slices: 24, SliceThickness: 4, SliceGap: 0.4 },
        lastScore: makeScore("brain_dwi_axial", 62, false)
      }
    };

    const summary = buildExamSubmissionSummary(protocols, placements);
    expect(summary.totalProtocols).toBe(2);
    expect(summary.visitedProtocols).toBe(2);
    expect(summary.scoredProtocols).toBe(2);
    expect(summary.passedProtocols).toBe(1);
    expect(summary.averageScorePercent).toBe(75);
    expect(summary.allVisited).toBe(true);
    expect(summary.protocols[0].scorePercent).toBe(88);
    expect(summary.protocols[1].scorePercent).toBe(62);
  });

  it("marks unmapped protocols explicitly", () => {
    const protocols: ProtocolListItem[] = [
      {
        protocolId: "sella-cor-t2",
        label: "Cor T2 TSE (Sella)",
        shortName: "Cor T2",
        orientation: "COR",
        region: "brain",
        status: "completed"
      }
    ];

    const summary = buildExamSubmissionSummary(protocols, {});
    expect(summary.protocols).toHaveLength(1);
    expect(summary.protocols[0].mapped).toBe(false);
    expect(summary.protocols[0].feedback[0]).toContain("not mapped");
  });
});
