import { describe, expect, it } from "vitest";
import { extractSlice, getSliceCount } from "../sliceExtractor";
import type { VolumeData } from "../../types/volume";

function makeMockVolume(): VolumeData {
  const data = new Float32Array(64);
  for (let z = 0; z < 4; z++) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        data[x + y * 4 + z * 16] = x + y * 4 + z * 16;
      }
    }
  }
  return {
    data,
    dims: [4, 4, 4],
    pixDims: [1, 1, 1],
    dataMin: 0,
    dataMax: 63,
    dataP2: 1,
    dataP98: 62,
  };
}

describe("sliceExtractor", () => {
  it("returns correct slice counts", () => {
    const vol = makeMockVolume();
    expect(getSliceCount(vol, "axial")).toBe(4);
    expect(getSliceCount(vol, "sagittal")).toBe(4);
    expect(getSliceCount(vol, "coronal")).toBe(4);
  });

  it("extracts axial slice with correct dimensions", () => {
    const vol = makeMockVolume();
    const slice = extractSlice(vol, "axial", 0, 32, 64);
    expect(slice.width).toBe(4);
    expect(slice.height).toBe(4);
    expect(slice.pixels.length).toBe(4 * 4 * 4);
  });

  it("extracts sagittal slice with correct dimensions", () => {
    const vol = makeMockVolume();
    const slice = extractSlice(vol, "sagittal", 0, 32, 64);
    expect(slice.width).toBe(4);
    expect(slice.height).toBe(4);
  });

  it("extracts coronal slice with correct dimensions", () => {
    const vol = makeMockVolume();
    const slice = extractSlice(vol, "coronal", 0, 32, 64);
    expect(slice.width).toBe(4);
    expect(slice.height).toBe(4);
  });

  it("clamps out-of-bounds indices", () => {
    const vol = makeMockVolume();
    const slice = extractSlice(vol, "axial", 100, 32, 64);
    expect(slice.width).toBe(4);
    expect(slice.height).toBe(4);
  });

  it("produces RGBA pixels with alpha=255", () => {
    const vol = makeMockVolume();
    const slice = extractSlice(vol, "axial", 0, 32, 64);
    // Every 4th byte (alpha) should be 255
    for (let i = 3; i < slice.pixels.length; i += 4) {
      expect(slice.pixels[i]).toBe(255);
    }
  });
});
