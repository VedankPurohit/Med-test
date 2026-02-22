import { HandleId, PlannerBox, Point2, Rotation3, Vector3, ViewId } from "@/features/planner/types/planner";

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

export const FLAT_VIEW_AXES: Record<ViewId, [keyof Vector3, keyof Vector3]> = {
  axial: ["x", "y"],
  sagittal: ["y", "z"],
  coronal: ["x", "z"]
};

export const inPlaneAngle = (box: PlannerBox, viewId: ViewId): number => {
  const geometry = getFlatGeometry(box, viewId);
  const edge = {
    x: geometry.projected[1].x - geometry.projected[0].x,
    y: geometry.projected[1].y - geometry.projected[0].y
  };
  return Math.atan2(edge.y, edge.x);
};

export const rotate2D = (point: Point2, radians: number): Point2 => {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return {
    x: point.x * c - point.y * s,
    y: point.x * s + point.y * c
  };
};

export const getFlatGeometry = (box: PlannerBox, viewId: ViewId) => {
  const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
  const halfA = box.size[axisA] / 2;
  const halfB = box.size[axisB] / 2;

  // Mid-plane face corners: depth axis = 0, vary axisA and axisB
  const signs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const localCorners3D: Vector3[] = signs.map(([sA, sB]) => {
    const p: Vector3 = { x: 0, y: 0, z: 0 };
    p[axisA] = sA * halfA;
    p[axisB] = sB * halfB;
    return p;
  });

  const projected = localCorners3D.map((corner) => {
    const rotated = rotate3D(corner, box.rotation);
    return projectPoint(
      { x: rotated.x + box.center.x, y: rotated.y + box.center.y, z: rotated.z + box.center.z },
      viewId
    );
  });

  const center2D = projectPoint(box.center, viewId);
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

  // Rotation ring check
  const dist = Math.sqrt(squaredDistance(point, center2D));
  let maxCornerDist = 0;
  for (const corner of geometry.hull) {
    const d = Math.sqrt(squaredDistance(center2D, corner));
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
