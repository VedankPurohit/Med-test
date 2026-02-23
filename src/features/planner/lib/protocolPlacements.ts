import { deepClone } from "@/features/planner/lib/scoring";
import { CaseId, PlannerBox, PlannerParams, PlannerScore } from "@/features/planner/types/planner";

export type SavedPlacement = {
  box: PlannerBox;
  params: PlannerParams;
  lastScore: PlannerScore | null;
};

export type PlacementMap = Record<string, SavedPlacement>;

export type PlacementSnapshot = {
  caseId: CaseId | null;
  protocolId: string | null;
  box: PlannerBox | null;
  params: PlannerParams | null;
  lastScore: PlannerScore | null;
};

export const placementKey = (caseId: CaseId, protocolId: string): string =>
  JSON.stringify([caseId, protocolId]);

export const savePlacementSnapshot = (
  placements: PlacementMap,
  snapshot: PlacementSnapshot,
  options?: { skipProtocolId?: string }
): PlacementMap => {
  const { caseId, protocolId, box, params, lastScore } = snapshot;
  if (!caseId || !protocolId || !box || !params) {
    return placements;
  }
  if (options?.skipProtocolId && protocolId === options.skipProtocolId) {
    return placements;
  }

  const key = placementKey(caseId, protocolId);
  return {
    ...placements,
    [key]: {
      box: deepClone(box),
      params: deepClone(params),
      lastScore: lastScore ? deepClone(lastScore) : null
    }
  };
};

export const getSavedPlacement = (
  placements: PlacementMap,
  caseId: CaseId,
  protocolId: string
): SavedPlacement | null => {
  const saved = placements[placementKey(caseId, protocolId)];
  if (!saved) {
    return null;
  }
  return {
    box: deepClone(saved.box),
    params: deepClone(saved.params),
    lastScore: saved.lastScore ? deepClone(saved.lastScore) : null
  };
};
