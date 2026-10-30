import { describe, expect, it } from "vitest";
import { BRAIN_PROTOCOLS } from "@/features/planner/data/protocols/brain";
import { STRUCTURAL_SPEC_KEYS } from "@/features/planner/types/planner";

const REQUIRED_PROTOCOL_IDS = [
  "brain_t1_sagittal",
  "brain_t2_axial",
  "brain_t1_axial_se",
  "brain_t2_flair_axial",
  "brain_dwi_axial",
  "brain_swi_axial",
  "brain_t1_se_coronal",
  "brain_t2_coronal",
  "brain_t1_axial_post"
] as const;

describe("brain protocols", () => {
  it("contains the required core protocol set", () => {
    const ids = BRAIN_PROTOCOLS.map((protocol) => protocol.id);
    expect(ids).toEqual(expect.arrayContaining([...REQUIRED_PROTOCOL_IDS]));
  });

  it("uses unique IDs and non-empty labels", () => {
    const ids = BRAIN_PROTOCOLS.map((protocol) => protocol.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const protocol of BRAIN_PROTOCOLS) {
      expect(protocol.label.trim().length).toBeGreaterThan(0);
      expect(protocol.parameterSpecs.length).toBeGreaterThan(0);
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

    const swi = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_swi_axial");
    expect(swi?.target.params.TR).toBeLessThanOrEqual(100);
    expect(swi?.target.params.SliceThickness).toBeLessThanOrEqual(2.5);

    const flairWithTi = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_t2_flair_axial");
    expect(flairWithTi?.target.params.TI).toBeGreaterThanOrEqual(1500);

    const dwiWithBValue = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_dwi_axial");
    expect(dwiWithBValue?.target.params.bValue).toBeGreaterThanOrEqual(800);
  });

  it("uses protocol-specific brain parameter sets instead of one global advanced panel", () => {
    for (const protocol of BRAIN_PROTOCOLS) {
      // Filter structural specs (e.g. SliceOrientation) — they're opt-in
      // and intentionally absent from target.params unless the user picks
      // a non-default orientation.
      const specKeys = protocol.parameterSpecs
        .map((spec) => String(spec.key))
        .filter((key) => !STRUCTURAL_SPEC_KEYS.has(key));
      const targetKeys = Object.keys(protocol.target.params);

      expect(specKeys).toEqual(targetKeys);
      expect(specKeys).not.toContain("ScanTime");
    }

    const t1Sag = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_t1_sagittal")!;
    const t1SagKeys = t1Sag.parameterSpecs.map((spec) => String(spec.key));
    expect(t1SagKeys).not.toContain("ETL");
    expect(t1SagKeys).not.toContain("FlipAngle");
    expect(t1SagKeys).not.toContain("FatSuppression");
    expect(t1SagKeys).not.toContain("Bandwidth");

    const flair = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_t2_flair_axial")!;
    const flairKeys = flair.parameterSpecs.map((spec) => String(spec.key));
    expect(flairKeys).toContain("ETL");
    expect(flairKeys).toContain("TI");
    expect(flairKeys).not.toContain("FatSuppression");

    const dwi = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_dwi_axial")!;
    const dwiKeys = dwi.parameterSpecs.map((spec) => String(spec.key));
    expect(dwiKeys).toContain("bValue");
    expect(dwiKeys).toContain("Bandwidth");
    expect(dwiKeys).toContain("FatSuppression");
    expect(dwiKeys).not.toContain("ETL");

    const swi = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_swi_axial")!;
    const swiKeys = swi.parameterSpecs.map((spec) => String(spec.key));
    expect(swiKeys).toContain("FlipAngle");
    expect(swiKeys).toContain("Bandwidth");
    expect(swiKeys).not.toContain("ETL");
    expect(swiKeys).not.toContain("FatSuppression");

    const post = BRAIN_PROTOCOLS.find((protocol) => protocol.id === "brain_t1_axial_post")!;
    expect(post.parameterSpecs.map((spec) => String(spec.key))).toContain("FatSuppression");
  });
});
