import { describe, expect, it } from "vitest";
import { LSPINE_PROTOCOLS } from "@/features/planner/data/protocols/lspine";

const REQUIRED_PROTOCOL_IDS = [
  "lspine_sag_t2",
  "lspine_sag_t1",
  "lspine_ax_t2",
  "lspine_sag_stir",
  "lspine_cor_stir"
] as const;

describe("lumbar spine protocols", () => {
  it("contains the required core protocol set", () => {
    const ids = LSPINE_PROTOCOLS.map((protocol) => protocol.id);
    expect(ids).toEqual(expect.arrayContaining([...REQUIRED_PROTOCOL_IDS]));
  });

  it("uses unique IDs and non-empty labels", () => {
    const ids = LSPINE_PROTOCOLS.map((protocol) => protocol.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const protocol of LSPINE_PROTOCOLS) {
      expect(protocol.label.trim().length).toBeGreaterThan(0);
      expect(protocol.parameterSpecs.length).toBeGreaterThan(0);
    }
  });

  it("keeps target and initial geometry inside planner bounds", () => {
    for (const protocol of LSPINE_PROTOCOLS) {
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
    for (const protocol of LSPINE_PROTOCOLS) {
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

  it("enforces T1 short TR and T2 long TR conventions", () => {
    const t1Protocols = LSPINE_PROTOCOLS.filter((p) => p.id.includes("_t1"));
    for (const protocol of t1Protocols) {
      expect(protocol.target.params.TR).toBeLessThanOrEqual(800);
    }

    const t2Protocols = LSPINE_PROTOCOLS.filter(
      (p) => p.id.includes("_t2") && !p.id.includes("stir")
    );
    for (const protocol of t2Protocols) {
      expect(protocol.target.params.TR).toBeGreaterThanOrEqual(3000);
    }
  });

  it("validates STIR protocols have TI in clinical range", () => {
    const stirProtocols = LSPINE_PROTOCOLS.filter((p) => p.id.includes("stir"));
    expect(stirProtocols.length).toBeGreaterThanOrEqual(2);

    for (const protocol of stirProtocols) {
      const ti = protocol.target.params.TI;
      expect(ti).toBeDefined();
      expect(ti).toBeGreaterThanOrEqual(100);
      expect(ti).toBeLessThanOrEqual(200);
    }
  });

  it("has clinical notes on all protocols", () => {
    for (const protocol of LSPINE_PROTOCOLS) {
      expect(protocol.clinicalNotes).toBeDefined();
      expect(protocol.clinicalNotes!.length).toBeGreaterThanOrEqual(2);
      for (const note of protocol.clinicalNotes!) {
        expect(note.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
