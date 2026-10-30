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
      <main style={{ minHeight: '100vh', padding: 32, background: 'var(--chrome-bg)', fontFamily: 'inherit' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <BrandingHeader />
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 16 }}>Loading report...</p>
        </div>
      </main>
    );
  }

  if (!summary) {
    return (
      <main style={{ minHeight: '100vh', padding: 32, background: 'var(--chrome-bg)', fontFamily: 'inherit' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <BrandingHeader />
          <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 24 }}>
            No submitted report found in this session.
          </p>
          <button
            type="button"
            onClick={handleBackToWorkstation}
            className="btn-sm btn-ghost"
            style={{ marginTop: 16 }}
          >
            Back to Workstation
          </button>
        </div>
      </main>
    );
  }

  const avg = summary.averageScorePercent;
  const summaryMessage =
    avg !== null && avg >= 85
      ? { text: 'Excellent performance.', color: 'var(--fb-good)' }
      : avg !== null && avg >= 70
        ? { text: 'Good progress \u2014 review the feedback below.', color: 'var(--fb-warn)' }
        : { text: 'Keep practicing \u2014 focus on the areas marked below.', color: 'var(--text-muted)' };

  return (
    <main style={{
      minHeight: '100vh',
      padding: 32,
      background: 'var(--chrome-bg)',
      fontFamily: 'inherit',
      overflow: 'auto',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }} className="animate-fade-in">
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <BrandingHeader />
            <p style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 6, letterSpacing: '0.08em' }}>
              Generated {new Date(summary.generatedAt).toLocaleString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleBackToWorkstation}
              className="btn-sm btn-ghost"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStartNewSession}
              className="btn-sm"
              style={{
                border: '1px solid rgba(63,185,80,0.35)',
                color: 'var(--fb-good)',
                background: 'rgba(63,185,80,0.08)',
              }}
            >
              Start New Session
            </button>
          </div>
        </div>

        {/* Summary message */}
        <div style={{
          marginTop: 20,
          padding: '10px 14px',
          borderRadius: 6,
          border: '1px solid var(--chrome-border)',
          background: 'var(--chrome-surface)',
          fontSize: 11,
          color: summaryMessage.color,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          {summaryMessage.text}
        </div>

        {/* Stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 2fr 1fr 1fr',
          gap: 8,
          marginTop: 16,
        }}>
          <StatCard
            label="Protocols"
            value={`${summary.visitedProtocols}/${summary.totalProtocols}`}
            borderColor="var(--accent-blue)"
          />
          <StatCard
            label="Scored"
            value={`${summary.scoredProtocols}`}
            borderColor="var(--chrome-border-bright)"
          />
          <StatCard
            label="Average Score"
            value={avg !== null ? `${avg}%` : 'n/a'}
            borderColor={avg !== null && avg >= 75 ? 'var(--fb-good)' : avg !== null && avg >= 55 ? 'var(--fb-warn)' : 'var(--fb-bad)'}
            prominent
          />
          <StatCard
            label="Passed"
            value={`${summary.passedProtocols}`}
            borderColor="var(--fb-good)"
          />
          <StatCard
            label="All Visited"
            value={summary.allVisited ? 'Yes' : 'No'}
            borderColor={summary.allVisited ? 'var(--fb-good)' : 'var(--fb-warn)'}
          />
        </div>

        {/* Protocol cards */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>
            Protocol Breakdown
          </div>
          {summary.protocols.map((protocol) => (
            <ProtocolCard key={protocol.examCardProtocolId} protocol={protocol} />
          ))}
        </div>
      </div>
    </main>
  );
}

/* ---- Branding Header ---- */

function BrandingHeader() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--accent-blue)',
          boxShadow: 'var(--glow-blue)',
        }} />
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
        }}>
          MedAssist
        </span>
      </div>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        marginTop: 4,
      }}>
        Session Report
      </div>
    </div>
  );
}

/* ---- Stat Card ---- */

function StatCard({
  label,
  value,
  borderColor,
  prominent,
}: {
  label: string;
  value: string;
  borderColor: string;
  prominent?: boolean;
}) {
  return (
    <div style={{
      borderRadius: 6,
      border: '1px solid var(--chrome-border)',
      borderLeft: `3px solid ${borderColor}`,
      background: 'var(--chrome-surface)',
      padding: prominent ? '12px 14px' : '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: prominent ? 'center' : 'flex-start',
    }}>
      <div style={{
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'var(--text-muted)',
        fontWeight: 500,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: prominent ? 20 : 15,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginTop: 4,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

/* ---- Protocol Card ---- */

interface ProtocolCardProtocol {
  examCardProtocolId: string;
  label: string;
  status: string;
  mapped: boolean;
  scorePercent: number | null;
  pass: boolean | null;
  feedback: string[];
}

function ProtocolCard({ protocol }: { protocol: ProtocolCardProtocol }) {
  const score = protocol.scorePercent;
  const hasScore = score !== null;
  const isNotMapped = !protocol.mapped;

  const barColor =
    !hasScore ? 'var(--chrome-border)'
      : score >= 75 ? 'var(--fb-good)'
        : score >= 55 ? 'var(--fb-warn)'
          : 'var(--fb-bad)';

  const pillLabel =
    protocol.pass === null
      ? (isNotMapped ? 'NOT SCORED' : 'PENDING')
      : protocol.pass
        ? 'PASS'
        : 'NEEDS WORK';

  const pillBg =
    protocol.pass === null
      ? 'rgba(138,148,158,0.1)'
      : protocol.pass
        ? 'rgba(63,185,80,0.1)'
        : 'rgba(248,81,73,0.1)';

  const pillColor =
    protocol.pass === null
      ? 'var(--text-muted)'
      : protocol.pass
        ? 'var(--fb-good)'
        : 'var(--fb-bad)';

  const pillBorder =
    protocol.pass === null
      ? 'var(--chrome-border)'
      : protocol.pass
        ? 'rgba(63,185,80,0.3)'
        : 'rgba(248,81,73,0.3)';

  return (
    <div style={{
      borderRadius: 6,
      border: '1px solid var(--chrome-border)',
      background: isNotMapped ? 'var(--chrome-bg)' : 'var(--chrome-surface)',
      padding: '12px 14px',
      opacity: isNotMapped ? 0.65 : 1,
    }}>
      {/* Top row: name + bar + pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Protocol name */}
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-primary)',
          minWidth: 140,
          flexShrink: 0,
        }}>
          {protocol.label}
        </div>

        {/* Progress bar */}
        <div style={{ flex: 1, position: 'relative', height: 14, display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            background: 'var(--track-bg)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: hasScore ? `${score}%` : '0%',
              height: '100%',
              borderRadius: 3,
              background: barColor,
              transition: 'width 0.4s ease',
            }} />
          </div>
          {hasScore && (
            <span style={{
              position: 'absolute',
              right: 0,
              top: -6,
              fontSize: 9,
              fontWeight: 600,
              color: barColor,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {score}%
            </span>
          )}
        </div>

        {/* Pill badge */}
        <div style={{
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '3px 8px',
          borderRadius: 9999,
          border: `1px solid ${pillBorder}`,
          background: pillBg,
          color: pillColor,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {pillLabel}
        </div>
      </div>

      {/* Feedback bullets */}
      {protocol.feedback.length > 0 && (
        <div style={{ marginTop: 8, paddingLeft: 140 + 12 }}>
          {protocol.feedback.map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: 9,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>&bull;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      {protocol.feedback.length === 0 && !isNotMapped && (
        <div style={{ marginTop: 6, paddingLeft: 140 + 12, fontSize: 9, color: 'var(--text-muted)' }}>
          No feedback yet.
        </div>
      )}
      {isNotMapped && (
        <div style={{ marginTop: 6, paddingLeft: 140 + 12, fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Protocol not mapped for planner scoring.
        </div>
      )}
    </div>
  );
}
