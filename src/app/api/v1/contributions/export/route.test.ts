import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { POST } from "@/app/api/v1/contributions/export/route";

const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);

const makePayload = (overrides?: Partial<Record<string, unknown>>) =>
  JSON.stringify({
    createdAt: "2026-02-23T00:00:00.000Z",
    sourceAppVersion: "0.1.0",
    phiAttestation: true,
    anatomy: { primaryType: "brain" },
    protocols: [
      {
        id: "brain_t2_axial",
        label: "Brain T2 Axial",
        origin: "existing",
        sourcePlannerCaseId: "brain",
        sourcePlannerProtocolId: "brain_t2_axial",
        parameterSpecs: [{ key: "TR", label: "TR", min: 1000, max: 8000, step: 10 }],
        parameterValues: { TR: 4800 }
      }
    ],
    placements: {
      brain_t2_axial: {
        box: {
          center: { x: 0, y: 0, z: 0 },
          size: { x: 0.6, y: 0.7, z: 0.5 },
          rotation: { rx: 1, ry: 2, rz: 3 }
        },
        params: { TR: 4800 },
        boxRenderMode: "flat2d"
      }
    },
    ...overrides
  });

const buildRequest = (payload = makePayload(), fileType = "image/png") => {
  const formData = new FormData();
  formData.append("payload", payload);
  formData.append("axial", new File([PNG_BYTES], "axial.png", { type: fileType }));
  formData.append("sagittal", new File([PNG_BYTES], "sagittal.png", { type: fileType }));
  formData.append("coronal", new File([PNG_BYTES], "coronal.png", { type: fileType }));

  return new Request("http://localhost/api/v1/contributions/export", {
    method: "POST",
    body: formData,
    headers: {
      "x-forwarded-for": "198.51.100.5"
    }
  });
};

describe("POST /api/v1/contributions/export", () => {
  it("returns zip bytes for valid request", async () => {
    const response = await POST(buildRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");

    const zipBytes = new Uint8Array(await response.arrayBuffer());
    const zip = await JSZip.loadAsync(zipBytes);
    expect(zip.file("manifest.json")).toBeTruthy();
    expect(zip.file("images/axial.png")).toBeTruthy();
  });

  it("rejects missing attestation", async () => {
    const response = await POST(buildRequest(makePayload({ phiAttestation: false })));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe("PHI_ATTESTATION_REQUIRED");
  });

  it("rejects unsupported image mime type", async () => {
    const response = await POST(buildRequest(makePayload(), "image/gif"));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe("INVALID_VIEW_FILE");
  });

  it("rejects invalid payload", async () => {
    const response = await POST(buildRequest("{bad-json"));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe("INVALID_PAYLOAD");
  });
});

