'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';

export default function RealTimePanel() {
  const phase = useWorkstationStore((s) => s.phase);
  const isSurveyDone = phase === 'survey-complete' || phase === 'protocol-active';

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
    >
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{
          background: 'var(--chrome-surface)',
          borderBottom: '1px solid var(--chrome-border)',
        }}
      >
        <span
          className="text-[9px] tracking-[0.15em] uppercase"
          style={{ color: 'var(--text-secondary)' }}
        >
          REAL-TIME VIEW
        </span>
        {isSurveyDone && (
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
              style={{ background: 'var(--fb-good)' }}
            />
            <span className="text-[8px]" style={{ color: 'var(--fb-good)' }}>
              READY
            </span>
          </span>
        )}
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {isSurveyDone ? (
          <>
            <div className="absolute inset-0 animate-shimmer" />
            <div className="text-center z-10">
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Awaiting acquisition
              </div>
              <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
                Select and plan a protocol
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              NO SIGNAL
            </div>
            <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
              Run survey first
            </div>
          </div>
        )}

        <div className="panel-scanline absolute inset-0" />
      </div>
    </div>
  );
}
