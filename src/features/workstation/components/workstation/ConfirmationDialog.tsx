'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';

export default function ConfirmationDialog() {
  const show = useWorkstationStore((s) => s.showConfirmDialog);
  const warning = useWorkstationStore((s) => s.confirmationWarning);
  const mismatched = useWorkstationStore((s) => s.mismatchedProtocols);
  const protocols = useWorkstationStore((s) => s.addedProtocols);
  const dismiss = useWorkstationStore((s) => s.dismissConfirmDialog);
  const removeAndConfirm = useWorkstationStore((s) => s.removeMismatchedAndConfirm);

  if (!show) return null;

  const mismatchedItems = protocols.filter((p) =>
    mismatched.includes(p.protocolId),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={dismiss}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-[420px] rounded-lg p-5 animate-scale-in"
        style={{
          background: 'var(--chrome-surface)',
          border: '1px solid var(--chrome-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ background: 'rgba(210, 153, 34, 0.2)', color: 'var(--fb-warn)' }}
          >
            !
          </div>
          <span
            id="confirm-dialog-title"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--fb-warn)' }}
          >
            Region Mismatch
          </span>
        </div>

        <p className="text-[10px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          {warning}
        </p>

        <div
          className="rounded px-3 py-2 mb-4"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--chrome-border)' }}
        >
          {mismatchedItems.map((p) => (
            <div
              key={p.protocolId}
              className="flex items-center gap-2 py-1 text-[10px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--fb-warn)' }}
              />
              {p.label}
              <span
                className="ml-auto text-[8px] px-1.5 py-0.5 rounded uppercase"
                style={{
                  background: 'rgba(210, 153, 34, 0.15)',
                  color: 'var(--fb-warn)',
                }}
              >
                {p.region}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[9px] mb-4" style={{ color: 'var(--text-muted)' }}>
          Only pick protocols relevant to your selected scan region.
        </p>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 rounded text-[10px] transition-colors cursor-pointer"
            style={{
              background: 'transparent',
              border: '1px solid var(--chrome-border)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--chrome-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Go Back
          </button>
          <button
            onClick={removeAndConfirm}
            className="px-3 py-1.5 rounded text-[10px] transition-colors cursor-pointer"
            style={{
              background: 'var(--accent-blue)',
              border: '1px solid var(--accent-blue)',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Remove Mismatched
          </button>
        </div>
      </div>
    </div>
  );
}
