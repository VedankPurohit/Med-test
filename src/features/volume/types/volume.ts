export interface VolumeData {
  data: Float32Array;
  dims: [number, number, number];
  pixDims: [number, number, number];
  dataMin: number;
  dataMax: number;
  /** 2nd percentile of non-zero voxels (robust lower bound for windowing) */
  dataP2: number;
  /** 98th percentile of non-zero voxels (robust upper bound for windowing) */
  dataP98: number;
}

export interface SliceResult {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}

export type SlicePlane = 'axial' | 'sagittal' | 'coronal';
