import type { VolumeData, SliceResult, SlicePlane } from "../types/volume";
import { applyWindowLevel } from "./windowLevel";

export function getSliceCount(volume: VolumeData, plane: SlicePlane): number {
  switch (plane) {
    case "axial":
      return volume.dims[2];
    case "sagittal":
      return volume.dims[0];
    case "coronal":
      return volume.dims[1];
  }
}

export function extractSlice(
  volume: VolumeData,
  plane: SlicePlane,
  index: number,
  windowCenter: number,
  windowWidth: number
): SliceResult {
  const [dimX, dimY, dimZ] = volume.dims;
  let width: number;
  let height: number;
  let clampedIndex: number;

  switch (plane) {
    case "axial":
      width = dimX;
      height = dimY;
      clampedIndex = Math.max(0, Math.min(index, dimZ - 1));
      break;
    case "sagittal":
      width = dimY;
      height = dimZ;
      clampedIndex = Math.max(0, Math.min(index, dimX - 1));
      break;
    case "coronal":
      width = dimX;
      height = dimZ;
      clampedIndex = Math.max(0, Math.min(index, dimY - 1));
      break;
  }

  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      let voxelIndex: number;

      switch (plane) {
        case "axial":
          // x=col, y=row, z=clampedIndex
          voxelIndex = col + row * dimX + clampedIndex * dimX * dimY;
          break;
        case "sagittal":
          // x=clampedIndex, y=col, z=row
          voxelIndex =
            clampedIndex + col * dimX + (height - 1 - row) * dimX * dimY;
          break;
        case "coronal":
          // x=col, y=clampedIndex, z=row
          voxelIndex =
            col + clampedIndex * dimX + (height - 1 - row) * dimX * dimY;
          break;
      }

      const value = volume.data[voxelIndex] ?? 0;
      const gray = applyWindowLevel(value, windowCenter, windowWidth);
      const pixelOffset = (row * width + col) * 4;
      pixels[pixelOffset] = gray;
      pixels[pixelOffset + 1] = gray;
      pixels[pixelOffset + 2] = gray;
      pixels[pixelOffset + 3] = 255;
    }
  }

  return { pixels, width, height };
}
