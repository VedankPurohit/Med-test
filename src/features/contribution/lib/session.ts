import { ContributionPlacement, ContributionPlacementMap, DEFAULT_BOX } from "@/features/contribution/types";
import { clamp } from "@/features/planner/lib/geometry";
import { deepClone } from "@/features/planner/lib/scoring";
import { PlannerBox } from "@/features/planner/types/planner";

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

export const applySizeChange = (
  placement: ContributionPlacement,
  axis: keyof PlannerBox["size"],
  value: number
): ContributionPlacement => ({
  ...placement,
  box: {
    ...placement.box,
    size: {
      ...placement.box.size,
      [axis]: clamp(value, 0.2, 1.8)
    }
  }
});

export const applyRotationChange = (
  placement: ContributionPlacement,
  axis: keyof PlannerBox["rotation"],
  value: number
): ContributionPlacement => ({
  ...placement,
  box: {
    ...placement.box,
    rotation: {
      ...placement.box.rotation,
      [axis]: clamp(value, -45, 45)
    }
  }
});
