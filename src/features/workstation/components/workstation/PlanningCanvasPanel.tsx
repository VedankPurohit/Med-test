'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalizerCanvas } from '@/features/planner/components/LocalizerCanvas';
import { VIEW_CONFIG } from '@/features/planner/lib/geometry';
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

// Default window/level for T1 brain
const DEFAULT_WINDOW_CENTER = 600;
const DEFAULT_WINDOW_WIDTH = 1200;

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

  // Volume integration
  const volumeUrl = bridge.resolved?.caseConfig.volumeUrl ?? null;
  const { volume } = useVolume(volumeUrl);
  const plane = VIEW_TO_PLANE[view];
  const maxSlices = volume ? getSliceCount(volume, plane) : 0;
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
    DEFAULT_WINDOW_CENTER,
    DEFAULT_WINDOW_WIDTH
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
      </div>
    </div>
  );
}
