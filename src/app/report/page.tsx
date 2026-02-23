'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';

export default function ReportPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const summary = useWorkstationStore((s) => s.submissionSummary);
  const resetExam = useWorkstationStore((s) => s.resetExam);
  const clearSubmissionSummary = useWorkstationStore((s) => s.clearSubmissionSummary);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleBackToWorkstation = () => {
    router.push('/');
  };

  const handleStartNewSession = () => {
    clearSubmissionSummary();
    resetExam();
    router.push('/');
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen p-6" style={{ background: 'var(--chrome-surface)' }}>
        <div className="mx-auto max-w-3xl rounded border p-4" style={{ borderColor: 'var(--chrome-border)' }}>
          <h1 className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Session Report
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading report...
          </p>
        </div>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="min-h-screen p-6" style={{ background: 'var(--chrome-surface)' }}>
        <div className="mx-auto max-w-3xl rounded border p-4" style={{ borderColor: 'var(--chrome-border)' }}>
          <h1 className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Session Report
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            No submitted report found in this session.
          </p>
          <button
            type="button"
            onClick={handleBackToWorkstation}
            className="mt-4 px-3 py-1 rounded text-xs"
            style={{
              border: '1px solid var(--chrome-border)',
              color: 'var(--text-secondary)',
              background: 'var(--chrome-surface-raised)'
            }}
          >
            Back to Workstation
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6" style={{ background: 'var(--chrome-surface)' }}>
      <div className="mx-auto max-w-5xl rounded border p-4" style={{ borderColor: 'var(--chrome-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Session Report
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Generated {new Date(summary.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToWorkstation}
              className="px-3 py-1 rounded text-xs"
              style={{
                border: '1px solid var(--chrome-border)',
                color: 'var(--text-secondary)',
                background: 'var(--chrome-surface-raised)'
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStartNewSession}
              className="px-3 py-1 rounded text-xs"
              style={{
                border: '1px solid rgba(22,163,74,0.35)',
                color: 'var(--fb-good)',
                background: 'rgba(22, 163, 74, 0.12)'
              }}
            >
              Start New Session
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <StatCard label="Protocols" value={`${summary.visitedProtocols}/${summary.totalProtocols}`} />
          <StatCard label="Scored" value={`${summary.scoredProtocols}`} />
          <StatCard label="Passed" value={`${summary.passedProtocols}`} />
          <StatCard
            label="Average"
            value={summary.averageScorePercent !== null ? `${summary.averageScorePercent}%` : 'n/a'}
          />
          <StatCard label="Visited All" value={summary.allVisited ? 'Yes' : 'No'} />
        </div>

        <div className="mt-4 rounded border overflow-hidden" style={{ borderColor: 'var(--chrome-border)' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'var(--chrome-surface-raised)', color: 'var(--text-muted)' }}>
              <tr className="text-left">
                <th className="px-3 py-2">Protocol</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {summary.protocols.map((protocol) => (
                <tr key={protocol.examCardProtocolId} style={{ borderTop: '1px solid var(--chrome-border)' }}>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{protocol.label}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{protocol.status}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                    {protocol.scorePercent !== null ? `${protocol.scorePercent}%` : 'Not checked'}
                  </td>
                  <td
                    className="px-3 py-2"
                    style={{
                      color:
                        protocol.pass === null
                          ? 'var(--text-muted)'
                          : protocol.pass
                            ? 'var(--fb-good)'
                            : 'var(--fb-bad)'
                    }}
                  >
                    {protocol.pass === null ? 'NOT YET' : protocol.pass ? 'PASS' : 'FAIL'}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                    {protocol.feedback.length > 0
                      ? protocol.feedback.join(' ')
                      : protocol.mapped
                        ? 'No feedback yet.'
                        : 'Protocol not mapped for planner scoring.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border px-3 py-2" style={{ borderColor: 'var(--chrome-border)' }}>
      <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
        {value}
      </div>
    </div>
  );
}
