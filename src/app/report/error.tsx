'use client';

import Link from 'next/link';

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: '#e6edf3',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 32 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: '#f85149',
          }}
        >
          Failed to load report
        </div>
        <p
          style={{
            fontSize: 11,
            color: '#8b949e',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {error.message || 'Could not generate your session report. Your exam data may have expired.'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '8px 20px',
              fontSize: 11,
              fontWeight: 500,
              background: 'rgba(37, 99, 235, 0.12)',
              color: '#58a6ff',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
          <Link
            href="/"
            style={{
              padding: '8px 20px',
              fontSize: 11,
              fontWeight: 500,
              background: 'transparent',
              color: '#8b949e',
              border: '1px solid #30363d',
              borderRadius: 6,
              textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            Start New Session
          </Link>
        </div>
      </div>
    </div>
  );
}
