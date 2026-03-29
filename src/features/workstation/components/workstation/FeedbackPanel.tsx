'use client';

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { haveVisitedAllSelectedProtocols } from "@/features/workstation/lib/examSummary";
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';
import { useVolume } from '@/features/volume/hooks/useVolume';
import { ScanResultPanel } from '@/features/guidance/components/ScanResultPanel';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';

export default function FeedbackPanel({ bridge }: { bridge: PlannerBridge }) {
  const router = useRouter();
  const { planner } = bridge;
  const lastScore = planner.lastScore;
  const setRightPanelTab = useWorkstationStore((s) => s.setRightPanelTab);
  const addedProtocols = useWorkstationStore((s) => s.addedProtocols);
  const activeIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const activateProtocol = useWorkstationStore((s) => s.activateProtocol);
  const setSubmissionSummary = useWorkstationStore((s) => s.setSubmissionSummary);
  const showCorrectOverlay = useGuidanceStore((s) => s.showCorrectOverlay);
  const allVisited = useMemo(() => haveVisitedAllSelectedProtocols(addedProtocols), [addedProtocols]);
  const remainingProtocols = useMemo(
    () => addedProtocols.filter((protocol) => protocol.status === "pending").length,
    [addedProtocols]
  );
  const volumeUrl = bridge.resolved?.caseConfig.volumeUrl ?? null;
  const { volume } = useVolume(volumeUrl);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showScanResult, setShowScanResult] = useState(false);

  // Reset local state when active protocol changes
  useEffect(() => {
    setAccepted(false);
    setScanning(false);
    setShowScanResult(false);
  }, [planner.currentProtocol?.id]);

  const findings = lastScore?.findings ?? [];
  const canAccept = lastScore?.pass === true && !accepted;
  const canRunScan = accepted && !scanning;

  const handleCheck = () => {
    setAccepted(false);
    setScanning(false);
    void planner.checkPlanning();
    setRightPanelTab('feedback');
  };

  const handleAccept = useCallback(() => {
    setAccepted(true);
  }, []);

  const handleRunScan = useCallback(() => {
    setScanning(true);
    // Brief scanning animation then show results
    setTimeout(() => {
      setScanning(false);
      setShowScanResult(true);
    }, 1500);
  }, []);

  const handleCloseScanResult = useCallback(() => {
    setShowScanResult(false);
    setAccepted(false);
    // Find next pending protocol
    const nextIndex = addedProtocols.findIndex(
      (p, i) => i !== activeIndex && (p.status === 'pending' || p.status === 'planning')
    );
    if (nextIndex >= 0) {
      activateProtocol(nextIndex);
    }
  }, [addedProtocols, activeIndex, activateProtocol]);

  const handleShowCorrectPlanning = useCallback(() => {
    showCorrectOverlay();
  }, [showCorrectOverlay]);

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
        className="flex gap-1.5 px-2.5 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <button
          onClick={() => void handleCheck()}
          disabled={planner.isChecking}
          className="btn-sm"
          style={{
            background: planner.isChecking ? "var(--chrome-surface-raised)" : 'var(--accent-blue-dim)',
            color: planner.isChecking ? "var(--text-muted)" : 'var(--accent-blue)',
            border: planner.isChecking ? "1px solid var(--chrome-border)" : '1px solid rgba(37,99,235,0.3)',
            cursor: planner.isChecking ? "not-allowed" : "pointer",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (!planner.isChecking) {
              e.currentTarget.style.background = 'var(--accent-blue)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (!planner.isChecking) {
              e.currentTarget.style.background = 'var(--accent-blue-dim)';
              e.currentTarget.style.color = 'var(--accent-blue)';
            }
          }}
        >
          {planner.isChecking ? "Checking..." : "Check Planning"}
        </button>
        <button
          onClick={planner.resetPlan}
          type="button"
          className="btn-sm btn-ghost"
        >
          Reset
        </button>
        <button
          onClick={() => void handleSubmitExam()}
          type="button"
          disabled={!allVisited}
          className="btn-sm ml-auto"
          style={{
            background: allVisited ? "rgba(22, 163, 74, 0.15)" : "transparent",
            color: allVisited ? "var(--fb-good)" : "var(--text-muted)",
            border: allVisited ? "1px solid rgba(22,163,74,0.35)" : "1px solid var(--chrome-border)",
            cursor: allVisited ? "pointer" : "not-allowed",
            fontWeight: 500,
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

            {/* Structured findings */}
            {findings.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {findings.map((f, i) => (
                  <div
                    key={`${i}-${f.code}`}
                    className="text-[9px] leading-snug rounded px-1.5 py-1"
                    style={{
                      background:
                        f.severity === 'error'
                          ? 'rgba(248,81,73,0.08)'
                          : f.severity === 'warning'
                            ? 'rgba(210,153,34,0.08)'
                            : 'rgba(63,185,80,0.08)',
                      borderLeft: `2px solid ${
                        f.severity === 'error'
                          ? 'var(--fb-bad)'
                          : f.severity === 'warning'
                            ? 'var(--fb-warn)'
                            : 'var(--fb-good)'
                      }`,
                    }}
                  >
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {f.title}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{f.message}</div>
                    {f.suggestion && (
                      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                        Tip: {f.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Feedback items (legacy) */}
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

            {/* Accept / Run Scan / Show Correct Planning buttons */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {canAccept && (
                <button
                  onClick={handleAccept}
                  className="px-2 py-0.5 rounded text-[8px] cursor-pointer"
                  style={{
                    background: 'rgba(63,185,80,0.15)',
                    color: 'var(--fb-good)',
                    border: '1px solid rgba(63,185,80,0.35)',
                  }}
                >
                  Accept
                </button>
              )}
              {canRunScan && (
                <button
                  onClick={handleRunScan}
                  className="px-2 py-0.5 rounded text-[8px] cursor-pointer"
                  style={{
                    background: 'rgba(37,99,235,0.15)',
                    color: 'var(--accent-blue)',
                    border: '1px solid rgba(37,99,235,0.35)',
                  }}
                >
                  Run Scan
                </button>
              )}
              {scanning && (
                <span className="text-[8px] animate-pulse-soft" style={{ color: 'var(--accent-blue)' }}>
                  Scanning...
                </span>
              )}
              {lastScore && !lastScore.pass && (
                <>
                  <button
                    onClick={handleShowCorrectPlanning}
                    className="px-2 py-0.5 rounded text-[8px] cursor-pointer"
                    style={{
                      background: 'rgba(210,153,34,0.12)',
                      color: 'var(--fb-warn)',
                      border: '1px solid rgba(210,153,34,0.3)',
                    }}
                  >
                    Show Correct Planning
                  </button>
                  <button
                    onClick={planner.resetPlan}
                    className="px-2 py-0.5 rounded text-[8px] cursor-pointer"
                    style={{
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--chrome-border)',
                    }}
                  >
                    Try Again
                  </button>
                </>
              )}
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

      <ScanResultPanel
        open={showScanResult}
        volume={volume}
        box={planner.box}
        protocolLabel={planner.currentProtocol?.label ?? ""}
        onClose={handleCloseScanResult}
      />
    </div>
  );
}
