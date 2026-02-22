'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import RealTimePanel from './RealTimePanel';
import type { RightPanelTab } from '@/features/workstation/types/workstation';

const TABS: { id: RightPanelTab; label: string }[] = [
  { id: 'realtime', label: 'Real-Time' },
  { id: 'feedback', label: 'Feedback' },
];

export default function BottomRightTabs() {
  const activeTab = useWorkstationStore((s) => s.rightPanelTab);
  const setTab = useWorkstationStore((s) => s.setRightPanelTab);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex items-center h-6 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className="px-3 h-full text-[8px] uppercase tracking-wider transition-colors cursor-pointer"
            style={{
              color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-muted)',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid var(--accent-blue)'
                  : '2px solid transparent',
              background:
                activeTab === tab.id
                  ? 'var(--accent-blue-dim)'
                  : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'realtime' ? (
          <RealTimePanel />
        ) : (
          <div
            className="h-full flex flex-col"
            style={{ background: 'var(--chrome-surface)' }}
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  FEEDBACK
                </div>
                <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
                  Submit a protocol to see scoring
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
