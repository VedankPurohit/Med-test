'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';

export default function FeedbackPanel({ bridge }: { bridge: PlannerBridge }) {
  const { planner } = bridge;
  const lastScore = planner.lastScore;
  const setRightPanelTab = useWorkstationStore((s) => s.setRightPanelTab);

  const handleCheck = () => {
    planner.checkPlanning();
    setRightPanelTab('feedback');
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--chrome-surface)' }}>
      {/* Action buttons */}
      <div
        className="flex gap-1 px-2 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <button
          onClick={handleCheck}
          className="px-2 py-0.5 rounded text-[8px] cursor-pointer transition-colors"
          style={{
            background: 'var(--accent-blue-dim)',
            color: 'var(--accent-blue)',
            border: '1px solid rgba(37,99,235,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-blue)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-blue-dim)';
            e.currentTarget.style.color = 'var(--accent-blue)';
          }}
        >
          Check Planning
        </button>
        <button
          onClick={planner.resetPlan}
          className="px-2 py-0.5 rounded text-[8px] cursor-pointer transition-colors"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--chrome-border)',
          }}
        >
          Reset
        </button>
      </div>

      {/* Score display */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {lastScore ? (
          <>
            {/* Pass/fail badge */}
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: lastScore.pass ? 'var(--fb-good)' : 'var(--fb-bad)' }}
              />
              <span
                className="text-[11px] font-semibold"
                style={{ color: lastScore.pass ? 'var(--fb-good)' : 'var(--fb-bad)' }}
              >
                {lastScore.pass ? 'PASS' : 'NOT YET'} — {lastScore.finalScorePercent}%
              </span>
            </div>

            {/* Component scores */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              {[
                { label: 'Position', value: lastScore.componentScores.positionPercent },
                { label: 'Coverage', value: lastScore.componentScores.coveragePercent },
                { label: 'Angulation', value: lastScore.componentScores.angulationPercent },
                { label: 'Parameters', value: lastScore.componentScores.parametersPercent },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[7px] uppercase" style={{ color: 'var(--text-muted)' }}>
                    {item.label}
                  </div>
                  <div
                    className="text-[10px]"
                    style={{
                      color:
                        item.value >= 75
                          ? 'var(--fb-good)'
                          : item.value >= 55
                            ? 'var(--fb-warn)'
                            : 'var(--fb-bad)',
                    }}
                  >
                    {item.value}%
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback items */}
            <div className="space-y-1">
              {lastScore.feedback.map((line, i) => (
                <div
                  key={i}
                  className="text-[9px] leading-snug"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {line}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                FEEDBACK
              </div>
              <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
                {planner.statusMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
