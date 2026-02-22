'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { MOCK_SCANNER, MOCK_PATIENT } from '@/features/workstation/lib/mockData';

export default function ScannerStatusBar() {
  const regionId = useWorkstationStore((s) => s.regionId);
  const activeIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const protocols = useWorkstationStore((s) => s.addedProtocols);
  const activeProtocol = activeIndex !== null && activeIndex >= 0 && activeIndex < protocols.length
    ? protocols[activeIndex]
    : null;

  return (
    <div
      className="flex items-center justify-between px-3 h-7 text-[9px] select-none shrink-0"
      style={{
        background: 'var(--toolbar-gradient)',
        borderTop: '1px solid var(--chrome-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--text-secondary)' }}>
          {MOCK_SCANNER.name}
        </span>
        <span style={{ color: 'var(--chrome-border-bright)' }}>|</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {MOCK_SCANNER.coil}
        </span>
        <span style={{ color: 'var(--chrome-border-bright)' }}>|</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {regionId ? regionId.toUpperCase() : '---'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {activeProtocol && (
          <>
            <span
              className="uppercase tracking-wider"
              style={{ color: 'var(--plan-orange)' }}
            >
              {activeProtocol.orientation}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {activeProtocol.label}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-muted)' }}>SAR</span>
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--track-bg)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: '15%', background: 'var(--fb-good)' }}
            />
          </div>
          <span style={{ color: 'var(--text-muted)' }}>0.1 W/kg</span>
        </div>

        <span style={{ color: 'var(--chrome-border-bright)' }}>|</span>

        <span style={{ color: 'var(--text-muted)' }}>
          {MOCK_PATIENT.name}
        </span>
      </div>
    </div>
  );
}
