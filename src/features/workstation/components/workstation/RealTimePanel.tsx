'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';

export default function RealTimePanel({ bridge }: { bridge?: PlannerBridge }) {
  const phase = useWorkstationStore((s) => s.phase);
  const activeProtocolIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const activeProtocol = useWorkstationStore((s) =>
    s.activeProtocolIndex !== null ? s.addedProtocols[s.activeProtocolIndex] ?? null : null
  );
  const isSurveyDone = phase === 'survey-complete' || phase === 'protocol-active';
  const teaching = bridge?.planner.currentProtocol?.teaching;
  const activeStatus = activeProtocolIndex !== null ? activeProtocol?.status ?? null : null;

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
                {activeProtocol ? activeProtocol.label : 'Awaiting sequence'}
              </div>
              <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
                {activeStatus === 'completed'
                  ? 'Simulated scan complete'
                  : activeStatus === 'accepted'
                    ? 'Planning accepted. Ready to run.'
                    : activeStatus === 'error'
                      ? 'Planning needs correction'
                      : activeStatus === 'planning'
                        ? 'Active planning in progress'
                        : 'Select and plan a protocol'}
              </div>
              {teaching && (
                <>
                  <div className="text-[8px] mt-3 max-w-[180px] mx-auto leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {teaching.purpose}
                  </div>
                  <div className="text-[8px] mt-2 max-w-[180px] mx-auto leading-snug" style={{ color: 'var(--text-muted)' }}>
                    Hint: {teaching.planningHint}
                  </div>
                </>
              )}
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
