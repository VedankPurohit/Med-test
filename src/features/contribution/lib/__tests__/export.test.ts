import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildContributionZipBytes } from "@/features/contribution/lib/export";
import { buildContributionManifest } from "@/features/contribution/lib/manifest";
import { ContributionDraft } from "@/features/contribution/types";

const bytes = new Uint8Array([1, 2, 3, 4]);

const makeDraft = (): ContributionDraft => ({
  createdAt: "2026-02-23T00:00:00.000Z",
  anatomy: { primaryType: "brain" },
  views: {
    axial: { fileName: "axial.png", mimeType: "image/png", sizeBytes: 4, dataUrl: "data:image/png;base64,AAAA", bytes },
    sagittal: { fileName: "sagittal.png", mimeType: "image/png", sizeBytes: 4, dataUrl: "data:image/png;base64,BBBB", bytes },
    coronal: { fileName: "coronal.png", mimeType: "image/png", sizeBytes: 4, dataUrl: "data:image/png;base64,CCCC", bytes }
  },
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
  }
});

describe("buildContributionZipBytes", () => {
  it("packages manifest, images, and per-protocol placement files", async () => {
    const draft = makeDraft();
    const manifest = buildContributionManifest(draft, { sourceAppVersion: "0.1.0", createdAt: "2026-02-23T12:00:00.000Z" });

    const zipBytes = await buildContributionZipBytes(manifest, {
      axial: draft.views.axial!.bytes,
      sagittal: draft.views.sagittal!.bytes,
      coronal: draft.views.coronal!.bytes
    });

    const zip = await JSZip.loadAsync(zipBytes);
    const files = Object.keys(zip.files).sort();

    expect(files).toContain("manifest.json");
    expect(files).toContain("images/axial.png");
    expect(files).toContain("images/sagittal.png");
    expect(files).toContain("images/coronal.png");
    expect(files).toContain("protocols/brain-t2-axial/placement.json");

    const manifestText = await zip.file("manifest.json")!.async("string");
    expect(JSON.parse(manifestText).schemaVersion).toBe(1);
  });
});
