"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getFlatGeometry, getProjectedGeometry, normToScreen, pointerToNorm } from "@/features/planner/lib/geometry";
import { loadImage } from "@/features/planner/lib/media";
import { BoxRenderMode, PlannerBox, Point2, ViewId } from "@/features/planner/types/planner";

type LocalizerCanvasProps = {
  viewId: ViewId;
  boxRenderMode: BoxRenderMode;
  imageSrc: string;
  box: PlannerBox | null;
  targetBox: PlannerBox | null;
  showTarget: boolean;
  editable: boolean;
  onBeginDrag: (viewId: ViewId, point: Point2, mode: BoxRenderMode) => boolean;
  onMoveDrag: (viewId: ViewId, point: Point2) => void;
  onEndDrag: () => void;
};

const CANVAS_SIZE = 320;

export const LocalizerCanvas = ({
  viewId,
  boxRenderMode,
  imageSrc,
  box,
  targetBox,
  showTarget,
  editable,
  onBeginDrag,
  onMoveDrag,
  onEndDrag
}: LocalizerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!imageSrc) {
      setImage(null);
      return;
    }

    loadImage(imageSrc).then((nextImage) => {
      if (mounted) {
        setImage(nextImage);
      }
    });

    return () => {
      mounted = false;
    };
  }, [imageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    drawBackground(ctx, image, CANVAS_SIZE, CANVAS_SIZE);
    drawGrid(ctx, CANVAS_SIZE, CANVAS_SIZE);

    if (showTarget && targetBox) {
      drawOutlineForMode(ctx, targetBox, viewId, boxRenderMode, {
        color: "#f4df9d",
        lineWidth: 1.5,
        dashed: true,
        alpha: 0.8
      });
    }

    if (box) {
      drawOutlineForMode(ctx, box, viewId, boxRenderMode, {
        color: editable ? "#57fff1" : "#ffe49d",
        lineWidth: editable ? 2.8 : 2,
        dashed: false,
        alpha: 1
      });
    }

    if (!editable) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, CANVAS_SIZE - 26, CANVAS_SIZE, 26);
      ctx.fillStyle = "#f4f7fb";
      ctx.font = "12px sans-serif";
      ctx.fillText("Derived from shared 3D prescription", 10, CANVAS_SIZE - 9);
    }
  }, [box, boxRenderMode, editable, image, showTarget, targetBox, viewId]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!editable || !canvasRef.current) {
      return;
    }

    const point = pointerToNorm(
      event.clientX,
      event.clientY,
      canvasRef.current.getBoundingClientRect(),
      CANVAS_SIZE,
      CANVAS_SIZE
    );

    const started = onBeginDrag(viewId, point, boxRenderMode);
    if (!started) {
      return;
    }

    canvasRef.current.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!editable || !dragging || !canvasRef.current) {
      return;
    }

    const point = pointerToNorm(
      event.clientX,
      event.clientY,
      canvasRef.current.getBoundingClientRect(),
      CANVAS_SIZE,
      CANVAS_SIZE
    );

    onMoveDrag(viewId, point);
  };

  const releaseDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      return;
    }

    if (canvasRef.current.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }

    if (dragging) {
      setDragging(false);
      onEndDrag();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={releaseDrag}
      onPointerLeave={releaseDrag}
      style={{ touchAction: "none" }}
    />
  );
};

type OutlineStyle = {
  color: string;
  lineWidth: number;
  dashed: boolean;
  alpha: number;
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
  style: OutlineStyle
) => {
  const geometry = getProjectedGeometry(box, viewId);
  const projectedCorners = geometry.projected.map((point) => normToScreen(point, CANVAS_SIZE, CANVAS_SIZE));
  const hull = geometry.hull.map((point) => normToScreen(point, CANVAS_SIZE, CANVAS_SIZE));

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
  const center = normToScreen(geometry.center2D, CANVAS_SIZE, CANVAS_SIZE);
  ctx.beginPath();
  ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = style.color;
  ctx.fill();
  ctx.restore();
};

const drawFlatOutline = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  style: OutlineStyle
) => {
  const geometry = getFlatGeometry(box, viewId);
  const corners = geometry.projected.map((point) => normToScreen(point, CANVAS_SIZE, CANVAS_SIZE));

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

  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let index = 1; index < corners.length; index += 1) {
    ctx.lineTo(corners[index].x, corners[index].y);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.setLineDash([]);
  const center = normToScreen(geometry.center2D, CANVAS_SIZE, CANVAS_SIZE);
  ctx.beginPath();
  ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = style.color;
  ctx.fill();
  ctx.restore();
};

const drawOutlineForMode = (
  ctx: CanvasRenderingContext2D,
  box: PlannerBox,
  viewId: ViewId,
  mode: BoxRenderMode,
  style: OutlineStyle
) => {
  if (mode === "flat2d") {
    drawFlatOutline(ctx, box, viewId, style);
    return;
  }
  drawProjectedOutline(ctx, box, viewId, style);
};

const drawBackground = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
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
