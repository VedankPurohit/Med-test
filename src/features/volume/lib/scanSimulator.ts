import type { VolumeData, SliceResult, SlicePlane } from "../types/volume";
import { extractSlice, getSliceCount } from "./sliceExtractor";
import type { PlannerBox } from "@/features/planner/types/planner";

export function simulateScanResult(
  volume: VolumeData,
  box: PlannerBox,
  plane: SlicePlane,
  windowCenter: number,
  windowWidth: number
): SliceResult[] {
  const totalSlices = getSliceCount(volume, plane);

  const centerAxis =
    plane === "axial"
      ? box.center.z
      : plane === "sagittal"
        ? box.center.x
        : box.center.y;

  const centerIndex = Math.round(((centerAxis + 1) / 2) * (totalSlices - 1));

  const sizeAxis =
    plane === "axial"
      ? box.size.z
      : plane === "sagittal"
        ? box.size.x
        : box.size.y;

  const halfSpan = Math.round((sizeAxis / 2) * totalSlices);
  const startIndex = Math.max(0, centerIndex - halfSpan);
  const endIndex = Math.min(totalSlices - 1, centerIndex + halfSpan);

  const results: SliceResult[] = [];
  const maxSlices = 8;
  const step = Math.max(1, Math.round((endIndex - startIndex) / maxSlices));

  for (let i = startIndex; i <= endIndex; i += step) {
    results.push(extractSlice(volume, plane, i, windowCenter, windowWidth));
  }

  return results;
}
