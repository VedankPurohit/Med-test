"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import type { VolumeData } from "@/features/volume/types/volume";
import type { SlicePlane } from "@/features/volume/types/volume";
import type { PlannerBox } from "@/features/planner/types/planner";
import { simulateScanResult } from "@/features/volume/lib/scanSimulator";

/** Derive the scan orientation from a protocol label.
 *  All protocol labels consistently contain "Axial", "Sagittal", or "Coronal". */
function inferScanPlane(label: string): SlicePlane {
  const lower = label.toLowerCase();
  if (/\bsag/i.test(lower)) return "sagittal";
  if (/\bcor/i.test(lower)) return "coronal";
  // Default to axial for axial protocols and anything unrecognized
  return "axial";
}

/** Readable label for the scan plane */
const PLANE_LABELS: Record<SlicePlane, string> = {
  axial: "Axial",
  sagittal: "Sagittal",
  coronal: "Coronal",
};

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

  const scanPlane = inferScanPlane(protocolLabel);

  const sliceResults = useMemo(() => {
    if (!volume || !box) return [];
    // Percentile-based window/level for correct MRI contrast
    const wc = (volume.dataP2 + volume.dataP98) / 2;
    const ww = (volume.dataP98 - volume.dataP2) * 1.1;
    return simulateScanResult(volume, box, scanPlane, wc, ww);
  }, [volume, box, scanPlane]);

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
        className="modal-scrim"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="modal-dialog animate-scale-in"
        style={{
          padding: 20,
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
            ? `${bitmaps.length} ${PLANE_LABELS[scanPlane].toLowerCase()} slices generated from planned volume position`
            : "No volume data available — scan result simulation requires a loaded NIfTI volume."}
        </div>

        {bitmaps.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
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
              borderRadius: 6,
              color: "var(--text-muted)",
              fontSize: 10,
              border: "1px solid var(--chrome-border)",
            }}
          >
            No volume loaded
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            className="btn-sm btn-primary"
            style={{
              padding: "5px 16px",
              fontSize: 10,
              fontWeight: 500,
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
          borderRadius: 4,
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
