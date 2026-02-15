import { PlannerParams, ProtocolConfig, ProtocolTarget, ProtocolTolerance } from "@/features/planner/types/planner";

export const makeParams = (
  TR: number,
  TE: number,
  FOV: number,
  Slices: number,
  SliceThickness: number,
  SliceGap: number
): PlannerParams => ({ TR, TE, FOV, Slices, SliceThickness, SliceGap });

export const makeTarget = (
  center: ProtocolTarget["center"],
  size: ProtocolTarget["size"],
  rotation: ProtocolTarget["rotation"],
  params: PlannerParams
): ProtocolTarget => ({ center, size, rotation, params });

export const makeProtocol = (
  input: Omit<ProtocolConfig, "tolerances"> & { tolerances?: ProtocolTolerance }
): ProtocolConfig => ({
  ...input,
  tolerances: input.tolerances ?? { center: 0.22, size: 0.2, rotation: 16, param: 0.22 }
});
