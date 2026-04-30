import * as nifti from "nifti-reader-js";
import type { VolumeData } from "../types/volume";

const cache = new Map<string, VolumeData>();

export async function loadNiftiVolume(url: string): Promise<VolumeData> {
  const cached = cache.get(url);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load volume: HTTP ${response.status} for ${url}`);
  }

  let data = await response.arrayBuffer();

  if (nifti.isCompressed(data)) {
    data = nifti.decompress(data);
  }

  if (!nifti.isNIFTI(data)) {
    throw new Error("Not a valid NIfTI file");
  }

  const header = nifti.readHeader(data);
  if (!header) throw new Error("Failed to read NIfTI header");

  const imageData = nifti.readImage(header, data);

  const dims: [number, number, number] = [
    header.dims[1],
    header.dims[2],
    header.dims[3],
  ];
  const pixDims: [number, number, number] = [
    header.pixDims[1],
    header.pixDims[2],
    header.pixDims[3],
  ];

  let float32: Float32Array;
  switch (header.datatypeCode) {
    case nifti.NIFTI1.TYPE_UINT8:
      float32 = new Float32Array(new Uint8Array(imageData));
      break;
    case nifti.NIFTI1.TYPE_INT16:
      float32 = new Float32Array(new Int16Array(imageData));
      break;
    case nifti.NIFTI1.TYPE_INT32:
      float32 = new Float32Array(new Int32Array(imageData));
      break;
    case nifti.NIFTI1.TYPE_FLOAT32:
      float32 = new Float32Array(imageData);
      break;
    case nifti.NIFTI1.TYPE_FLOAT64:
      float32 = new Float32Array(new Float64Array(imageData));
      break;
    default: {
      // Try element-wise conversion via Uint16Array (common for MRI data)
      const bytesPerVoxel = imageData.byteLength / (dims[0] * dims[1] * dims[2]);
      if (bytesPerVoxel === 2) {
        float32 = new Float32Array(new Uint16Array(imageData));
      } else {
        throw new Error(`Unsupported NIfTI datatype code: ${header.datatypeCode}`);
      }
    }
  }

  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (let i = 0; i < float32.length; i++) {
    if (float32[i] < dataMin) dataMin = float32[i];
    if (float32[i] > dataMax) dataMax = float32[i];
  }

  // Compute robust percentiles from non-zero voxels for proper MRI windowing.
  // Using a histogram approach (256 bins) to avoid sorting the full volume.
  const BINS = 4096;
  const range = dataMax - dataMin;
  const binWidth = range / BINS;
  const histogram = new Uint32Array(BINS);
  let nonZeroCount = 0;

  for (let i = 0; i < float32.length; i++) {
    const v = float32[i];
    if (v > 0) {
      const bin = Math.min(BINS - 1, Math.floor((v - dataMin) / binWidth));
      histogram[bin]++;
      nonZeroCount++;
    }
  }

  let dataP2 = dataMin;
  let dataP98 = dataMax;

  if (nonZeroCount > 0) {
    const p2Target = Math.floor(nonZeroCount * 0.02);
    const p98Target = Math.floor(nonZeroCount * 0.98);
    let cumulative = 0;
    for (let b = 0; b < BINS; b++) {
      cumulative += histogram[b];
      if (cumulative >= p2Target && dataP2 === dataMin) {
        dataP2 = dataMin + b * binWidth;
      }
      if (cumulative >= p98Target) {
        dataP98 = dataMin + (b + 1) * binWidth;
        break;
      }
    }
  }

  const volume: VolumeData = { data: float32, dims, pixDims, dataMin, dataMax, dataP2, dataP98 };
  cache.set(url, volume);
  return volume;
}
