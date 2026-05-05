'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalizerCanvas } from '@/features/planner/components/LocalizerCanvas';
import { getSliceAxis, VIEW_CONFIG } from '@/features/planner/lib/geometry';
import type { ViewId } from '@/features/planner/types/planner';
import type { ViewType } from '@/features/workstation/types/mri';
import { ORIENTATION_LABELS } from '@/features/workstation/types/mri';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';
import { useVolume } from '@/features/volume/hooks/useVolume';
import { useVolumeSlice } from '@/features/volume/hooks/useVolumeSlice';
import { getSliceCount } from '@/features/volume/lib/sliceExtractor';
import type { SlicePlane } from '@/features/volume/types/volume';

const AXIS_COLORS: Record<string, string> = {
  A: 'var(--axis-ap)',
  P: 'var(--axis-ap)',
  R: 'var(--axis-rl)',
  L: 'var(--axis-rl)',
  H: 'var(--axis-fh)',
  F: 'var(--axis-fh)',
};

const VIEW_LABELS: Record<ViewType, string> = {
  sagittal: 'SAGITTAL',
  coronal: 'CORONAL',
  axial: 'AXIAL',
};

const VIEW_ACCENT_COLORS: Record<ViewType, string> = {
  sagittal: 'var(--view-sagittal)',
  coronal: 'var(--view-coronal)',
  axial: 'var(--view-axial)',
};

const VIEW_TO_PLANE: Record<ViewType, SlicePlane> = {
  sagittal: 'sagittal',
  coronal: 'coronal',
  axial: 'axial',
};

/**
 * Feature flag: real-time NIfTI volume slice rendering.
 *
 * When `true`, the workstation fetches a 3D NIfTI volume per case and
 * reformats slices on the fly as the user scrolls / drags the planning box —
 * a "DICOM viewer" style experience.
 *
 * When `false` (current default), the panels render the static PNG localizer
 * images defined in `planner-config.ts` → `localizerSets[].views`. The volume
 * loading code, slice extraction, scroll-to-navigate, and W/L controls all
 * remain in place but become unreachable (every consumer is guarded by
 * `if (!volume)` early-returns).
 *
 * Why this is currently OFF:
 *   See `doc/VOLUME_RENDERING_DISCONNECT.md`. TL;DR — the implementation guide
 *   only requires draggable boxes over reference images, not real-time
 *   reformatting. The volume pipeline is a worthwhile future feature but adds
 *   complexity (atlas vs real-patient datasets, orientation handling, slice
 *   coordinate math) that we don't need for the current milestone.
 *
 * To re-enable: set this to `true`. No other changes needed.
 */
const USE_VOLUME_RENDERING = false;

export default function PlanningCanvasPanel({
  view,
  bridge,
}: {
  view: ViewType;
  bridge: PlannerBridge;
}) {
  const viewId = view as ViewId;
  const labels = ORIENTATION_LABELS[view];
  const isEditable = VIEW_CONFIG[viewId].editable;
  const { planner } = bridge;

  const guidanceShowTarget = useGuidanceStore((s) => s.showCorrectPlanning);
  const showTarget = planner.showTarget || planner.showTargetAlways || guidanceShowTarget;

  const hasActiveProtocol = bridge.resolved !== null && planner.currentProtocol !== null;

  // Volume integration — gated by USE_VOLUME_RENDERING (see flag declaration above).
  // When the flag is false, volumeUrl stays null, useVolume returns null, and the
  // imageSrc ternary further down falls through to planner.getImageSource(viewId),
  // which serves the static PNG localizer for this view.
  const volumeUrl = USE_VOLUME_RENDERING
    ? (bridge.resolved?.caseConfig.volumeUrl ?? null)
    : null;
  const { volume } = useVolume(volumeUrl);
  const plane = VIEW_TO_PLANE[view];
  const maxSlices = volume ? getSliceCount(volume, plane) : 0;

  // Percentile-based auto window/level for correct MRI contrast.
  // Uses the 2nd/98th percentile of non-zero voxels to exclude background
  // air and rare outlier intensities. This produces clinically appropriate
  // contrast for both T1 (bright fat, dark CSF) and T2 (bright CSF) data.
  const autoCenter = volume
    ? (volume.dataP2 + volume.dataP98) / 2
    : 500;
  const autoWidth = volume
    ? (volume.dataP98 - volume.dataP2) * 1.1
    : 1000;

  // User-adjustable window/level via right-click drag (standard DICOM interaction)
  const [wlOffset, setWlOffset] = useState<{ dc: number; dw: number }>({ dc: 0, dw: 0 });
  const windowCenter = autoCenter + wlOffset.dc;
  const windowWidth = Math.max(1, autoWidth + wlOffset.dw);

  // Reset W/L offset when volume changes
  useEffect(() => {
    setWlOffset({ dc: 0, dw: 0 });
  }, [volume]);

  const [sliceIndex, setSliceIndex] = useState<Record<SlicePlane, number>>({
    axial: 0,
    sagittal: 0,
    coronal: 0,
  });

  // Initialize slice index to middle when volume loads
  useEffect(() => {
    if (volume) {
      setSliceIndex({
        axial: Math.floor(getSliceCount(volume, 'axial') / 2),
        sagittal: Math.floor(getSliceCount(volume, 'sagittal') / 2),
        coronal: Math.floor(getSliceCount(volume, 'coronal') / 2),
      });
    }
  }, [volume]);

  const currentSliceIndex = sliceIndex[plane] ?? 0;
  const volumeSliceBitmap = useVolumeSlice(
    volume,
    plane,
    currentSliceIndex,
    windowCenter,
    windowWidth
  );

  // Scroll handler for slice navigation — uses native event listener
  // with { passive: false } to properly prevent page scroll
  const sliceStateRef = useRef(sliceIndex);
  sliceStateRef.current = sliceIndex;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !volume) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      const current = sliceStateRef.current[plane] ?? 0;
      const next = Math.max(0, Math.min(current + delta, maxSlices - 1));
      if (next !== current) {
        setSliceIndex((prev) => ({ ...prev, [plane]: next }));
      }
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [volume, plane, maxSlices]);

  // Right-click drag for window/level adjustment.
  // Horizontal drag adjusts window width, vertical drag adjusts window center.
  // This matches the standard DICOM viewer interaction pattern.
  const wlDragRef = useRef<{ startX: number; startY: number; startDC: number; startDW: number } | null>(null);
  const wlOffsetRef = useRef(wlOffset);
  wlOffsetRef.current = wlOffset;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !volume) return;

    const sensitivity = (volume.dataP98 - volume.dataP2) / 300;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      e.preventDefault();
      wlDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startDC: wlOffsetRef.current.dc,
        startDW: wlOffsetRef.current.dw,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!wlDragRef.current) return;
      e.preventDefault();
      const dx = e.clientX - wlDragRef.current.startX;
      const dy = e.clientY - wlDragRef.current.startY;
      setWlOffset({
        dw: wlDragRef.current.startDW + dx * sensitivity,
        dc: wlDragRef.current.startDC - dy * sensitivity,
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) wlDragRef.current = null;
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [volume]);

  // Determine image source: volume slice > uploaded image > localizer fallback
  const imageSrc: string | ImageBitmap =
    volumeSliceBitmap ?? planner.getImageSource(viewId);

  // Measure container
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 320 });

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const side = Math.floor(Math.min(rect.width, rect.height));
    if (side > 0) {
      setSize((prev) => {
        if (prev.width === side && prev.height === side) return prev;
        return { width: side, height: side };
      });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateSize]);

  const hasWlAdjustment = wlOffset.dc !== 0 || wlOffset.dw !== 0;

  // Slice line geometry — derived from the resolved protocol id and the live
  // parameter values. `getSliceAxis` first checks for an explicit
  // `params.SliceOrientation` override (the LR/AP/HF dropdown the user can
  // toggle) and falls back to parsing the protocol id ("sag"/"cor"/axial)
  // when nothing is set. Works for both planner-native ids
  // (brain_t1_sagittal) and workstation card ids (sagittal-t1-tse / cspine_sag_t2).
  const sliceAxis = hasActiveProtocol
    ? getSliceAxis(
        bridge.resolved?.protocolConfig.id ?? planner.protocolId,
        planner.params ?? undefined
      )
    : null;
  const sliceCount = planner.params?.Slices ?? null;
  const sliceThicknessMm = planner.params?.SliceThickness ?? null;
  const sliceGapMm = planner.params?.SliceGap ?? null;

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden animate-fade-in"
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
    >
      {/* View label header with colored accent bar */}
      <div
        className="flex items-center gap-2 px-2 py-1 text-[9px] tracking-[0.15em] uppercase shrink-0"
        style={{
          background: 'var(--chrome-surface)',
          borderBottom: '1px solid var(--chrome-border)',
          borderTop: `3px solid ${VIEW_ACCENT_COLORS[view]}`,
          color: 'var(--text-secondary)',
        }}
      >
        {VIEW_LABELS[view]}
        {hasActiveProtocol && isEditable && (
          <span className="text-[7px] ml-auto" style={{ color: 'var(--accent-blue)' }}>
            EDITABLE
          </span>
        )}
        {hasActiveProtocol && !isEditable && (
          <span className="text-[7px] ml-auto" style={{ color: 'var(--text-muted)' }}>
            DERIVED
          </span>
        )}
        {volume && (
          <span className="text-[7px]" style={{ color: 'var(--text-muted)' }}>
            {currentSliceIndex + 1}/{maxSlices}
          </span>
        )}
      </div>

      {/* Canvas fills remaining space */}
      <div
        ref={containerRef}
        className="flex-1 relative min-h-0 flex items-center justify-center"
      >
        <LocalizerCanvas
          viewId={viewId}
          boxRenderMode={bridge.boxRenderMode}
          imageSrc={imageSrc}
          fallbackImageSrc={planner.localizerSet?.views[viewId] ?? ""}
          box={hasActiveProtocol ? planner.box : null}
          targetBox={hasActiveProtocol ? (planner.currentProtocol?.target ?? null) : null}
          showTarget={showTarget}
          editable={hasActiveProtocol && isEditable}
          onBeginDrag={planner.beginDrag}
          onMoveDrag={planner.moveDrag}
          onEndDrag={planner.endDrag}
          onHitTest={planner.hitTest}
          width={size.width}
          height={size.height}
          sliceAxis={sliceAxis}
          sliceCount={sliceCount}
          sliceThicknessMm={sliceThicknessMm}
          sliceGapMm={sliceGapMm}
        />

        {/* Orientation labels overlay */}
        {Object.entries(labels).map(([position, label]) => (
          <span
            key={position}
            className="absolute text-[12px] font-bold z-10 pointer-events-none"
            style={{
              color: AXIS_COLORS[label] ?? 'var(--text-primary)',
              textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
              ...(position === 'top'
                ? { top: 30, left: '50%', transform: 'translateX(-50%)' }
                : position === 'bottom'
                  ? { bottom: 8, left: '50%', transform: 'translateX(-50%)' }
                  : position === 'left'
                    ? { left: 8, top: '50%', transform: 'translateY(-50%)' }
                    : { right: 8, top: '50%', transform: 'translateY(-50%)' }),
            }}
          >
            {label}
          </span>
        ))}

        {/* W/L indicator — shown when volume loaded */}
        {volume && (
          <div
            className="absolute bottom-1 left-1.5 z-10 pointer-events-none select-none"
            style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'rgba(255,255,255,0.55)',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              lineHeight: 1.4,
            }}
          >
            <div>W:{Math.round(windowWidth)}</div>
            <div>L:{Math.round(windowCenter)}</div>
          </div>
        )}

        {/* W/L reset button — only shown when user has manually adjusted */}
        {hasWlAdjustment && (
          <button
            className="absolute top-[30px] right-1 z-10"
            onClick={() => setWlOffset({ dc: 0, dw: 0 })}
            title="Reset window/level"
            style={{
              fontSize: 7,
              padding: '1px 4px',
              background: 'rgba(0,0,0,0.5)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 3,
              cursor: 'pointer',
              lineHeight: 1.3,
            }}
          >
            W/L
          </button>
        )}
      </div>
    </div>
  );
}
