import { describe, expect, it } from "vitest";
import {
  buildSubmissionSummaryResponse,
  parseBuildSubmissionSummaryRequest
} from "@/features/workstation/lib/summaryApi";
import { PlacementMap } from "@/features/planner/lib/protocolPlacements";
import { ProtocolListItem } from "@/features/workstation/types/workstation";

const protocols: ProtocolListItem[] = [
  {
    protocolId: "axial-t2-tse",
    label: "Brain T2 Axial",
    shortName: "T2 Ax",
    orientation: "AX",
    region: "brain",
    status: "completed"
  }
];

const placements: PlacementMap = {
  "[\"brain\",\"brain_t2_axial\"]": {
    box: {
      center: { x: 0, y: 0, z: 0 },
      size: { x: 0.6, y: 0.6, z: 0.6 },
      rotation: { rx: 0, ry: 0, rz: 0 }
    },
    params: {
      TR: 4800
    },
    lastScore: {
      scoreSchemaVersion: 2,
      timestamp: "2026-02-23T00:00:00.000Z",
      caseId: "brain",
      protocolId: "brain_t2_axial",
      calibratedTargetUsed: false,
      matchedTargetIndex: 0,
      matchedTargetKind: "primary",
      finalScorePercent: 82,
      pass: true,
      feedback: ["Good."],
      findings: [],
      componentScores: {
        positionPercent: 80,
        coveragePercent: 84,
        angulationPercent: 80,
        parametersPercent: 84
      },
      rawErrors: {
        center: 0.1,
        size: 0.1,
        rotationDegreesMean: 2,
        paramRelativeMean: 0.1,
        perParamRelative: { TR: 0.1 }
      },
      target: {
        center: { x: 0, y: 0, z: 0 },
        size: { x: 0.6, y: 0.6, z: 0.6 },
        rotation: { rx: 0, ry: 0, rz: 0 },
        params: { TR: 4800 }
      },
      attempt: {
        box: {
          center: { x: 0, y: 0, z: 0 },
          size: { x: 0.6, y: 0.6, z: 0.6 },
          rotation: { rx: 0, ry: 0, rz: 0 }
        },
        params: { TR: 4800 }
      }
    }
  }
};

describe("parseBuildSubmissionSummaryRequest", () => {
  it("accepts valid payload", () => {
    const parsed = parseBuildSubmissionSummaryRequest({ protocols, placements });
    expect(parsed.ok).toBe(true);
  });

  it("rejects invalid payload", () => {
    const parsed = parseBuildSubmissionSummaryRequest({ protocols: "bad", placements: {} });
    expect(parsed.ok).toBe(false);
  });
});

describe("buildSubmissionSummaryResponse", () => {
  it("returns summary and allow flag", () => {
    const response = buildSubmissionSummaryResponse({ protocols, placements });
    expect(response.allowSubmit).toBe(true);
    expect(response.summary.totalProtocols).toBe(1);
    expect(response.summary.passedProtocols).toBe(1);
  });
});
