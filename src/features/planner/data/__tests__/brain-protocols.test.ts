import { describe, expect, it } from "vitest";
import { BRAIN_PROTOCOLS } from "@/features/planner/data/protocols/brain";

const REQUIRED_PROTOCOL_IDS = [
  "brain_t1_sagittal",
  "brain_t2_axial",
  "brain_t2_flair_axial",
  "brain_dwi_axial"
] as const;

describe("brain protocols", () => {
  it("contains the required core protocol set", () => {
    const ids = BRAIN_PROTOCOLS.map((protocol) => protocol.id);
    expect(ids).toEqual([...REQUIRED_PROTOCOL_IDS]);
  });

  it("uses unique IDs and non-empty labels", () => {
    const ids = BRAIN_PROTOCOLS.map((protocol) => protocol.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const protocol of BRAIN_PROTOCOLS) {
      expect(protocol.label.trim().length).toBeGreaterThan(0);
      expect(protocol.parameterSpecs.length).toBeGreaterThan(0);
      expect(protocol.teaching?.purpose?.trim().length).toBeGreaterThan(0);
      expect(protocol.teaching?.planningHint?.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps target and initial geometry inside planner bounds", () => {
    for (const protocol of BRAIN_PROTOCOLS) {
      const geometries = [protocol.target, protocol.initial];
      for (const geometry of geometries) {
        expect(geometry.center.x).toBeGreaterThanOrEqual(-1);
        expect(geometry.center.x).toBeLessThanOrEqual(1);
        expect(geometry.center.y).toBeGreaterThanOrEqual(-1);
        expect(geometry.center.y).toBeLessThanOrEqual(1);
        expect(geometry.center.z).toBeGreaterThanOrEqual(-1);
        expect(geometry.center.z).toBeLessThanOrEqual(1);

        expect(geometry.size.x).toBeGreaterThanOrEqual(0.2);
        expect(geometry.size.x).toBeLessThanOrEqual(1.8);
        expect(geometry.size.y).toBeGreaterThanOrEqual(0.2);
        expect(geometry.size.y).toBeLessThanOrEqual(1.8);
        expect(geometry.size.z).toBeGreaterThanOrEqual(0.2);
        expect(geometry.size.z).toBeLessThanOrEqual(1.8);

        expect(geometry.rotation.rx).toBeGreaterThanOrEqual(-45);
        expect(geometry.rotation.rx).toBeLessThanOrEqual(45);
        expect(geometry.rotation.ry).toBeGreaterThanOrEqual(-45);
        expect(geometry.rotation.ry).toBeLessThanOrEqual(45);
        expect(geometry.rotation.rz).toBeGreaterThanOrEqual(-45);
        expect(geometry.rotation.rz).toBeLessThanOrEqual(45);
      }
    }
  });

  it("keeps parameter values clinically sane for current model", () => {
    for (const protocol of BRAIN_PROTOCOLS) {
      const p = protocol.target.params;
      expect(p.TR).toBeGreaterThan(0);
      expect(p.TE).toBeGreaterThan(0);
      expect(p.FOV).toBeGreaterThanOrEqual(180);
      expect(p.FOV).toBeLessThanOrEqual(300);
      expect(p.Slices).toBeGreaterThanOrEqual(8);
      expect(p.SliceThickness).toBeGreaterThan(0);
      expect(p.SliceGap).toBeGreaterThanOrEqual(0);
      expect(p.TR).toBeGreaterThanOrEqual(p.TE);
    }

    const flair = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_t2_flair_axial");
    expect(flair?.target.params.TR).toBeGreaterThanOrEqual(7000);

    const dwi = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_dwi_axial");
    expect(dwi?.target.params.TE).toBeGreaterThanOrEqual(60);
    expect(dwi?.target.params.SliceGap).toBeLessThanOrEqual(0.5);

    const flairWithTi = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_t2_flair_axial");
    expect(flairWithTi?.target.params.TI).toBeGreaterThanOrEqual(1500);

    const dwiWithBValue = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_dwi_axial");
    expect(dwiWithBValue?.target.params.bValue).toBeGreaterThanOrEqual(800);
  });
});
