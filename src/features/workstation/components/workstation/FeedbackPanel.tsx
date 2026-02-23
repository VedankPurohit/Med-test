'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { haveVisitedAllSelectedProtocols } from "@/features/workstation/lib/examSummary";
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';

export default function FeedbackPanel({ bridge }: { bridge: PlannerBridge }) {
  const router = useRouter();
  const { planner } = bridge;
  const lastScore = planner.lastScore;
  const setRightPanelTab = useWorkstationStore((s) => s.setRightPanelTab);
  const addedProtocols = useWorkstationStore((s) => s.addedProtocols);
  const setSubmissionSummary = useWorkstationStore((s) => s.setSubmissionSummary);
  const allVisited = useMemo(() => haveVisitedAllSelectedProtocols(addedProtocols), [addedProtocols]);
  const remainingProtocols = useMemo(
    () => addedProtocols.filter((protocol) => protocol.status === "pending").length,
    [addedProtocols]
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCheck = () => {
    void planner.checkPlanning();
    setRightPanelTab('feedback');
  };

  const handleSubmitExam = async () => {
    try {
      setSubmitError(null);
      const response = await fetch("/api/v1/workstation/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          protocols: addedProtocols,
          placements: planner.getAllPlacements()
        })
      });

      if (!response.ok) {
        throw new Error(`Submit failed (${response.status}).`);
      }

      const data = await response.json();
      if (!data.allowSubmit) {
        return;
      }

      setSubmissionSummary(data.summary);
      setRightPanelTab("feedback");
      router.push("/report");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submit failed.");
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden" style={{ background: 'var(--chrome-surface)' }}>
      {/* Action buttons */}
      <div
        className="flex gap-1 px-2 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <button
          onClick={() => void handleCheck()}
          disabled={planner.isChecking}
          className="px-2 py-0.5 rounded text-[8px] cursor-pointer transition-colors"
          style={{
            background: planner.isChecking ? "var(--chrome-surface-raised)" : 'var(--accent-blue-dim)',
            color: planner.isChecking ? "var(--text-muted)" : 'var(--accent-blue)',
            border: planner.isChecking ? "1px solid var(--chrome-border)" : '1px solid rgba(37,99,235,0.3)',
            cursor: planner.isChecking ? "not-allowed" : "pointer"
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
          {planner.isChecking ? "Checking..." : "Check Planning"}
        </button>
        <button
          onClick={planner.resetPlan}
          type="button"
          className="px-2 py-0.5 rounded text-[8px] cursor-pointer transition-colors"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--chrome-border)',
          }}
        >
          Reset
        </button>
        <button
          onClick={() => void handleSubmitExam()}
          type="button"
          disabled={!allVisited}
          className="px-2 py-0.5 rounded text-[8px] transition-colors ml-auto"
          style={{
            background: allVisited ? "rgba(22, 163, 74, 0.15)" : "transparent",
            color: allVisited ? "var(--fb-good)" : "var(--text-muted)",
            border: allVisited ? "1px solid rgba(22,163,74,0.35)" : "1px solid var(--chrome-border)",
            cursor: allVisited ? "pointer" : "not-allowed",
            opacity: allVisited ? 1 : 0.7
          }}
        >
          Submit Session
        </button>
      </div>

      {/* Score display */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5">
        {submitError && (
          <div className="mb-2 text-[8px]" style={{ color: "var(--fb-bad)" }}>
            {submitError}
          </div>
        )}

        {!allVisited && addedProtocols.length > 0 && (
          <div className="mb-2 text-[8px]" style={{ color: "var(--text-muted)" }}>
            Visit all selected protocols to unlock submit ({remainingProtocols} remaining).
          </div>
        )}

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
                  key={`${i}-${line}`}
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
