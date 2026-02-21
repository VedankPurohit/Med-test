import { describe, expect, it } from "vitest";
import { TSPINE_PROTOCOLS } from "@/features/planner/data/protocols/tspine";

const REQUIRED_PROTOCOL_IDS = [
  "tspine_sag_t2"
] as const;

describe("thoracic spine protocols", () => {
  it("contains the required core protocol set", () => {
    const ids = TSPINE_PROTOCOLS.map((protocol) => protocol.id);
    expect(ids).toEqual(expect.arrayContaining([...REQUIRED_PROTOCOL_IDS]));
  });

  it("uses unique IDs and non-empty labels", () => {
    const ids = TSPINE_PROTOCOLS.map((protocol) => protocol.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const protocol of TSPINE_PROTOCOLS) {
      expect(protocol.label.trim().length).toBeGreaterThan(0);
      expect(protocol.parameterSpecs.length).toBeGreaterThan(0);
    }
  });

  it("keeps target and initial geometry inside planner bounds", () => {
    for (const protocol of TSPINE_PROTOCOLS) {
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

  it("keeps parameter values clinically sane", () => {
    for (const protocol of TSPINE_PROTOCOLS) {
      const p = protocol.target.params;
      expect(p.TR).toBeGreaterThan(0);
      expect(p.TE).toBeGreaterThan(0);
      expect(p.FOV).toBeGreaterThanOrEqual(180);
      expect(p.FOV).toBeLessThanOrEqual(500);
      expect(p.Slices).toBeGreaterThanOrEqual(8);
      expect(p.SliceThickness).toBeGreaterThan(0);
      expect(p.SliceGap).toBeGreaterThanOrEqual(0);
      expect(p.TR).toBeGreaterThanOrEqual(p.TE);
    }
  });

  it("has clinical notes on all protocols", () => {
    for (const protocol of TSPINE_PROTOCOLS) {
      expect(protocol.clinicalNotes).toBeDefined();
      expect(protocol.clinicalNotes!.length).toBeGreaterThanOrEqual(2);
      for (const note of protocol.clinicalNotes!) {
        expect(note.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
