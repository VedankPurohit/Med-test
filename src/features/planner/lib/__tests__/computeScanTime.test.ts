import { describe, expect, it } from "vitest";
import { computeScanTime } from "@/features/planner/data/protocols/helpers";

describe("computeScanTime", () => {
  it("computes scan time for standard TSE sequence", () => {
    // TR=4800, MatrixPhase=256, NEX=2, ETL=15
    // Expected: (4800 * 256 * 2) / (15 * 1000) = 163.84 seconds
    const time = computeScanTime({ TR: 4800, MatrixPhase: 256, NEX: 2, ETL: 15 });
    expect(time).toBeCloseTo(163.84, 1);
  });

  it("computes scan time for conventional SE (ETL=1)", () => {
    // TR=600, MatrixPhase=192, NEX=1, ETL=1
    // Expected: (600 * 192 * 1) / (1 * 1000) = 115.2 seconds
    const time = computeScanTime({ TR: 600, MatrixPhase: 192, NEX: 1, ETL: 1 });
    expect(time).toBeCloseTo(115.2, 1);
  });

  it("uses defaults for missing params", () => {
    // Missing MatrixPhase defaults to 256, NEX to 1, ETL to 1
    // TR=500 => (500 * 256 * 1) / (1 * 1000) = 128 seconds
    const time = computeScanTime({ TR: 500 });
    expect(time).toBeCloseTo(128, 1);
  });

  it("handles zero TR", () => {
    const time = computeScanTime({ TR: 0, MatrixPhase: 256, NEX: 1, ETL: 1 });
    // TR defaults to 1 when 0
    expect(time).toBeCloseTo(0.256, 2);
  });

  it("handles high ETL reducing scan time", () => {
    // TR=9000, MatrixPhase=224, NEX=1, ETL=13
    // Expected: (9000 * 224 * 1) / (13 * 1000) = 155.08 seconds
    const time = computeScanTime({ TR: 9000, MatrixPhase: 224, NEX: 1, ETL: 13 });
    expect(time).toBeCloseTo(155.08, 0);
  });
});
