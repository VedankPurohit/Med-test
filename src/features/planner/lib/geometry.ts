import {
  HandleId,
  ParameterSet,
  PlannerBox,
  Point2,
  Rotation3,
  Vector3,
  ViewId
} from "@/features/planner/types/planner";

export const VIEW_CONFIG: Record<
  ViewId,
  { axes: [keyof Vector3, keyof Vector3]; editable: boolean; moveAxes: [keyof Vector3, keyof Vector3] }
> = {
  axial: { axes: ["x", "y"], editable: true, moveAxes: ["x", "y"] },
  sagittal: { axes: ["y", "z"], editable: true, moveAxes: ["y", "z"] },
  coronal: { axes: ["x", "z"], editable: false, moveAxes: ["x", "z"] }
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Conversion between normalized box-space coordinates and millimeters.
 * 1 normalized unit = 250 mm. Shared by sizing, scoring, coverage, and
 * slab geometry so they never drift out of sync.
 */
export const NORM_TO_MM = 250;

export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const rotate3D = (point: Vector3, rotation: Rotation3): Vector3 => {
  const rx = toRadians(rotation.rx);
  const ry = toRadians(rotation.ry);
  const rz = toRadians(rotation.rz);

  let { x, y, z } = point;

  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  y = y1;
  z = z1;

  const x2 = x * Math.cos(ry) + z * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z * Math.cos(ry);
  x = x2;
  z = z2;

  const x3 = x * Math.cos(rz) - y * Math.sin(rz);
  const y3 = x * Math.sin(rz) + y * Math.cos(rz);

  return { x: x3, y: y3, z };
};

export const getBoxCorners3D = (box: PlannerBox): Vector3[] => {
  const hx = box.size.x / 2;
  const hy = box.size.y / 2;
  const hz = box.size.z / 2;

  const localCorners: [number, number, number][] = [
    [-hx, -hy, -hz],
    [hx, -hy, -hz],
    [-hx, hy, -hz],
    [hx, hy, -hz],
    [-hx, -hy, hz],
    [hx, -hy, hz],
    [-hx, hy, hz],
    [hx, hy, hz]
  ];

  return localCorners.map(([x, y, z]) => {
    const rotated = rotate3D({ x, y, z }, box.rotation);
    return {
      x: rotated.x + box.center.x,
      y: rotated.y + box.center.y,
      z: rotated.z + box.center.z
    };
  });
};

export const projectPoint = (point: Vector3, viewId: ViewId): Point2 => {
  if (viewId === "axial") {
    return { x: point.x, y: point.y };
  }
  if (viewId === "sagittal") {
    return { x: point.y, y: point.z };
  }
  return { x: point.x, y: point.z };
};

export const normToScreen = (point: Point2, width: number, height: number): Point2 => ({
  x: ((point.x + 1) / 2) * width,
  y: (1 - (point.y + 1) / 2) * height
});

export const pointerToNorm = (
  clientX: number,
  clientY: number,
  rect: DOMRect,
  canvasWidth: number,
  canvasHeight: number
): Point2 => {
  const scaleX = canvasWidth / rect.width;
  const scaleY = canvasHeight / rect.height;
  const px = (clientX - rect.left) * scaleX;
  const py = (clientY - rect.top) * scaleY;

  return {
    x: (px / canvasWidth) * 2 - 1,
    y: (1 - py / canvasHeight) * 2 - 1
  };
};

export const pointInPolygon = (point: Point2, polygon: Point2[]): boolean => {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-12) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

export const convexHull = (points: Point2[]): Point2[] => {
  if (points.length < 3) {
    return points;
  }

  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (origin: Point2, a: Point2, b: Point2): number =>
    (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);

  const lower: Point2[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Point2[] = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
};

export const getProjectedGeometry = (box: PlannerBox, viewId: ViewId) => {
  const corners = getBoxCorners3D(box);
  const projected = corners.map((corner) => projectPoint(corner, viewId));
  const hull = convexHull(projected);
  const center2D = projectPoint(box.center, viewId);

  return { projected, hull, center2D };
};

/**
 * Determine the box-local slice-stack axis for a protocol.
 *
 * Sagittal protocols stack slices along x (L/R), coronal along y (A/P),
 * axial / transverse along z (S/I).
 *
 * Resolution order:
 *   1. If `params.SliceOrientation` is set (0 = LR/x, 1 = AP/y, 2 = HF/z),
 *      use it. This is the user-configurable override exposed in the UI.
 *   2. Otherwise infer from the protocol id substring ("sag" → x,
 *      "cor" → y, else z). Works for both planner-native ids
 *      ("brain_t1_sagittal", "brain_t2_axial", "cspine_sag_t2") and
 *      workstation card ids that share the same tokens.
 */
export const SLICE_ORIENTATION_TO_AXIS: Record<number, keyof Vector3> = {
  0: "x", // LR
  1: "y", // AP
  2: "z"  // HF
};

const AXIS_TO_SLICE_ORIENTATION: Record<keyof Vector3, number> = {
  x: 0,
  y: 1,
  z: 2
};

export const axisToSliceOrientationCode = (axis: keyof Vector3): number =>
  AXIS_TO_SLICE_ORIENTATION[axis];

export const getSliceAxis = (
  protocolId: string | null,
  params?: ParameterSet
): keyof Vector3 => {
  // 1. Explicit user override wins.
  if (params && params.SliceOrientation !== undefined) {
    const code = Math.round(Number(params.SliceOrientation));
    const axis = SLICE_ORIENTATION_TO_AXIS[code];
    if (axis) {
      return axis;
    }
  }
  // 2. Fall back to protocol-id heuristic.
  if (!protocolId) {
    return "z";
  }
  const id = protocolId.toLowerCase();
  if (id.includes("sag")) {
    return "x";
  }
  if (id.includes("cor")) {
    return "y";
  }
  return "z";
};

/**
 * Map from view to the axis that gets *projected away* (out-of-plane).
 * If a protocol's slice axis matches this for a given view, the box
 * represents one slice's footprint — we render no slice lines.
 */
export const VIEW_OUT_OF_PLANE_AXIS: Record<ViewId, keyof Vector3> = {
  axial: "z",
  sagittal: "x",
  coronal: "y"
};

/**
 * Compute slice slab positions along the slice axis, in box-local
 * normalized coordinates centered on 0. Each entry has the slab's
 * center and half-width (so the visible slab spans
 * [center - halfWidth, center + halfWidth]).
 *
 * Slabs are drawn in *absolute* mm: each slab is exactly `thicknessMm`
 * thick and centers are spaced by `(thicknessMm + gapMm)`. The total
 * span equals `N * thicknessMm + (N - 1) * gapMm` mm, which by
 * construction matches the slice-axis size of the box (DynamicParameterPanel
 * sizes the box from the same parameters via the same NORM_TO_MM scale),
 * so slabs naturally fill the box edge-to-edge with the prescribed gaps.
 *
 * `mmToNorm` is the conversion from mm to normalized box-space (i.e.
 * `1 / NORM_TO_MM`). Passed explicitly so tests can inject any scale.
 */
export const getSliceSlabs = (
  slices: number,
  thicknessMm: number,
  gapMm: number,
  mmToNorm: number
): Array<{ center: number; halfWidth: number }> => {
  const N = Math.max(1, Math.round(slices));
  const T = Math.max(0, thicknessMm) * mmToNorm;
  const G = Math.max(0, gapMm) * mmToNorm;
  const totalSpan = N * T + (N - 1) * G;
  const start = -totalSpan / 2 + T / 2;
  const halfWidth = T / 2;
  return Array.from({ length: N }, (_, i) => ({
    center: start + i * (T + G),
    halfWidth
  }));
};

/**
 * Given a slice axis and box-local half-extents, return the 4 corners
 * of one slice plane (a rectangle perpendicular to the slice axis at
 * `centerAlongAxis`) in box-local 3D coordinates. Caller rotates +
 * translates + projects through the same pipeline as the cube corners.
 */
export const getSlicePlaneCorners = (
  sliceAxis: keyof Vector3,
  centerAlongAxis: number,
  hx: number,
  hy: number,
  hz: number
): Vector3[] => {
  if (sliceAxis === "x") {
    return [
      { x: centerAlongAxis, y: -hy, z: -hz },
      { x: centerAlongAxis, y: hy, z: -hz },
      { x: centerAlongAxis, y: hy, z: hz },
      { x: centerAlongAxis, y: -hy, z: hz }
    ];
  }
  if (sliceAxis === "y") {
    return [
      { x: -hx, y: centerAlongAxis, z: -hz },
      { x: hx, y: centerAlongAxis, z: -hz },
      { x: hx, y: centerAlongAxis, z: hz },
      { x: -hx, y: centerAlongAxis, z: hz }
    ];
  }
  return [
    { x: -hx, y: -hy, z: centerAlongAxis },
    { x: hx, y: -hy, z: centerAlongAxis },
    { x: hx, y: hy, z: centerAlongAxis },
    { x: -hx, y: hy, z: centerAlongAxis }
  ];
};

/**
 * Project one slice plane through the cube3d pipeline (rotate3D → translate
 * → projectPoint). Returns 4 normalized 2D points. When the slice axis is
 * the view's out-of-plane axis the projection collapses to a degenerate
 * line; callers should filter via VIEW_OUT_OF_PLANE_AXIS first.
 */
export const getSlicePlaneCube3D = (
  box: PlannerBox,
  viewId: ViewId,
  sliceAxis: keyof Vector3,
  planePos: number
): Point2[] => {
  const hx = box.size.x / 2;
  const hy = box.size.y / 2;
  const hz = box.size.z / 2;
  const corners3D = getSlicePlaneCorners(sliceAxis, planePos, hx, hy, hz);
  return corners3D.map((corner) => {
    const rotated = rotate3D(corner, box.rotation);
    const translated: Vector3 = {
      x: rotated.x + box.center.x,
      y: rotated.y + box.center.y,
      z: rotated.z + box.center.z
    };
    return projectPoint(translated, viewId);
  });
};

/**
 * Project one slice plane through the flat2d pipeline. Endpoints are built
 * on the in-plane face of the box that passes through the box center
 * (out-of-plane axis = 0), then run through the full 3D rotation pipeline
 * (rotate3D → translate → projectPoint) — the same projection used by
 * getFlatGeometry's rectangle. That keeps slice lines glued to the
 * (possibly foreshortened) rectangle through any rotation, including
 * rotations applied via *other* views. Returns the 2 endpoints of the
 * slice line. Returns an empty array if the slice axis is the view's
 * out-of-plane axis (caller should filter, but we double-check defensively).
 */
export const getSlicePlaneFlat2D = (
  box: PlannerBox,
  viewId: ViewId,
  sliceAxis: keyof Vector3,
  planePos: number
): Point2[] => {
  const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
  if (sliceAxis !== axisA && sliceAxis !== axisB) {
    return [];
  }

  const halfA = box.size[axisA] / 2;
  const halfB = box.size[axisB] / 2;
  const outAxis = VIEW_OUT_OF_PLANE_AXIS[viewId];

  const make = (a: number, b: number): Vector3 => {
    const v: Vector3 = { x: 0, y: 0, z: 0 };
    v[axisA] = a;
    v[axisB] = b;
    v[outAxis] = 0;
    return v;
  };

  const localPair: [Vector3, Vector3] = sliceAxis === axisA
    ? [make(planePos, -halfB), make(planePos, halfB)]
    : [make(-halfA, planePos), make(halfA, planePos)];

  return localPair.map((point) => {
    const rotated = rotate3D(point, box.rotation);
    const world: Vector3 = {
      x: rotated.x + box.center.x,
      y: rotated.y + box.center.y,
      z: rotated.z + box.center.z
    };
    return projectPoint(world, viewId);
  });
};

export const FLAT_VIEW_AXES: Record<ViewId, [keyof Vector3, keyof Vector3]> = {
  axial: ["x", "y"],
  sagittal: ["y", "z"],
  coronal: ["x", "z"]
};

/**
 * Build the 4 corners of the in-plane face of the box that passes through
 * the box center (out-of-plane axis = 0), in world-space 3D, after applying
 * the full box rotation. Caller projects to 2D via projectPoint.
 *
 * This is the foundation of flat2d's "draw a 4-corner rectangle that
 * responds to rotation in any view" contract: the rectangle is the
 * projection of a real planar quadrilateral that lives in box-local space,
 * so rotations on out-of-plane Euler axes foreshorten it (and on the
 * in-plane Euler axis tilt it) without ever turning it into the
 * 6-sided cube silhouette that cube3d uses.
 *
 * Corner order matches the legacy flat2d 2D layout [--, +-, ++, -+] in
 * (axisA, axisB) so downstream invariants are preserved:
 *   - hitTestFlat's { kind: "corner", index: 0|1|2|3 } indices,
 *   - edge ordering for pointInPolygon and edge hit detection,
 *   - slice-line endpoint pairing in getSlicePlaneFlat2D.
 *
 * For an unrotated box (rx = ry = rz = 0) rotate3D is identity and
 * projectPoint drops the out-of-plane axis (which we set to 0), so this
 * collapses to the same (±halfA, ±halfB) corners the previous in-plane
 * rotate2D path produced. Output is bit-identical when rotation is zero.
 */
export const getInPlaneFaceCorners3D = (box: PlannerBox, viewId: ViewId): Vector3[] => {
  const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
  const outAxis = VIEW_OUT_OF_PLANE_AXIS[viewId];
  const halfA = box.size[axisA] / 2;
  const halfB = box.size[axisB] / 2;

  const make = (a: number, b: number): Vector3 => {
    const v: Vector3 = { x: 0, y: 0, z: 0 };
    v[axisA] = a;
    v[axisB] = b;
    v[outAxis] = 0;
    return v;
  };

  // CCW in (axisA, axisB): [--, +-, ++, -+]
  const localCorners: Vector3[] = [
    make(-halfA, -halfB),
    make(halfA, -halfB),
    make(halfA, halfB),
    make(-halfA, halfB)
  ];

  return localCorners.map((corner) => {
    const rotated = rotate3D(corner, box.rotation);
    return {
      x: rotated.x + box.center.x,
      y: rotated.y + box.center.y,
      z: rotated.z + box.center.z
    };
  });
};

export const inPlaneAngle = (box: PlannerBox, viewId: ViewId): number => {
  if (viewId === "axial") {
    return toRadians(box.rotation.rz);
  }
  if (viewId === "sagittal") {
    return toRadians(box.rotation.rx);
  }
  return toRadians(box.rotation.ry);
};

export const rotate2D = (point: Point2, radians: number): Point2 => {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return {
    x: point.x * c - point.y * s,
    y: point.x * s + point.y * c
  };
};

/**
 * flat2d view geometry: a 4-corner rectangle that's the orthographic
 * projection of the box's in-plane center face after applying the full
 * 3D rotation. Out-of-plane Euler rotations foreshorten the rectangle
 * (it stays a convex quadrilateral); the in-plane Euler component tilts
 * it. The contract is "always 4 corners, never a hexagonal silhouette" —
 * the silhouette path is reserved for cube3d.
 *
 * `hull` equals `projected` because rotation is clamped to ±45° per axis
 * (see usePlannerState's rotate drag clamp), which keeps the projected
 * quadrilateral convex with non-zero area; for 4 convex points the hull
 * is the points themselves in their existing CCW order.
 */
export const getFlatGeometry = (box: PlannerBox, viewId: ViewId) => {
  const center2D = projectPoint(box.center, viewId);
  const corners3D = getInPlaneFaceCorners3D(box, viewId);
  const projected = corners3D.map((corner) => projectPoint(corner, viewId));
  return { projected, hull: projected, center2D };
};

export const squaredDistance = (a: Point2, b: Point2): number =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const angleDiff = (a: number, b: number): number => {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
};

export const pointToSegmentDistance = (
  point: Point2,
  a: Point2,
  b: Point2
): { distance: number; t: number } => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-12) {
    const d = Math.sqrt(squaredDistance(point, a));
    return { distance: d, t: 0 };
  }

  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq, 0, 1);
  const closest: Point2 = { x: a.x + t * dx, y: a.y + t * dy };
  const distance = Math.sqrt(squaredDistance(point, closest));
  return { distance, t };
};

export const hitTestFlat = (
  point: Point2,
  box: PlannerBox,
  viewId: ViewId
): HandleId | null => {
  const geometry = getFlatGeometry(box, viewId);
  const corners = geometry.projected;
  const center2D = geometry.center2D;

  // 1. Corner check (radius 0.06 in normalized space)
  const cornerThresholdSq = 0.06 * 0.06;
  for (let i = 0; i < 4; i++) {
    if (squaredDistance(point, corners[i]) <= cornerThresholdSq) {
      return { kind: "corner", index: i as 0 | 1 | 2 | 3 };
    }
  }

  // 2. Edge check (distance <= 0.04, parametric t in [0.15, 0.85])
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const { distance, t } = pointToSegmentDistance(point, a, b);
    if (distance <= 0.04 && t >= 0.15 && t <= 0.85) {
      return { kind: "edge", index: i as 0 | 1 | 2 | 3 };
    }
  }

  // 3. Interior check
  if (pointInPolygon(point, corners) || squaredDistance(point, center2D) <= 0.02) {
    return { kind: "move" };
  }

  // 4. Rotation ring check
  const dist = Math.sqrt(squaredDistance(point, center2D));
  let maxCornerDist = 0;
  for (let i = 0; i < 4; i++) {
    const d = Math.sqrt(squaredDistance(center2D, corners[i]));
    if (d > maxCornerDist) {
      maxCornerDist = d;
    }
  }
  const innerRadius = maxCornerDist + 0.02;
  const outerRadius = maxCornerDist + 0.12;
  if (dist >= innerRadius && dist <= outerRadius) {
    return { kind: "rotate" };
  }

  return null;
};

export const hitTestCube = (
  point: Point2,
  box: PlannerBox,
  viewId: ViewId
): HandleId | null => {
  const geometry = getProjectedGeometry(box, viewId);
  const center2D = geometry.center2D;

  // Interior check
  if (pointInPolygon(point, geometry.hull) || squaredDistance(point, center2D) <= 0.02) {
    return { kind: "move" };
  }

  // Rotation ring check.
  //
  // Hit zone intentionally generous (~30px wide on a 320px canvas) because in
  // cube3d mode the ring is the only rotation affordance — there are no corner
  // or edge handles (TODO(cube3d-resize)). Keep these offsets in sync with
  // CUBE_RING_OFFSET_INNER / CUBE_RING_OFFSET_OUTER in LocalizerCanvas so the
  // rendered ring exactly matches the hit zone.
  const dist = Math.sqrt(squaredDistance(point, center2D));
  let maxCornerDist = 0;
  for (const corner of geometry.hull) {
    const d = Math.sqrt(squaredDistance(center2D, corner));
    if (d > maxCornerDist) {
      maxCornerDist = d;
    }
  }
  const innerRadius = maxCornerDist + 0.01;
  const outerRadius = maxCornerDist + 0.20;
  if (dist >= innerRadius && dist <= outerRadius) {
    return { kind: "rotate" };
  }

  return null;
};
