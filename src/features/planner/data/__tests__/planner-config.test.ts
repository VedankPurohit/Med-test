import { describe, expect, it } from "vitest";
import { CASE_MAP, CASES } from "@/features/planner/data/planner-config";
import { BRAIN_PROTOCOLS } from "@/features/planner/data/protocols/brain";
import { CSPINE_PROTOCOLS } from "@/features/planner/data/protocols/cspine";
import { TSPINE_PROTOCOLS } from "@/features/planner/data/protocols/tspine";
import { LSPINE_PROTOCOLS } from "@/features/planner/data/protocols/lspine";
import { validateProtocolConfig } from "@/features/planner/lib/validation";

describe("planner config", () => {
  it("maps case IDs to case configs", () => {
    expect(CASES.length).toBe(4);
    expect(CASE_MAP.brain.id).toBe("brain");
    expect(CASE_MAP.cspine.id).toBe("cspine");
    expect(CASE_MAP.tspine.id).toBe("tspine");
    expect(CASE_MAP.lspine.id).toBe("lspine");
  });

  it("wires modular protocol lists into cases", () => {
    expect(CASE_MAP.brain.protocols).toBe(BRAIN_PROTOCOLS);
    expect(CASE_MAP.cspine.protocols).toBe(CSPINE_PROTOCOLS);
    expect(CASE_MAP.tspine.protocols).toBe(TSPINE_PROTOCOLS);
    expect(CASE_MAP.lspine.protocols).toBe(LSPINE_PROTOCOLS);
  });

  it("uses default localizer paths for each case", () => {
    expect(CASE_MAP.brain.localizerSets[0].views.axial).toBe("/localizers/brain/default/axial.png");
    expect(CASE_MAP.brain.localizerSets[0].views.sagittal).toBe("/localizers/brain/default/sagittal.png");
    expect(CASE_MAP.brain.localizerSets[0].views.coronal).toBe("/localizers/brain/default/coronal.png");
    expect(CASE_MAP.cspine.localizerSets[0].views.axial).toBe("/localizers/cspine/default/axial.png");
    expect(CASE_MAP.tspine.localizerSets[0].views.axial).toBe("/localizers/tspine/default/axial.png");
    expect(CASE_MAP.lspine.localizerSets[0].views.axial).toBe("/localizers/lspine/default/axial.png");
  });

  it("validates all protocol definitions", () => {
    for (const caseConfig of CASES) {
      for (const protocol of caseConfig.protocols) {
        expect(validateProtocolConfig(protocol)).toEqual([]);
      }
    }
  });
});
