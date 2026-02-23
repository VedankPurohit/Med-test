import { describe, expect, it } from "vitest";
import { buildContributionManifest, slugifyId } from "@/features/contribution/lib/manifest";
import { ContributionDraft } from "@/features/contribution/types";

const bytes = new Uint8Array([1, 2, 3]);

const makeDraft = (): ContributionDraft => ({
  createdAt: "2026-02-23T00:00:00.000Z",
  anatomy: { primaryType: "brain" },
  views: {
    axial: { fileName: "a.png", mimeType: "image/png", sizeBytes: 3, dataUrl: "data:image/png;base64,AA", bytes },
    sagittal: { fileName: "s.jpg", mimeType: "image/jpeg", sizeBytes: 3, dataUrl: "data:image/jpeg;base64,BB", bytes },
    coronal: { fileName: "c.webp", mimeType: "image/webp", sizeBytes: 3, dataUrl: "data:image/webp;base64,CC", bytes }
  },
  protocols: [
    {
      id: "brain t2 axial",
      label: "Brain T2 Axial",
      origin: "custom",
      parameterSpecs: [{ key: "TR", label: "TR", min: 1000, max: 8000, step: 10 }],
      parameterValues: { TR: 4000 }
    },
    {
      id: "brain-flair",
      label: "Brain FLAIR",
      origin: "existing",
      sourcePlannerCaseId: "brain",
      sourcePlannerProtocolId: "brain_t2_flair_axial",
      parameterSpecs: [{ key: "TR", label: "TR", min: 1000, max: 10000, step: 10 }],
      parameterValues: { TR: 9000 }
    }
  ],
  placements: {
    "brain t2 axial": {
      box: {
        center: { x: 0, y: 0, z: 0 },
        size: { x: 0.6, y: 0.6, z: 0.6 },
        rotation: { rx: 0, ry: 0, rz: 0 }
      },
      params: { TR: 4000 },
      boxRenderMode: "flat2d"
    },
    "brain-flair": {
      box: {
        center: { x: 0.2, y: 0.1, z: -0.1 },
        size: { x: 0.7, y: 0.5, z: 0.4 },
        rotation: { rx: 3, ry: 2, rz: 1 }
      },
      params: { TR: 9000 },
      boxRenderMode: "cube3d"
    }
  }
});

describe("buildContributionManifest", () => {
  it("builds versioned manifest with all selected protocols", () => {
    const manifest = buildContributionManifest(makeDraft(), {
      sourceAppVersion: "0.1.0",
      createdAt: "2026-02-23T12:00:00.000Z"
    });

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.protocols).toHaveLength(2);
    expect(manifest.exportMeta.protocolCount).toBe(2);
    expect(manifest.views.axial.zipPath).toBe("images/axial.png");
    expect(manifest.views.sagittal.zipPath).toBe("images/sagittal.jpg");
    expect(manifest.views.coronal.zipPath).toBe("images/coronal.webp");
    expect(manifest.protocols[0].placementZipPath).toBe("protocols/01-brain-t2-axial/placement.json");
    expect(manifest.protocols[1].placementZipPath).toBe("protocols/02-brain-flair/placement.json");
  });

  it("slugifies protocol ids safely", () => {
    expect(slugifyId(" Brain T2 Axial ")).toBe("brain-t2-axial");
    expect(slugifyId("***")).toBe("protocol");
    expect(slugifyId("cspine/t2+ax")).toBe("cspine-t2-ax");
  });

  it("throws when required views are missing", () => {
    const draft = makeDraft();
    draft.views.axial = null;

    expect(() => buildContributionManifest(draft, { sourceAppVersion: "0.1.0" })).toThrow(/Missing required image/);
  });

  it("builds unique placement paths when protocol slugs collide", () => {
    const draft = makeDraft();
    draft.protocols = [
      {
        ...draft.protocols[0],
        id: "T1 Ax"
      },
      {
        ...draft.protocols[1],
        id: "t1-ax"
      }
    ];
    draft.placements = {
      "T1 Ax": draft.placements["brain t2 axial"],
      "t1-ax": draft.placements["brain-flair"]
    };

    const manifest = buildContributionManifest(draft, { sourceAppVersion: "0.1.0" });
    expect(manifest.protocols[0].placementZipPath).toBe("protocols/01-t1-ax/placement.json");
    expect(manifest.protocols[1].placementZipPath).toBe("protocols/02-t1-ax-2/placement.json");
  });
});
