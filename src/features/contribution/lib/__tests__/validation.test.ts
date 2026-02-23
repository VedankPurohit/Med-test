import { describe, expect, it } from "vitest";
import { validateContributionDraft } from "@/features/contribution/lib/validation";
import { ContributionDraft } from "@/features/contribution/types";

const pngBytes = new Uint8Array([137, 80, 78, 71]);

const makeDraft = (): ContributionDraft => ({
  createdAt: "2026-02-23T00:00:00.000Z",
  anatomy: { primaryType: "brain" },
  views: {
    axial: {
      fileName: "axial.png",
      mimeType: "image/png",
      sizeBytes: pngBytes.length,
      dataUrl: "data:image/png;base64,AAAA",
      bytes: pngBytes
    },
    sagittal: {
      fileName: "sagittal.png",
      mimeType: "image/png",
      sizeBytes: pngBytes.length,
      dataUrl: "data:image/png;base64,BBBB",
      bytes: pngBytes
    },
    coronal: {
      fileName: "coronal.png",
      mimeType: "image/png",
      sizeBytes: pngBytes.length,
      dataUrl: "data:image/png;base64,CCCC",
      bytes: pngBytes
    }
  },
  protocols: [
    {
      id: "brain_ax_t2",
      label: "Brain Ax T2",
      origin: "custom",
      parameterSpecs: [
        { key: "TR", label: "TR", min: 1000, max: 9000, step: 10 },
        { key: "TE", label: "TE", min: 10, max: 200, step: 1 }
      ],
      parameterValues: { TR: 4500, TE: 100 }
    }
  ],
  placements: {
    brain_ax_t2: {
      box: {
        center: { x: 0, y: 0, z: 0 },
        size: { x: 0.6, y: 0.7, z: 0.5 },
        rotation: { rx: 2, ry: 1, rz: -3 }
      },
      params: { TR: 4500, TE: 100 },
      boxRenderMode: "flat2d"
    }
  }
});

describe("validateContributionDraft", () => {
  it("passes a valid draft", () => {
    expect(validateContributionDraft(makeDraft())).toEqual([]);
  });

  it("requires custom anatomy text when type is other", () => {
    const draft = makeDraft();
    draft.anatomy = { primaryType: "other" };

    const issues = validateContributionDraft(draft);
    expect(issues.some((issue) => issue.code === "ANATOMY_CUSTOM_REQUIRED")).toBe(true);
  });

  it("requires all three views", () => {
    const draft = makeDraft();
    draft.views.coronal = null;

    const issues = validateContributionDraft(draft);
    expect(issues.some((issue) => issue.code === "VIEW_REQUIRED" && issue.field === "views.coronal")).toBe(true);
  });

  it("flags duplicate protocol ids", () => {
    const draft = makeDraft();
    draft.protocols.push({ ...draft.protocols[0] });

    const issues = validateContributionDraft(draft);
    expect(issues.some((issue) => issue.code === "PROTOCOL_ID_DUPLICATE")).toBe(true);
  });

  it("flags out-of-range parameter values", () => {
    const draft = makeDraft();
    draft.protocols[0].parameterValues.TR = 20;

    const issues = validateContributionDraft(draft);
    expect(issues.some((issue) => issue.code === "PROTOCOL_PARAM_OUT_OF_RANGE")).toBe(true);
  });

  it("requires placement for each selected protocol", () => {
    const draft = makeDraft();
    draft.placements = {};

    const issues = validateContributionDraft(draft);
    expect(issues.some((issue) => issue.code === "PLACEMENT_REQUIRED")).toBe(true);
  });
});
