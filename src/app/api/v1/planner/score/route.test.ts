import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/planner/score/route";

const makeRequestBody = () => ({
  caseId: "brain",
  protocolId: "brain_t2_axial",
  box: {
    center: { x: 0, y: 0, z: 0 },
    size: { x: 0.6, y: 0.6, z: 0.6 },
    rotation: { rx: 0, ry: 0, rz: 0 }
  },
  params: {
    TR: 4800,
    TE: 95,
    FOV: 240,
    Slices: 24,
    SliceThickness: 5,
    SliceGap: 0.5
  }
});

describe("POST /api/v1/planner/score", () => {
  it("returns score payload for valid request", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/planner/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(makeRequestBody())
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.revealTarget).toBe(true);
    expect(data.score.protocolId).toBe("brain_t2_axial");
    expect(Array.isArray(data.score.findings)).toBe(true);
  });

  it("rejects invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/planner/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bad: "payload" })
      })
    );

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.code).toBe("INVALID_PAYLOAD");
  });
});
