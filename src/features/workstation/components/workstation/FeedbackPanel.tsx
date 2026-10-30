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
  const activeProtocolIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const activeProtocolStatus = useWorkstationStore((s) =>
    s.activeProtocolIndex !== null ? s.addedProtocols[s.activeProtocolIndex]?.status ?? null : null
  );
  const setRightPanelTab = useWorkstationStore((s) => s.setRightPanelTab);
  const addedProtocols = useWorkstationStore((s) => s.addedProtocols);
  const markProtocolAccepted = useWorkstationStore((s) => s.markProtocolAccepted);
  const markProtocolNeedsRetry = useWorkstationStore((s) => s.markProtocolNeedsRetry);
  const completeProtocol = useWorkstationStore((s) => s.completeProtocol);
  const setSubmissionSummary = useWorkstationStore((s) => s.setSubmissionSummary);
  const allVisited = useMemo(() => haveVisitedAllSelectedProtocols(addedProtocols), [addedProtocols]);
  const remainingProtocols = useMemo(
    () => addedProtocols.filter((protocol) => protocol.status === "not_planned").length,
    [addedProtocols]
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scoreFindings = lastScore?.findings ?? [];

  const handleCheck = async () => {
    const result = await planner.checkPlanning();
    if (activeProtocolIndex !== null && result?.score && !result.score.pass) {
      markProtocolNeedsRetry(activeProtocolIndex);
    }
    setRightPanelTab('feedback');
  };

  const handleAccept = () => {
    if (activeProtocolIndex === null || !lastScore?.pass) {
      return;
    }
    markProtocolAccepted(activeProtocolIndex);
  };

  const handleRunScan = () => {
    if (activeProtocolIndex === null || activeProtocolStatus !== "accepted") {
      return;
    }
    completeProtocol(activeProtocolIndex);
    setRightPanelTab("realtime");
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
          onClick={handleAccept}
          type="button"
          disabled={!lastScore?.pass || activeProtocolStatus === "accepted" || activeProtocolStatus === "completed"}
          className="px-2 py-0.5 rounded text-[8px] transition-colors"
          style={{
            background: lastScore?.pass ? "rgba(37, 99, 235, 0.15)" : "transparent",
            color: lastScore?.pass ? "var(--accent-blue)" : "var(--text-muted)",
            border: lastScore?.pass ? "1px solid rgba(37,99,235,0.35)" : "1px solid var(--chrome-border)",
            cursor: lastScore?.pass ? "pointer" : "not-allowed",
            opacity: lastScore?.pass ? 1 : 0.7
          }}
        >
          Accept Sequence
        </button>
        <button
          onClick={handleRunScan}
          type="button"
          disabled={activeProtocolStatus !== "accepted"}
          className="px-2 py-0.5 rounded text-[8px] transition-colors"
          style={{
            background: activeProtocolStatus === "accepted" ? "rgba(22, 163, 74, 0.15)" : "transparent",
            color: activeProtocolStatus === "accepted" ? "var(--fb-good)" : "var(--text-muted)",
            border: activeProtocolStatus === "accepted" ? "1px solid rgba(22,163,74,0.35)" : "1px solid var(--chrome-border)",
            cursor: activeProtocolStatus === "accepted" ? "pointer" : "not-allowed",
            opacity: activeProtocolStatus === "accepted" ? 1 : 0.7
          }}
        >
          Run Scan
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

        {planner.currentProtocol?.teaching && (
          <div
            className="mb-2 rounded px-2 py-2"
            style={{ background: 'var(--chrome-surface-raised)', border: '1px solid var(--chrome-border)' }}
          >
            <div className="text-[8px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
              Active Sequence
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-primary)' }}>
              {planner.currentProtocol.label}
            </div>
            <div className="text-[8px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {planner.currentProtocol.teaching.purpose}
            </div>
            <div className="text-[8px] mt-2" style={{ color: 'var(--text-muted)' }}>
              Hint: {planner.currentProtocol.teaching.planningHint}
            </div>
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

            {scoreFindings.length > 0 && (
              <div className="space-y-1.5">
                {scoreFindings.map((finding) => (
                  <div
                    key={`${finding.code}-${finding.relatedParameter ?? finding.title}`}
                    className="rounded px-2 py-1.5"
                    style={{
                      background: finding.severity === "error" ? "rgba(185, 28, 28, 0.08)" : "rgba(202, 138, 4, 0.08)",
                      border: `1px solid ${finding.severity === "error" ? "rgba(185, 28, 28, 0.18)" : "rgba(202, 138, 4, 0.18)"}`
                    }}
                  >
                    <div className="text-[8px]" style={{ color: finding.severity === "error" ? "var(--fb-bad)" : "var(--fb-warn)" }}>
                      {finding.title}
                    </div>
                    <div className="text-[9px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                      {finding.message}
                    </div>
                    {finding.suggestion && (
                      <div className="text-[8px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        Fix: {finding.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
