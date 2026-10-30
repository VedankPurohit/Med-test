import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/workstation/submit/route";

const makeBody = () => ({
  protocols: [
    {
      protocolId: "axial-t2-tse",
      label: "Brain T2 Axial",
      shortName: "T2 Ax",
      orientation: "AX",
      region: "brain",
      status: "completed"
    }
  ],
  placements: {
    "[\"brain\",\"brain_t2_axial\"]": {
      box: {
        center: { x: 0, y: 0, z: 0 },
        size: { x: 0.6, y: 0.6, z: 0.6 },
        rotation: { rx: 0, ry: 0, rz: 0 }
      },
      params: { TR: 4800 },
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
  }
});

describe("POST /api/v1/workstation/submit", () => {
  it("returns summary for valid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/workstation/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(makeBody())
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.allowSubmit).toBe(true);
    expect(data.summary.totalProtocols).toBe(1);
  });

  it("rejects invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/workstation/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ protocols: "bad" })
      })
    );

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.code).toBe("INVALID_PAYLOAD");
  });
});
