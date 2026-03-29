/** Map a voxel intensity to 0-255 grayscale using window/level */
export function applyWindowLevel(
  value: number,
  center: number,
  width: number
): number {
  if (width <= 0) return value >= center ? 255 : 0;
  const lower = center - width / 2;
  const upper = center + width / 2;
  if (value <= lower) return 0;
  if (value >= upper) return 255;
  return Math.round(((value - lower) / width) * 255);
}
