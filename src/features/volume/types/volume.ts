export interface VolumeData {
  data: Float32Array;
  dims: [number, number, number];
  pixDims: [number, number, number];
  dataMin: number;
  dataMax: number;
}

export interface SliceResult {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}

export type SlicePlane = 'axial' | 'sagittal' | 'coronal';
