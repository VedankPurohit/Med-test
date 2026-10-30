'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { MOCK_PATIENT, MOCK_EXAM } from '@/features/workstation/lib/mockData';
import { StatusIcon } from '@/features/guidance/components/StatusIcon';

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
        className="px-3 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <div className="panel-heading mb-1">
          Scan Protocols
        </div>
        <div className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
          {protocols.length} sequence{protocols.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
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
                className="group flex items-stretch"
                style={{
                  background: isActive ? 'var(--sidebar-row-active)' : 'transparent',
                  borderLeft: isActive
                    ? '2px solid var(--accent-blue)'
                    : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--sidebar-row-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left transition-colors"
                  style={{ cursor: canActivate ? 'pointer' : 'default' }}
                  onClick={() => canActivate && activateProtocol(index)}
                >
                  <StatusIcon status={protocol.status} size={8} />

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
                    {protocol.estimatedTime && (
                      <div
                        className="text-[8px] truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {protocol.estimatedTime}
                      </div>
                    )}
                  </div>

                  <span
                    className="text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                    style={{
                      background: isActive ? 'var(--accent-blue-dim)' : 'var(--chrome-surface-raised)',
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                    }}
                  >
                    {protocol.orientation}
                  </span>
                </button>

                {canRemove ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProtocol(protocol.protocolId);
                    }}
                    className="px-2 text-[10px] opacity-0 transition-opacity cursor-pointer group-hover:opacity-100"
                    style={{ color: 'var(--fb-bad)' }}
                    aria-label={`Remove ${protocol.shortName}`}
                  >
                    &#x2715;
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div
        className="px-3 py-2.5 shrink-0"
        style={{
          borderTop: '1px solid var(--chrome-border)',
          background: 'var(--chrome-surface)',
        }}
      >
        <div className="panel-heading mb-1">
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
