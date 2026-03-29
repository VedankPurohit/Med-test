"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import type { VolumeData } from "@/features/volume/types/volume";
import type { PlannerBox } from "@/features/planner/types/planner";
import { simulateScanResult } from "@/features/volume/lib/scanSimulator";

interface ScanResultPanelProps {
  open: boolean;
  volume: VolumeData | null;
  box: PlannerBox | null;
  protocolLabel: string;
  onClose: () => void;
}

export function ScanResultPanel({
  open,
  volume,
  box,
  protocolLabel,
  onClose,
}: ScanResultPanelProps) {
  const [bitmaps, setBitmaps] = useState<ImageBitmap[]>([]);

  const sliceResults = useMemo(() => {
    if (!volume || !box) return [];
    return simulateScanResult(volume, box, "axial", 600, 1200);
  }, [volume, box]);

  // Convert SliceResults to ImageBitmaps
  useEffect(() => {
    if (sliceResults.length === 0) {
      setBitmaps([]);
      return;
    }

    let cancelled = false;
    const promises = sliceResults.map((slice) => {
      const imageData = new ImageData(slice.pixels, slice.width, slice.height);
      return createImageBitmap(imageData);
    });

    Promise.all(promises)
      .then((results) => {
        if (!cancelled) setBitmaps(results);
      })
      .catch(() => {
        if (!cancelled) setBitmaps([]);
      });

    return () => {
      cancelled = true;
    };
  }, [sliceResults]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Scrim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
        }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="animate-scale-in"
        style={{
          position: "relative",
          background: "var(--chrome-surface)",
          border: "1px solid var(--chrome-border)",
          borderRadius: 8,
          padding: 16,
          maxWidth: 600,
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          SCAN RESULT — {protocolLabel}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          {bitmaps.length > 0
            ? `${bitmaps.length} slices generated from planned volume position`
            : "No volume data available — scan result simulation requires a loaded NIfTI volume."}
        </div>

        {bitmaps.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 4,
            }}
          >
            {bitmaps.map((bmp, i) => (
              <SliceCanvas key={i} bitmap={bmp} index={i} />
            ))}
          </div>
        ) : (
          <div
            style={{
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--panel-bg)",
              borderRadius: 4,
              color: "var(--text-muted)",
              fontSize: 10,
            }}
          >
            No volume loaded
          </div>
        )}

        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "4px 16px",
              fontSize: 10,
              borderRadius: 4,
              background: "var(--accent-blue)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SliceCanvas({ bitmap, index }: { bitmap: ImageBitmap; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0);
    }
  }, [bitmap]);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 2,
          background: "#000",
          display: "block",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 2,
          right: 4,
          fontSize: 7,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {index + 1}
      </span>
    </div>
  );
}
