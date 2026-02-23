import { ContributionPlacement, ContributionPlacementMap, DEFAULT_BOX } from "@/features/contribution/types";
import { deepClone } from "@/features/planner/lib/scoring";

export type ContributionPlacementSnapshot = {
  protocolId: string | null;
  placement: ContributionPlacement | null;
};

const makeDefaultPlacement = (): ContributionPlacement => ({
  box: deepClone(DEFAULT_BOX),
  params: {},
  boxRenderMode: "flat2d"
});

export const createPlacementMap = (
  protocolIds: string[],
  seed?: Partial<Record<string, ContributionPlacement | null>>
): ContributionPlacementMap => {
  const map: ContributionPlacementMap = {};
  for (const protocolId of protocolIds) {
    const seeded = seed?.[protocolId];
    map[protocolId] = seeded ? deepClone(seeded) : makeDefaultPlacement();
  }
  return map;
};

export const savePlacementSnapshot = (
  placements: ContributionPlacementMap,
  snapshot: ContributionPlacementSnapshot
): ContributionPlacementMap => {
  if (!snapshot.protocolId || !snapshot.placement) {
    return placements;
  }

  return {
    ...placements,
    [snapshot.protocolId]: deepClone(snapshot.placement)
  };
};

export const getPlacementForProtocol = (
  placements: ContributionPlacementMap,
  protocolId: string
): ContributionPlacement | null => {
  const placement = placements[protocolId];
  if (!placement) {
    return null;
  }
  return deepClone(placement);
};
