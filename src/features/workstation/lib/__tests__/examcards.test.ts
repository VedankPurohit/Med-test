import { describe, expect, it } from "vitest";
import { getExamCards, getPlannableExamCards } from "@/features/workstation/lib/examcards";
import { hasPlannerDefinition } from "@/features/workstation/lib/protocolRegistry";
import { isFolder, isProtocol } from "@/features/workstation/types/workstation";

describe("examcards", () => {
  describe("getExamCards", () => {
    it("returns all ExamCard folders", () => {
      const cards = getExamCards();
      expect(cards.length).toBeGreaterThan(0);
      // Every top-level entry should be a folder
      for (const folder of cards) {
        expect(isFolder(folder)).toBe(true);
        expect(folder.children.length).toBeGreaterThan(0);
      }
    });

    it("contains expected anatomical regions", () => {
      const cards = getExamCards();
      const ids = cards.map((f) => f.id);
      expect(ids).toContain("brain");
      expect(ids).toContain("dorsal-spine");
      expect(ids).toContain("neck");
    });

    it("has protocol entries with required fields", () => {
      const cards = getExamCards();
      for (const folder of cards) {
        for (const child of folder.children) {
          if (isProtocol(child)) {
            expect(child).toHaveProperty("id");
            expect(child).toHaveProperty("label");
            expect(child).toHaveProperty("shortName");
            expect(child).toHaveProperty("orientation");
            expect(child).toHaveProperty("region");
            expect(child).toHaveProperty("estimatedTime");
          }
        }
      }
    });
  });

  describe("getPlannableExamCards", () => {
    it("returns only protocols with planner definitions", () => {
      const plannable = getPlannableExamCards();
      for (const folder of plannable) {
        for (const child of folder.children) {
          if (isProtocol(child)) {
            expect(hasPlannerDefinition(child.id)).toBe(true);
          }
        }
      }
    });

    it("returns fewer protocols than the full set", () => {
      const all = getExamCards();
      const plannable = getPlannableExamCards();

      const countProtocols = (folders: typeof all) =>
        folders.reduce((sum, f) => sum + f.children.filter(isProtocol).length, 0);

      expect(countProtocols(plannable)).toBeLessThan(countProtocols(all));
      expect(countProtocols(plannable)).toBeGreaterThan(0);
    });

    it("filters to brain-only when caseId is brain", () => {
      const brainCards = getPlannableExamCards("brain");
      for (const folder of brainCards) {
        for (const child of folder.children) {
          if (isProtocol(child)) {
            const resolved = hasPlannerDefinition(child.id);
            expect(resolved).toBe(true);
          }
        }
      }
      // Should not contain spine/neck protocols
      const allIds = brainCards.flatMap((f) =>
        f.children.filter(isProtocol).map((c) => c.id)
      );
      expect(allIds.some((id) => id.startsWith("spine-"))).toBe(false);
      expect(allIds.some((id) => id.startsWith("neck-"))).toBe(false);
    });

    it("filters to lspine-only when caseId is lspine", () => {
      const lspineCards = getPlannableExamCards("lspine");
      const allIds = lspineCards.flatMap((f) =>
        f.children.filter(isProtocol).map((c) => c.id)
      );
      expect(allIds.length).toBeGreaterThan(0);
      // Should not contain brain protocols
      expect(allIds.some((id) => id.startsWith("axial-"))).toBe(false);
    });
  });
});
