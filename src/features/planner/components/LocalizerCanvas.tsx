"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getFlatGeometry, getProjectedGeometry, inPlaneAngle, normToScreen, pointerToNorm, squaredDistance } from "@/features/planner/lib/geometry";
import { loadImage } from "@/features/planner/lib/media";
import { BoxRenderMode, HandleId, PlannerBox, Point2, ViewId } from "@/features/planner/types/planner";

type LocalizerCanvasProps = {
  viewId: ViewId;
  boxRenderMode: BoxRenderMode;
  imageSrc: string | ImageBitmap;
  fallbackImageSrc?: string;
  box: PlannerBox | null;
  targetBox: PlannerBox | null;
  showTarget: boolean;
  editable: boolean;
  onBeginDrag: (viewId: ViewId, point: Point2, mode: BoxRenderMode) => boolean;
  onMoveDrag: (viewId: ViewId, point: Point2) => void;
  onEndDrag: () => void;
  onHitTest?: (viewId: ViewId, point: Point2, mode: BoxRenderMode) => HandleId | null;
  width?: number;
  height?: number;
};

const DEFAULT_CANVAS_SIZE = 320;

export const LocalizerCanvas = ({
  viewId,
  boxRenderMode,
  imageSrc,
  fallbackImageSrc,
  box,
  targetBox,
  showTarget,
  editable,
  onBeginDrag,
  onMoveDrag,
  onEndDrag,
  onHitTest,
  width: widthProp,
  height: heightProp
}: LocalizerCanvasProps) => {
  const canvasWidth = widthProp ?? DEFAULT_CANVAS_SIZE;
  const canvasHeight = heightProp ?? DEFAULT_CANVAS_SIZE;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [image, setImage] = useState<HTMLImageElement | ImageBitmap | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<HandleId | null>(null);

  // Release pointer capture if component unmounts mid-drag
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas && pointerIdRef.current !== null &&
          canvas.hasPointerCapture(pointerIdRef.current)) {
        canvas.releasePointerCapture(pointerIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    // If imageSrc is an ImageBitmap, use it directly
    if (imageSrc instanceof ImageBitmap) {
      setImage(imageSrc);
      return;
    }

    if (!imageSrc && !fallbackImageSrc) {
      setImage(null);
      return;
    }

    const load = async () => {
      const primary = imageSrc || fallbackImageSrc || "";
      const primaryImage = await loadImage(primary);
      if (!mounted) {
        return;
      }
      if (primaryImage) {
        setImage(primaryImage);
        return;
      }
      if (fallbackImageSrc && fallbackImageSrc !== primary) {
        const fallbackImage = await loadImage(fallbackImageSrc);
        if (mounted) {
          setImage(fallbackImage);
        }
        return;
      }
      setImage(null);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [fallbackImageSrc, imageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    drawBackground(ctx, image, canvasWidth, canvasHeight);
    drawGrid(ctx, canvasWidth, canvasHeight);

    if (showTarget && targetBox) {
      drawOutlineForMode(ctx, targetBox, viewId, boxRenderMode, {
        color: "#f4df9d",
        lineWidth: 1.5,
        dashed: true,
        alpha: 0.8
      }, canvasWidth, canvasHeight);
    }

    if (box) {
      // Draw volume boundary (unrotated extent) before the rotated box
      drawVolumeBoundary(ctx, box, viewId, editable ? "#57fff1" : "#c4a44d", canvasWidth, canvasHeight);

      drawOutlineForMode(ctx, box, viewId, boxRenderMode, {
        color: editable ? "#57fff1" : "#c4a44d",
        lineWidth: editable ? 3.5 : 2,
        dashed: false,
        alpha: editable ? 1 : 0.7,
        glow: editable,
      }, canvasWidth, canvasHeight);

      if (editable && boxRenderMode === "flat2d") {
        drawHandles(ctx, box, viewId, hoveredHandle, canvasWidth, canvasHeight);
      }
    }

    // On-canvas label: EDITABLE or DERIVED
    ctx.font = "bold 9px sans-serif";
    ctx.fillStyle = editable ? "rgba(87,255,241,0.55)" : "rgba(196,164,77,0.5)";
    ctx.fillText(editable ? "EDITABLE" : "DERIVED", 8, 16);
  }, [box, boxRenderMode, canvasWidth, canvasHeight, editable, hoveredHandle, image, showTarget, targetBox, viewId]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!editable || !canvasRef.current) {
      return;
    }

    const point = pointerToNorm(
      event.clientX,
      event.clientY,
      canvasRef.current.getBoundingClientRect(),
      canvasWidth,
      canvasHeight
    );

    const started = onBeginDrag(viewId, point, boxRenderMode);
    if (!started) {
      return;
    }

    canvasRef.current.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    setDragging(true);

    if (hoveredHandle?.kind === "move") {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!editable || !canvasRef.current) {
      return;
    }

    const point = pointerToNorm(
      event.clientX,
      event.clientY,
      canvasRef.current.getBoundingClientRect(),
      canvasWidth,
      canvasHeight
    );

    if (dragging) {
      onMoveDrag(viewId, point);
      return;
    }

    // Hover detection
    if (onHitTest) {
      const handle = onHitTest(viewId, point, boxRenderMode);
      setHoveredHandle(handle);
      canvasRef.current.style.cursor = getCursorForHandle(handle, box, viewId, dragging);
    }
  };

  const releaseDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      return;
    }

    if (canvasRef.current.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    pointerIdRef.current = null;

    if (dragging) {
      setDragging(false);
      onEndDrag();
      canvasRef.current.style.cursor = "default";
      setHoveredHandle(null);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={releaseDrag}
      onPointerLeave={releaseDrag}
      style={{ touchAction: "none", display: "block", width: canvasWidth, height: canvasHeight }}
    />
  );
};

type OutlineStyle = {
  color: string;
  lineWidth: number;
  dashed: boolean;
  alpha: number;
  glow?: boolean;
};

const CUBE_EDGE_INDEX_PAIRS: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7]
];

const drawProjectedOutline = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  style: OutlineStyle,
  w: number,
  h: number
) => {
  const geometry = getProjectedGeometry(box, viewId);
  const projectedCorners = geometry.projected.map((point) => normToScreen(point, w, h));
  const hull = geometry.hull.map((point) => normToScreen(point, w, h));

  if (projectedCorners.length < 8 || hull.length < 3) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = style.alpha;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  if (style.dashed) {
    ctx.setLineDash([7, 5]);
  }
  if (style.glow) {
    ctx.shadowColor = style.color;
    ctx.shadowBlur = 6;
  }

  for (const [start, end] of CUBE_EDGE_INDEX_PAIRS) {
    const startPoint = projectedCorners[start];
    const endPoint = projectedCorners[end];
    if (!startPoint || !endPoint) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Draw outer hull to improve visibility over noisy localizers.
  ctx.lineWidth = Math.max(1, style.lineWidth * 0.85);
  ctx.beginPath();
  ctx.moveTo(hull[0].x, hull[0].y);
  for (let index = 1; index < hull.length; index += 1) {
    ctx.lineTo(hull[index].x, hull[index].y);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.setLineDash([]);
  const center = normToScreen(geometry.center2D, w, h);
  // Crosshair instead of dot
  const arm = 10;
  ctx.beginPath();
  ctx.moveTo(center.x - arm, center.y);
  ctx.lineTo(center.x + arm, center.y);
  ctx.moveTo(center.x, center.y - arm);
  ctx.lineTo(center.x, center.y + arm);
  ctx.strokeStyle = style.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
};

const drawFlatOutline = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  style: OutlineStyle,
  w: number,
  h: number
) => {
  const geometry = getFlatGeometry(box, viewId);
  const corners = geometry.projected.map((point) => normToScreen(point, w, h));

  if (corners.length < 3) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = style.alpha;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  if (style.dashed) {
    ctx.setLineDash([7, 5]);
  }
  if (style.glow) {
    ctx.shadowColor = style.color;
    ctx.shadowBlur = 6;
  }

  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let index = 1; index < corners.length; index += 1) {
    ctx.lineTo(corners[index].x, corners[index].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.setLineDash([]);
  const center = normToScreen(geometry.center2D, w, h);
  // Crosshair instead of dot
  const arm = 10;
  ctx.beginPath();
  ctx.moveTo(center.x - arm, center.y);
  ctx.lineTo(center.x + arm, center.y);
  ctx.moveTo(center.x, center.y - arm);
  ctx.lineTo(center.x, center.y + arm);
  ctx.strokeStyle = style.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
};

/** Draw a dashed rectangle showing the unrotated volume extent */
const drawVolumeBoundary = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  color: string,
  w: number,
  h: number
) => {
  // Create a zero-rotation copy to show the axis-aligned extent
  const unrotated: PlannerBox = {
    center: box.center,
    size: box.size,
    rotation: { rx: 0, ry: 0, rz: 0 },
  };
  const geometry = getFlatGeometry(unrotated, viewId);
  const corners = geometry.projected.map((p) => normToScreen(p, w, h));
  if (corners.length < 3) return;

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

const drawOutlineForMode = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  mode: BoxRenderMode,
  style: OutlineStyle,
  w: number,
  h: number
) => {
  if (mode === "flat2d") {
    drawFlatOutline(ctx, box, viewId, style, w, h);
    return;
  }
  drawProjectedOutline(ctx, box, viewId, style, w, h);
};

const drawBackground = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | ImageBitmap | null,
  width: number,
  height: number
) => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0f161c");
  gradient.addColorStop(1, "#1b2733");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (!image) {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "16px sans-serif";
    ctx.fillText("No localizer image", 90, 165);
    return;
  }

  const scale = Math.max(width / image.width, height / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;

  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, width, height);
};

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;

  for (let i = 1; i < 6; i += 1) {
    const x = (width / 6) * i;
    const y = (height / 6) * i;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
};

const drawHandles = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  hoveredHandle: HandleId | null,
  w: number,
  h: number
) => {
  const geometry = getFlatGeometry(box, viewId);
  const corners = geometry.projected.map((p) => normToScreen(p, w, h));
  const center2D = normToScreen(geometry.center2D, w, h);

  ctx.save();

  // Corner handles: circles (not squares)
  for (let i = 0; i < 4; i++) {
    const c = corners[i];
    const isHovered = hoveredHandle?.kind === "corner" && hoveredHandle.index === i;
    const radius = isHovered ? 8 : 6;

    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#57fff1";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  }

  // Edge midpoint handles: circles
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const isHovered = hoveredHandle?.kind === "edge" && hoveredHandle.index === i;
    const radius = isHovered ? 6 : 5;

    ctx.beginPath();
    ctx.arc(mid.x, mid.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#57fff1";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }

  // Rotation ring: always visible (brighter on hover)
  {
    let maxDist = 0;
    for (const c of corners) {
      const d = Math.sqrt(squaredDistance(center2D, c));
      if (d > maxDist) maxDist = d;
    }
    const ringRadius = maxDist + 10;
    const isHovered = hoveredHandle?.kind === "rotate";

    ctx.beginPath();
    ctx.arc(center2D.x, center2D.y, ringRadius, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isHovered ? "rgba(87, 255, 241, 0.5)" : "rgba(87, 255, 241, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
};

const RESIZE_CURSORS = [
  "ns-resize",     // 0: up
  "nesw-resize",   // 1: up-right
  "ew-resize",     // 2: right
  "nwse-resize",   // 3: down-right
  "ns-resize",     // 4: down
  "nesw-resize",   // 5: down-left
  "ew-resize",     // 6: left
  "nwse-resize"    // 7: up-left
] as const;

const getResizeCursor = (edgeOrCornerIndex: number, angle: number, isCorner: boolean): string => {
  // Compute the base angle for this edge/corner
  // Edges: 0=bottom, 1=right, 2=top, 3=left (in normal screen coords where y-down)
  // Corners: 0=bottom-left, 1=bottom-right, 2=top-right, 3=top-left
  let baseAngle: number;
  if (isCorner) {
    // Corners at 45deg offsets: index 0 -> 225deg, 1 -> 315deg, 2 -> 45deg, 3 -> 135deg
    baseAngle = [225, 315, 45, 135][edgeOrCornerIndex] ?? 0;
  } else {
    // Edges: index 0 -> bottom (270deg normal), 1 -> right (0deg normal), 2 -> top (90deg), 3 -> left (180deg)
    baseAngle = [270, 0, 90, 180][edgeOrCornerIndex] ?? 0;
  }

  // Add the box rotation (convert radians to degrees, negate because screen-y is inverted)
  const totalAngle = (baseAngle - (angle * 180) / Math.PI + 360) % 360;

  // Quantize to nearest 45deg sector
  const sector = Math.round(totalAngle / 45) % 8;
  return RESIZE_CURSORS[sector];
};

const getCursorForHandle = (
  handle: HandleId | null,
  box: PlannerBox | null,
  viewId: ViewId,
  isDragging: boolean
): string => {
  if (!handle) return "default";

  if (handle.kind === "move") {
    return isDragging ? "grabbing" : "grab";
  }

  if (handle.kind === "rotate") {
    return "crosshair";
  }

  const angle = box ? inPlaneAngle(box, viewId) : 0;

  if (handle.kind === "edge") {
    return getResizeCursor(handle.index, angle, false);
  }

  if (handle.kind === "corner") {
    return getResizeCursor(handle.index, angle, true);
  }

  return "default";
};
