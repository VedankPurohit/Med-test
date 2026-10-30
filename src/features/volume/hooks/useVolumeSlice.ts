"use client";

import { useState, useEffect } from "react";
import type { VolumeData, SlicePlane } from "../types/volume";
import { extractSlice, getSliceCount } from "../lib/sliceExtractor";

export function useVolumeSlice(
  volume: VolumeData | null,
  plane: SlicePlane,
  sliceIndex: number,
  windowCenter: number,
  windowWidth: number
) {
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap | null>(null);

  useEffect(() => {
    if (!volume) {
      setImageBitmap(null);
      return;
    }

    const totalSlices = getSliceCount(volume, plane);
    const clamped = Math.max(0, Math.min(sliceIndex, totalSlices - 1));
    const slice = extractSlice(volume, plane, clamped, windowCenter, windowWidth);

    const imageData = new ImageData(slice.pixels, slice.width, slice.height);
    let cancelled = false;

    createImageBitmap(imageData)
      .then((bmp) => {
        if (!cancelled) setImageBitmap(bmp);
      })
      .catch(() => {
        if (!cancelled) setImageBitmap(null);
      });

    return () => {
      cancelled = true;
    };
  }, [volume, plane, sliceIndex, windowCenter, windowWidth]);

  return imageBitmap;
}
