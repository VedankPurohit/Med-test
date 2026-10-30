import { describe, expect, it } from "vitest";
import { validateSequenceOrder } from "@/features/guidance/lib/orderValidation";
import type { ProtocolListItem } from "@/features/workstation/types/workstation";

const makeItem = (protocolId: string, label: string): ProtocolListItem => ({
  protocolId,
  label,
  shortName: label,
  orientation: "TRA",
  region: "brain",
  status: "pending",
});

describe("validateSequenceOrder", () => {
  it("returns valid for correct brain sequence order", () => {
    const protocols = [
      makeItem("sagittal-t1-tse", "Sag T1"),
      makeItem("axial-t2-tse", "Ax T2"),
      makeItem("axial-t2-flair", "Ax FLAIR"),
      makeItem("axial-dwi", "Ax DWI"),
    ];
    const result = validateSequenceOrder(protocols);
    expect(result.valid).toBe(true);
  });

  it("returns invalid when sequences are out of order", () => {
    const protocols = [
      makeItem("axial-dwi", "Ax DWI"),
      makeItem("sagittal-t1-tse", "Sag T1"),
    ];
    const result = validateSequenceOrder(protocols);
    expect(result.valid).toBe(false);
    expect(result.hint).toBeDefined();
  });

  it("returns valid for a single protocol", () => {
    const protocols = [makeItem("axial-t2-tse", "Ax T2")];
    const result = validateSequenceOrder(protocols);
    expect(result.valid).toBe(true);
  });

  it("returns valid for empty list", () => {
    const result = validateSequenceOrder([]);
    expect(result.valid).toBe(true);
  });

  it("ignores unmapped protocols in ordering", () => {
    const protocols = [
      makeItem("sagittal-t1-tse", "Sag T1"),
      makeItem("unmapped-protocol", "Unknown"),
      makeItem("axial-t2-tse", "Ax T2"),
    ];
    const result = validateSequenceOrder(protocols);
    expect(result.valid).toBe(true);
  });
});
