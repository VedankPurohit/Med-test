import { describe, expect, it } from "vitest";
import { makeParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";
import { validateProtocolConfig } from "@/features/planner/lib/validation";
import { ProtocolConfig } from "@/features/planner/types/planner";

describe("protocol validation", () => {
  it("passes valid protocol configs", () => {
    const protocol = makeProtocol({
      id: "valid_protocol",
      label: "Valid Protocol",
      target: makeTarget(
        { x: 0, y: 0, z: 0 },
        { x: 0.8, y: 0.7, z: 0.6 },
        { rx: 2, ry: -1, rz: 5 },
        makeParams(3000, 90, 220, 20, 4, 0.5)
      ),
      initial: makeTarget(
        { x: 0.1, y: 0.1, z: 0.1 },
        { x: 0.6, y: 0.6, z: 0.5 },
        { rx: 0, ry: 0, rz: 0 },
        makeParams(2500, 80, 230, 18, 5, 1.0)
      )
    });

    expect(validateProtocolConfig(protocol)).toEqual([]);
  });

  it("flags bad parameter spec bounds and duplicates", () => {
    const protocol: ProtocolConfig = {
      id: "invalid_protocol",
      label: "Invalid Protocol",
      target: makeTarget(
        { x: 0, y: 0, z: 0 },
        { x: 0.8, y: 0.7, z: 0.6 },
        { rx: 2, ry: -1, rz: 5 },
        makeParams(3000, 90, 220, 20, 4, 0.5)
      ),
      initial: makeTarget(
        { x: 0.1, y: 0.1, z: 0.1 },
        { x: 0.6, y: 0.6, z: 0.5 },
        { rx: 0, ry: 0, rz: 0 },
        makeParams(2500, 80, 230, 18, 5, 1.0)
      ),
      tolerances: { center: 0.2, size: 0.2, rotation: 16, param: 0.2 },
      parameterSpecs: [
        { key: "TR", label: "TR", min: 3000, max: 1000, step: 0, weight: -1 },
        { key: "TR", label: "TR duplicate" }
      ]
    };

    const errors = validateProtocolConfig(protocol);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(" ")).toContain("duplicate");
    expect(errors.join(" ")).toContain("min cannot exceed max");
    expect(errors.join(" ")).toContain("step must be > 0");
  });

  it("requires target params and parameter specs to match", () => {
    const protocol = makeProtocol({
      id: "mismatched_protocol",
      label: "Mismatched Protocol",
      target: makeTarget(
        { x: 0, y: 0, z: 0 },
        { x: 0.8, y: 0.7, z: 0.6 },
        { rx: 2, ry: -1, rz: 5 },
        makeParams(3000, 90, 220, 20, 4, 0.5)
      ),
      initial: makeTarget(
        { x: 0.1, y: 0.1, z: 0.1 },
        { x: 0.6, y: 0.6, z: 0.5 },
        { rx: 0, ry: 0, rz: 0 },
        makeParams(2500, 80, 230, 18, 5, 1.0)
      ),
      parameterSpecs: [
        { key: "TR", label: "TR" },
        { key: "TE", label: "TE" },
        { key: "FOV", label: "FOV" },
        { key: "Slices", label: "Slices" },
        { key: "SliceThickness", label: "Slice Thickness" },
        { key: "SliceGap", label: "Slice Gap" },
        { key: "ScanTime", label: "Scan Time" }
      ]
    });

    const errors = validateProtocolConfig(protocol);
    expect(errors.join(" ")).toContain("parameterSpecs without target params");
  });
});
