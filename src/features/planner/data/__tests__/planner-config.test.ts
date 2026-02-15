import { describe, expect, it } from "vitest";
import { CASE_MAP, CASES } from "@/features/planner/data/planner-config";
import { BRAIN_PROTOCOLS } from "@/features/planner/data/protocols/brain";
import { SPINE_PROTOCOLS } from "@/features/planner/data/protocols/spine";

describe("planner config", () => {
  it("maps case IDs to case configs", () => {
    expect(CASES.length).toBe(2);
    expect(CASE_MAP.brain.id).toBe("brain");
    expect(CASE_MAP.spine.id).toBe("spine");
  });

  it("wires modular protocol lists into cases", () => {
    expect(CASE_MAP.brain.protocols).toBe(BRAIN_PROTOCOLS);
    expect(CASE_MAP.spine.protocols).toBe(SPINE_PROTOCOLS);
  });

  it("uses default localizer paths for each case", () => {
    expect(CASE_MAP.brain.localizerSets[0].views.axial).toBe("/localizers/brain/default/axial.png");
    expect(CASE_MAP.brain.localizerSets[0].views.sagittal).toBe("/localizers/brain/default/sagittal.png");
    expect(CASE_MAP.brain.localizerSets[0].views.coronal).toBe("/localizers/brain/default/coronal.png");
    expect(CASE_MAP.spine.localizerSets[0].views.axial).toBe("/localizers/spine/default/axial.png");
  });
});
