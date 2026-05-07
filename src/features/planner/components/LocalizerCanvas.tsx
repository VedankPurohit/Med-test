"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  getFlatGeometry,
  getProjectedGeometry,
  getSlicePlaneCube3D,
  getSlicePlaneFlat2D,
  getSliceSlabs,
  NORM_TO_MM,
  normToScreen,
  pointerToNorm,
  squaredDistance
} from "@/features/planner/lib/geometry";
import { loadImage } from "@/features/planner/lib/media";
import { BoxRenderMode, HandleId, PlannerBox, Point2, Vector3, ViewId } from "@/features/planner/types/planner";

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
  /** Box-local axis along which slices stack (x/y/z). Pass null to hide slice lines. */
  sliceAxis?: keyof Vector3 | null;
  /** Number of slices in the protocol. Pass null/0 to hide slice lines. */
  sliceCount?: number | null;
  /** Slice thickness in mm (controls visual slab width vs gap). */
  sliceThicknessMm?: number | null;
  /** Slice gap in mm (controls visual gap between slabs). */
  sliceGapMm?: number | null;
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
  height: heightProp,
  sliceAxis = null,
  sliceCount = null,
  sliceThicknessMm = null,
  sliceGapMm = null
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
      drawOutlineForMode(ctx, targetBox, viewId, boxRenderMode, editable, {
        color: "#f4df9d",
        lineWidth: 1.5,
        dashed: true,
        alpha: 0.8
      }, canvasWidth, canvasHeight);
    }

    if (box) {
      // Draw volume boundary (unrotated extent) before the rotated box
      drawVolumeBoundary(ctx, box, viewId, editable ? "#57fff1" : "#c4a44d", canvasWidth, canvasHeight);

      drawOutlineForMode(ctx, box, viewId, boxRenderMode, editable, {
        color: editable ? "#57fff1" : "#c4a44d",
        lineWidth: editable ? 3.5 : 2,
        dashed: false,
        alpha: editable ? 1 : 0.7,
        glow: editable,
      }, canvasWidth, canvasHeight);

      // Slice line stack — drawn between the box outline and the interaction
      // handles so the lines feel like part of the volume. Skipped when the
      // protocol's slice axis is the view's out-of-plane axis (the box would
      // represent a single slice's footprint, so there are no lines to show).
      if (sliceAxis && sliceCount && sliceCount > 0) {
        drawSliceLines(
          ctx,
          box,
          viewId,
          boxRenderMode,
          editable,
          {
            sliceAxis,
            sliceCount,
            thicknessMm: sliceThicknessMm ?? 0,
            gapMm: sliceGapMm ?? 0,
            color: editable ? "#9efff3" : "#d4be8d",
            alpha: 0.55,
            lineWidth: 1
          },
          canvasWidth,
          canvasHeight
        );
      }

      // Both render modes expose only move + rotate gestures by design. Box
      // size is parameter-driven (Slices, SliceThickness, SliceGap on the
      // slice axis; FOV in-plane) and is updated through the
      // DynamicParameterPanel inputs — there are intentionally no corner /
      // edge resize handles to grab.
      if (editable && boxRenderMode === "flat2d") {
        drawHandles(ctx, box, viewId, hoveredHandle, canvasWidth, canvasHeight);
      }
      if (editable && boxRenderMode === "cube3d") {
        drawCubeRotationRing(ctx, box, viewId, hoveredHandle, canvasWidth, canvasHeight);
      }
    }

    // On-canvas label: anatomical view name (AXIAL / SAGITTAL / CORONAL),
    // matching the labels real MRI consoles show in the corner of each
    // localizer pane. Color subtly reflects which views the user can
    // drive directly (editable) vs. those that follow the box state.
    ctx.font = "bold 9px sans-serif";
    ctx.fillStyle = editable ? "rgba(87,255,241,0.55)" : "rgba(196,164,77,0.5)";
    ctx.fillText(viewId.toUpperCase(), 8, 16);
  }, [
    box,
    boxRenderMode,
    canvasWidth,
    canvasHeight,
    editable,
    hoveredHandle,
    image,
    showTarget,
    targetBox,
    viewId,
    sliceAxis,
    sliceCount,
    sliceThicknessMm,
    sliceGapMm
  ]);

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

/**
 * Render the projected convex hull as a single closed 2D polygon.
 *
 * Used by the cube3d path (where it complements the 12-edge cube wireframe
 * in `drawProjectedOutline`). flat2d intentionally does NOT call this — its
 * contract is "always a 4-corner quadrilateral, never a 5-/6-sided cube
 * silhouette." flat2d gets cross-view rotational coupling a different way:
 * `getFlatGeometry` projects the in-plane center face of the box through
 * the full 3D rotation, so the rectangle foreshortens / tilts in response
 * to any view's rotation while staying a quadrilateral. Use cube3d when
 * the user wants the full 8-corner wireframe.
 */
const drawHullOutline = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  style: OutlineStyle,
  w: number,
  h: number
) => {
  const geometry = getProjectedGeometry(box, viewId);
  const hull = geometry.hull.map((point) => normToScreen(point, w, h));

  if (hull.length < 3) {
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
  ctx.moveTo(hull[0].x, hull[0].y);
  for (let index = 1; index < hull.length; index += 1) {
    ctx.lineTo(hull[index].x, hull[index].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Crosshair at projected box center, matching the other modes' look.
  ctx.setLineDash([]);
  const center = normToScreen(geometry.center2D, w, h);
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

const drawOutlineForMode = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  mode: BoxRenderMode,
  editable: boolean,
  style: OutlineStyle,
  w: number,
  h: number
) => {
  if (mode === "flat2d") {
    // Both editable and derived views render a 4-corner quadrilateral
    // via drawFlatOutline. The corners come from getFlatGeometry, which
    // projects the in-plane center face of the box through the full 3D
    // rotation pipeline — so out-of-plane Euler rotations foreshorten the
    // rectangle (it tilts / squishes into a parallelogram) while in-plane
    // Euler rotation tilts it. Crucially, the result is always 4 corners,
    // never a 5-/6-sided silhouette — that hexagonal cube wireframe is
    // reserved exclusively for cube3d via drawProjectedOutline.
    drawFlatOutline(ctx, box, viewId, style, w, h);
    return;
  }
  drawProjectedOutline(ctx, box, viewId, style, w, h);
};

type SliceLineStyle = {
  sliceAxis: keyof Vector3;
  sliceCount: number;
  thicknessMm: number;
  gapMm: number;
  color: string;
  alpha: number;
  lineWidth: number;
};

/**
 * Draw the slice stack inside the planning box. Each slice is shown as a
 * thin slab outline (front + back boundary planes), giving the user a
 * visual count and a sense of thickness vs gap.
 *
 * Math reuses the same pipeline as the box outline:
 *   - cube3d: rotate3D → translate → projectPoint → normToScreen
 *   - flat2d: rotate3D of the in-plane center face → translate →
 *             projectPoint → normToScreen
 *
 * Both modes apply the full 3D rotation, so slabs stay glued to the
 * (possibly foreshortened) box outline through any rotation, including
 * rotations applied via other views. The flat2d difference is that we
 * project a single in-plane face, not the whole cube — so slabs render
 * as 2D segments inside a 4-corner rectangle, not as quads of a 3D cube.
 *
 * Visibility rule: slice lines render on every view, matching real MRI
 * consoles where each localizer pane shows the prescribed slice stack
 * regardless of which view the user happens to be driving. When the slice
 * axis is a view's out-of-plane axis, getSlicePlaneFlat2D returns []
 * because all N slabs project onto the same rectangle — geometrically
 * correct, not a bug.
 */
const drawSliceLines = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  mode: BoxRenderMode,
  editable: boolean,
  style: SliceLineStyle,
  w: number,
  h: number
) => {
  // `editable` is intentionally not consulted here. Real consoles draw the
  // slice stack on every localizer pane; gating to editable views was a
  // training-tool simplification we no longer want.
  void editable;

  if (box.size[style.sliceAxis] <= 0) {
    return;
  }

  const slabs = getSliceSlabs(
    style.sliceCount,
    style.thicknessMm,
    style.gapMm,
    1 / NORM_TO_MM
  );

  // Mirror the outline's projection mode so slabs and outline obey the
  // same contract:
  //   - flat2d: full 3D projection of the in-plane center face. Slabs
  //     are 2D segments glued to the box outline; rotations on any Euler
  //     axis foreshorten / tilt them in lockstep with the rectangle.
  //     When the slice axis is the view's out-of-plane axis (e.g.
  //     sagittal-view + sagittal-protocol with SliceOrientation = LR),
  //     getSlicePlaneFlat2D returns [] because all N slabs project onto
  //     the same rectangle — geometrically correct in flat2d. To see
  //     those slices distinctly, change SliceOrientation to AP / HF, or
  //     switch to cube3d render mode.
  //   - cube3d: full 3D projection of cube faces. Slabs draw as quads of
  //     the actual 3D cube, matching how the cube outline draws.
  ctx.save();
  ctx.globalAlpha = style.alpha;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;

  for (const slab of slabs) {
    const positions = [slab.center - slab.halfWidth, slab.center + slab.halfWidth];
    for (const planePos of positions) {
      const corners = mode === "cube3d"
        ? getSlicePlaneCube3D(box, viewId, style.sliceAxis, planePos)
        : getSlicePlaneFlat2D(box, viewId, style.sliceAxis, planePos);

      if (corners.length < 2) {
        continue;
      }

      const screen = corners.map((point) => normToScreen(point, w, h));
      ctx.beginPath();
      ctx.moveTo(screen[0].x, screen[0].y);
      for (let i = 1; i < screen.length; i += 1) {
        ctx.lineTo(screen[i].x, screen[i].y);
      }
      // cube3d returns 4 corners (a quad) — close the loop. flat2d returns 2
      // endpoints (a segment) — leave it open.
      if (screen.length >= 3) {
        ctx.closePath();
      }
      ctx.stroke();
    }
  }

  ctx.restore();
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

  // Rotation ring + center pivot dot. Corner/edge resize handles are
  // intentionally omitted — the canvas exposes only move + rotate gestures.
  // Box size is parameter-driven (Slices, SliceThickness, SliceGap on the
  // slice axis; FOV in-plane) and is updated via the DynamicParameterPanel
  // inputs.
  let maxDist = 0;
  for (const c of corners) {
    const d = Math.sqrt(squaredDistance(center2D, c));
    if (d > maxDist) maxDist = d;
  }
  const ringRadius = maxDist + 10;
  const isRotateHovered = hoveredHandle?.kind === "rotate";

  ctx.beginPath();
  ctx.arc(center2D.x, center2D.y, ringRadius, 0, Math.PI * 2);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = isRotateHovered ? "rgba(87, 255, 241, 0.5)" : "rgba(87, 255, 241, 0.2)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Yellow pivot dot at the box center — visual anchor for translation,
  // matching the look real-world Philips/Siemens consoles use. The
  // entire box interior already hits as `move`, so this is purely
  // a visual cue (no new hit-test branch needed). Brightens on `move`
  // hover so the user sees it's interactive.
  const isMoveHovered = hoveredHandle?.kind === "move";
  const pivotRadius = isMoveHovered ? 6 : 5;
  ctx.beginPath();
  ctx.arc(center2D.x, center2D.y, pivotRadius, 0, Math.PI * 2);
  ctx.fillStyle = isMoveHovered ? "#ffe066" : "#f4c542";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.stroke();

  ctx.restore();
};

/**
 * Cube3d rotation ring.
 *
 * Drawn around the projected hull (the cube wireframe's silhouette). Visible
 * thickness exactly matches hitTestCube's hit zone so the user grabs where they
 * see. Brightens on hover.
 *
 * Offsets here are in normalized-space units (the same space hitTestCube uses).
 * Conversion to canvas pixels: 1 norm unit ≈ canvasWidth / 2 pixels. We compute
 * everything in pixels for drawing convenience, but the *normalized* offsets are
 * the source of truth — keep CUBE_RING_OFFSET_INNER/OUTER in sync with
 * geometry.ts hitTestCube.
 */
const CUBE_RING_OFFSET_INNER = 0.01; // norm
const CUBE_RING_OFFSET_OUTER = 0.20; // norm

const drawCubeRotationRing = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  hoveredHandle: HandleId | null,
  w: number,
  h: number
) => {
  const geometry = getProjectedGeometry(box, viewId);
  const center2D = normToScreen(geometry.center2D, w, h);
  const hullScreen = geometry.hull.map((p) => normToScreen(p, w, h));

  let maxDistPx = 0;
  for (const c of hullScreen) {
    const d = Math.sqrt(squaredDistance(center2D, c));
    if (d > maxDistPx) maxDistPx = d;
  }

  // Convert normalized offsets to pixels using the same scale normToScreen uses.
  // Smaller axis governs the conversion to stay conservative on non-square canvases.
  const pxPerNormUnit = Math.min(w, h) / 2;
  const innerPx = maxDistPx + CUBE_RING_OFFSET_INNER * pxPerNormUnit;
  const outerPx = maxDistPx + CUBE_RING_OFFSET_OUTER * pxPerNormUnit;
  const ringMidPx = (innerPx + outerPx) / 2;
  const ringThicknessPx = Math.max(1, outerPx - innerPx);

  const isHovered = hoveredHandle?.kind === "rotate";

  ctx.save();
  // Filled translucent annulus so the user clearly sees the grab zone.
  ctx.beginPath();
  ctx.arc(center2D.x, center2D.y, outerPx, 0, Math.PI * 2);
  ctx.arc(center2D.x, center2D.y, innerPx, 0, Math.PI * 2, true);
  ctx.fillStyle = isHovered
    ? "rgba(87, 255, 241, 0.18)"
    : "rgba(87, 255, 241, 0.08)";
  ctx.fill("evenodd");

  // Dashed midline for crisp visual reference.
  ctx.beginPath();
  ctx.arc(center2D.x, center2D.y, ringMidPx, 0, Math.PI * 2);
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = isHovered
    ? "rgba(87, 255, 241, 0.85)"
    : "rgba(87, 255, 241, 0.45)";
  ctx.lineWidth = isHovered ? 2 : 1.25;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Suppress unused-var warning if ringThicknessPx isn't consumed below.
  void ringThicknessPx;
};

const getCursorForHandle = (
  handle: HandleId | null,
  _box: PlannerBox | null,
  _viewId: ViewId,
  isDragging: boolean
): string => {
  if (!handle) return "default";

  if (handle.kind === "move") {
    return isDragging ? "grabbing" : "grab";
  }

  if (handle.kind === "rotate") {
    return "crosshair";
  }

  // Corner / edge hits are ignored now that resize-via-UI is disabled — the
  // user resizes the box via parameter inputs (Slices, SliceThickness, FOV).
  return "default";
};
