'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalizerCanvas } from '@/features/planner/components/LocalizerCanvas';
import { VIEW_CONFIG } from '@/features/planner/lib/geometry';
import type { ViewId } from '@/features/planner/types/planner';
import type { ViewType } from '@/features/workstation/types/mri';
import { ORIENTATION_LABELS } from '@/features/workstation/types/mri';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';

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

  const showTarget = planner.showTarget || planner.showTargetAlways;

  // Only show the planning box when a specific protocol is actively selected
  const hasActiveProtocol = bridge.resolved !== null && planner.currentProtocol !== null;

  // Measure container to give the canvas dynamic dimensions
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
      {/* View label header */}
      <div
        className="flex items-center gap-2 px-2 py-1 text-[9px] tracking-[0.15em] uppercase shrink-0"
        style={{
          background: 'var(--chrome-surface)',
          borderBottom: '1px solid var(--chrome-border)',
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
      </div>

      {/* Canvas fills remaining space */}
      <div ref={containerRef} className="flex-1 relative min-h-0 flex items-center justify-center">
        <LocalizerCanvas
          viewId={viewId}
          boxRenderMode={bridge.boxRenderMode}
          imageSrc={planner.getImageSource(viewId)}
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
