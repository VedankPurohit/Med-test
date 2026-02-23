import { describe, expect, it } from "vitest";
import {
  resolveProtocol,
  hasPlannerDefinition,
  isForCase,
  filterPlannableExamCards,
} from "@/features/workstation/lib/protocolRegistry";
import type { ExamCardFolder } from "@/features/workstation/types/workstation";

describe("protocolRegistry", () => {
  describe("resolveProtocol", () => {
    it("resolves a brain ExamCard to its planner config", () => {
      const result = resolveProtocol("axial-t2-tse");
      expect(result).not.toBeNull();
      expect(result!.caseId).toBe("brain");
      expect(result!.protocolConfig.id).toBe("brain_t2_axial");
      expect(result!.examCardId).toBe("axial-t2-tse");
    });

    it("resolves spine ExamCards to their correct case", () => {
      const thoracic = resolveProtocol("spine-sagittal-t2-tse");
      expect(thoracic).not.toBeNull();
      expect(thoracic!.caseId).toBe("tspine");

      const lumbar = resolveProtocol("spine-sagittal-t1-tse");
      expect(lumbar).not.toBeNull();
      expect(lumbar!.caseId).toBe("lspine");

      const cervical = resolveProtocol("neck-sag-t2");
      expect(cervical).not.toBeNull();
      expect(cervical!.caseId).toBe("cspine");
    });

    it("returns null for unmapped ExamCard IDs", () => {
      expect(resolveProtocol("sagittal-3d-t1-mprage")).toBeNull();
      expect(resolveProtocol("nonexistent-protocol")).toBeNull();
      expect(resolveProtocol("")).toBeNull();
    });

    it("returns a valid protocolConfig with required fields", () => {
      const result = resolveProtocol("axial-t2-tse");
      expect(result).not.toBeNull();
      expect(result!.protocolConfig).toHaveProperty("id");
      expect(result!.protocolConfig).toHaveProperty("label");
      expect(result!.protocolConfig).toHaveProperty("initial");
      expect(result!.protocolConfig).toHaveProperty("target");
      expect(result!.protocolConfig).toHaveProperty("parameterSpecs");
    });
  });

  describe("hasPlannerDefinition", () => {
    it("returns true for mapped protocols", () => {
      expect(hasPlannerDefinition("axial-t2-tse")).toBe(true);
      expect(hasPlannerDefinition("spine-sagittal-t2-tse")).toBe(true);
      expect(hasPlannerDefinition("neck-sag-t2")).toBe(true);
    });

    it("returns false for unmapped protocols", () => {
      expect(hasPlannerDefinition("sagittal-3d-t1-mprage")).toBe(false);
      expect(hasPlannerDefinition("sella-cor-t2")).toBe(false);
      expect(hasPlannerDefinition("nonexistent")).toBe(false);
    });
  });

  describe("isForCase", () => {
    it("matches brain protocols to brain case", () => {
      expect(isForCase("axial-t2-tse", "brain")).toBe(true);
      expect(isForCase("axial-dwi", "brain")).toBe(true);
    });

    it("does not match brain protocols to spine cases", () => {
      expect(isForCase("axial-t2-tse", "cspine")).toBe(false);
      expect(isForCase("axial-t2-tse", "lspine")).toBe(false);
    });

    it("matches spine protocols to their specific sub-region", () => {
      expect(isForCase("spine-sagittal-t2-tse", "tspine")).toBe(true);
      expect(isForCase("spine-sagittal-t1-tse", "lspine")).toBe(true);
      expect(isForCase("neck-sag-t2", "cspine")).toBe(true);
    });

    it("returns false for unmapped protocols", () => {
      expect(isForCase("nonexistent", "brain")).toBe(false);
    });
  });

  describe("filterPlannableExamCards", () => {
    const testFolders: ExamCardFolder[] = [
      {
        id: "test-brain",
        label: "BRAIN",
        children: [
          { id: "axial-t2-tse", label: "Ax T2", shortName: "Ax T2", orientation: "TRA", region: "brain", estimatedTime: "2:30" },
          { id: "sagittal-3d-t1-mprage", label: "3D MPRAGE", shortName: "3D", orientation: "SAG", region: "brain", estimatedTime: "5:20" },
        ],
      },
      {
        id: "test-spine",
        label: "SPINE",
        children: [
          { id: "spine-sagittal-t2-tse", label: "Sag T2", shortName: "Sag T2", orientation: "SAG", region: "spine", estimatedTime: "3:00" },
          { id: "spine-axial-t1-tse", label: "Ax T1", shortName: "Ax T1", orientation: "TRA", region: "spine", estimatedTime: "2:00" },
        ],
      },
      {
        id: "test-empty",
        label: "SELLA",
        children: [
          { id: "sella-cor-t2", label: "Cor T2", shortName: "Cor T2", orientation: "COR", region: "brain", estimatedTime: "3:00" },
        ],
      },
    ];

    it("removes protocols without planner definitions", () => {
      const result = filterPlannableExamCards(testFolders);
      const brainFolder = result.find((f) => f.id === "test-brain");
      expect(brainFolder).toBeDefined();
      // axial-t2-tse is mapped, sagittal-3d-t1-mprage is not
      expect(brainFolder!.children).toHaveLength(1);
      expect(brainFolder!.children[0].id).toBe("axial-t2-tse");
    });

    it("removes empty folders", () => {
      const result = filterPlannableExamCards(testFolders);
      const sellaFolder = result.find((f) => f.id === "test-empty");
      expect(sellaFolder).toBeUndefined();
    });

    it("filters by caseId when provided", () => {
      const brainOnly = filterPlannableExamCards(testFolders, "brain");
      // Only brain protocols for brain case
      expect(brainOnly.find((f) => f.id === "test-brain")).toBeDefined();
      // Spine folder should be removed (tspine/lspine protocols don't match "brain")
      expect(brainOnly.find((f) => f.id === "test-spine")).toBeUndefined();
    });

    it("returns all plannable when caseId is null", () => {
      const all = filterPlannableExamCards(testFolders, null);
      const allNone = filterPlannableExamCards(testFolders);
      expect(all.length).toBe(allNone.length);
    });
  });
});
