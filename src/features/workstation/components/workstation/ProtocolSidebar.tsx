'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { MOCK_PATIENT, MOCK_EXAM } from '@/features/workstation/lib/mockData';
import type { ProtocolStatus } from '@/features/workstation/types/workstation';

const STATUS_COLORS: Record<ProtocolStatus, string> = {
  not_planned: 'var(--text-muted)',
  planning: 'var(--plan-orange)',
  accepted: 'var(--accent-blue)',
  completed: 'var(--fb-good)',
  error: 'var(--fb-bad)',
};

export default function ProtocolSidebar() {
  const phase = useWorkstationStore((s) => s.phase);
  const protocols = useWorkstationStore((s) => s.addedProtocols);
  const activeIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const activateProtocol = useWorkstationStore((s) => s.activateProtocol);
  const removeProtocol = useWorkstationStore((s) => s.removeProtocol);

  const canActivate = phase === 'survey-complete' || phase === 'protocol-active';
  const canRemove = phase === 'exam-setup';

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        width: 200,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--chrome-border)',
      }}
    >
      <div
        className="px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <div
          className="text-[8px] uppercase tracking-[0.2em] mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Scan Protocols
        </div>
        <div className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
          {protocols.length} sequence{protocols.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {protocols.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              No protocols added
            </div>
            <div className="text-[8px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
              Use ExamCards below
            </div>
          </div>
        ) : (
          protocols.map((protocol, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={protocol.protocolId}
                className="flex items-center gap-2 px-2 py-1.5 transition-colors group"
                style={{
                  cursor: canActivate ? 'pointer' : 'default',
                  background: isActive ? 'var(--sidebar-row-active)' : 'transparent',
                  borderLeft: isActive
                    ? '2px solid var(--accent-blue)'
                    : '2px solid transparent',
                }}
                onClick={() => canActivate && activateProtocol(index)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--sidebar-row-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: STATUS_COLORS[protocol.status],
                    boxShadow: protocol.status === 'planning'
                      ? '0 0 6px var(--plan-orange)'
                      : 'none',
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div
                    className="text-[10px] truncate"
                    style={{
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {protocol.shortName}
                  </div>
                </div>

                <span
                  className="text-[7px] px-1 py-0.5 rounded uppercase tracking-wide shrink-0"
                  style={{
                    background: 'var(--chrome-surface-raised)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {protocol.status.replace('_', ' ')}
                </span>

                {canRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProtocol(protocol.protocolId);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity cursor-pointer"
                    style={{ color: 'var(--fb-bad)' }}
                  >
                    &#x2715;
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div
        className="px-3 py-2 shrink-0"
        style={{
          borderTop: '1px solid var(--chrome-border)',
          background: 'var(--chrome-surface)',
        }}
      >
        <div
          className="text-[8px] uppercase tracking-[0.2em] mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Patient
        </div>
        <div className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {MOCK_PATIENT.name}
        </div>
        <div className="text-[8px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {MOCK_PATIENT.gender}/{MOCK_PATIENT.age}Y &middot; {MOCK_PATIENT.dob}
        </div>
        <div className="text-[8px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {MOCK_EXAM.indication}
        </div>
      </div>
    </div>
  );
}
