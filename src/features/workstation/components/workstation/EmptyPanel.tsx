'use client';

import type { ViewType } from '@/features/workstation/types/mri';
import { ORIENTATION_LABELS } from '@/features/workstation/types/mri';

interface EmptyPanelProps {
  view: ViewType;
  showScanAnimation?: boolean;
}

const VIEW_LABELS: Record<ViewType, string> = {
  sagittal: 'SAGITTAL',
  coronal: 'CORONAL',
  axial: 'AXIAL',
};

const AXIS_COLORS: Record<string, string> = {
  A: 'var(--axis-ap)',
  P: 'var(--axis-ap)',
  R: 'var(--axis-rl)',
  L: 'var(--axis-rl)',
  H: 'var(--axis-fh)',
  F: 'var(--axis-fh)',
};

export default function EmptyPanel({ view, showScanAnimation }: EmptyPanelProps) {
  const labels = ORIENTATION_LABELS[view];

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
    >
      <div
        className="flex items-center gap-2 px-2 py-1 text-[9px] tracking-[0.15em] uppercase"
        style={{
          background: 'var(--chrome-surface)',
          borderBottom: '1px solid var(--chrome-border)',
          color: 'var(--text-secondary)',
        }}
      >
        {VIEW_LABELS[view]}
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0.2 }}
        >
          <div className="absolute w-px h-full" style={{ background: 'var(--text-muted)' }} />
          <div className="absolute h-px w-full" style={{ background: 'var(--text-muted)' }} />
        </div>

        <div className="text-center z-10">
          <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            NO IMAGE
          </div>
          <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
            Run Survey to load
          </div>
        </div>

        {Object.entries(labels).map(([position, label]) => (
          <span
            key={position}
            className="absolute text-[11px] font-bold"
            style={{
              color: AXIS_COLORS[label],
              opacity: 0.5,
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              ...(position === 'top' ? { top: 8, left: '50%', transform: 'translateX(-50%)' } :
                position === 'bottom' ? { bottom: 8, left: '50%', transform: 'translateX(-50%)' } :
                position === 'left' ? { left: 8, top: '50%', transform: 'translateY(-50%)' } :
                { right: 8, top: '50%', transform: 'translateY(-50%)' }),
            }}
          >
            {label}
          </span>
        ))}

        <div className="panel-scanline absolute inset-0" />

        {showScanAnimation && (
          <div
            className="absolute inset-x-0 h-1 animate-scan-sweep"
            style={{
              background: 'linear-gradient(180deg, transparent, var(--accent-blue), transparent)',
              boxShadow: '0 0 20px var(--accent-blue)',
            }}
          />
        )}
      </div>
    </div>
  );
}
