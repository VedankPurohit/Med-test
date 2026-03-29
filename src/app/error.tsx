'use client';

export default function GlobalError({
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
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(248, 81, 73, 0.12)',
            border: '1px solid rgba(248, 81, 73, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 20,
          }}
        >
          !
        </div>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: '#f85149',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: 11,
            color: '#8b949e',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '8px 24px',
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
          Try again
        </button>
      </div>
    </div>
  );
}
