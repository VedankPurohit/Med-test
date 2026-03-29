import { describe, expect, it } from "vitest";
import { KNEE_PROTOCOLS } from "@/features/planner/data/protocols/knee";

const REQUIRED_PROTOCOL_IDS = [
  "knee_sag_pd",
  "knee_sag_t2_fs",
  "knee_cor_pd",
  "knee_ax_pd",
  "knee_cor_t1"
] as const;

describe("knee protocols", () => {
  it("contains the required core protocol set", () => {
    const ids = KNEE_PROTOCOLS.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining([...REQUIRED_PROTOCOL_IDS]));
  });

  it("uses unique IDs and non-empty labels", () => {
    const ids = KNEE_PROTOCOLS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const protocol of KNEE_PROTOCOLS) {
      expect(protocol.label.trim().length).toBeGreaterThan(0);
      expect(protocol.parameterSpecs.length).toBeGreaterThan(0);
    }
  });

  it("keeps target and initial geometry inside planner bounds", () => {
    for (const protocol of KNEE_PROTOCOLS) {
      for (const geometry of [protocol.target, protocol.initial]) {
        expect(geometry.center.x).toBeGreaterThanOrEqual(-1);
        expect(geometry.center.x).toBeLessThanOrEqual(1);
        expect(geometry.size.x).toBeGreaterThanOrEqual(0.2);
        expect(geometry.size.x).toBeLessThanOrEqual(1.8);
        expect(geometry.rotation.rx).toBeGreaterThanOrEqual(-95);
        expect(geometry.rotation.rx).toBeLessThanOrEqual(95);
      }
    }
  });

  it("keeps parameter values clinically sane for knee imaging", () => {
    for (const protocol of KNEE_PROTOCOLS) {
      const p = protocol.target.params;
      expect(p.TR).toBeGreaterThan(0);
      expect(p.TE).toBeGreaterThan(0);
      expect(p.FOV).toBeGreaterThanOrEqual(140);
      expect(p.FOV).toBeLessThanOrEqual(200);
      expect(p.Slices).toBeGreaterThanOrEqual(10);
      expect(p.SliceThickness).toBeGreaterThan(0);
      expect(p.SliceThickness).toBeLessThanOrEqual(5);
    }

    const t1 = KNEE_PROTOCOLS.find((p) => p.id === "knee_cor_t1");
    expect(t1?.target.params.TR).toBeLessThanOrEqual(800);

    const pd = KNEE_PROTOCOLS.find((p) => p.id === "knee_sag_pd");
    expect(pd?.target.params.TR).toBeGreaterThanOrEqual(2000);
  });

  it("has teaching content on all protocols", () => {
    for (const protocol of KNEE_PROTOCOLS) {
      expect(protocol.teaching).toBeDefined();
      expect(protocol.teaching!.purpose.trim().length).toBeGreaterThan(0);
      expect(protocol.teaching!.planningHint.trim().length).toBeGreaterThan(0);
      expect(protocol.teaching!.planningChecklist.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("has workflow order on all protocols", () => {
    for (const protocol of KNEE_PROTOCOLS) {
      expect(protocol.workflowOrder).toBeDefined();
      expect(protocol.workflowOrder).toBeGreaterThan(0);
    }
  });
});
