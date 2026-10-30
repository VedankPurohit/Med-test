'use client';

import type { ProtocolConfig } from '@/features/planner/types/planner';

type SequenceInfoPopupProps = {
  open: boolean;
  protocol: ProtocolConfig;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
};

export function SequenceInfoPopup({ open, protocol, onNext, onSkip, onClose }: SequenceInfoPopupProps) {
  if (!open) return null;

  const teaching = protocol.teaching;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="modal-scrim"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sequence-info-title"
        className="modal-dialog w-[480px] p-5 animate-scale-in"
        style={{
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <span
            id="sequence-info-title"
            className="text-[13px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {protocol.label}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-[12px] cursor-pointer transition-colors"
            style={{
              background: 'var(--chrome-surface-hover)',
              border: '1px solid var(--chrome-border)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--chrome-surface-raised)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'var(--chrome-surface-hover)';
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Purpose */}
        {teaching?.purpose && (
          <div
            className="rounded px-4 py-3 mb-4"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div
              className="text-[9px] uppercase tracking-wider mb-1 font-semibold"
              style={{ color: 'var(--accent-blue)' }}
            >
              Purpose
            </div>
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            >
              {teaching.purpose}
            </p>
          </div>
        )}

        {/* Planning hint */}
        {teaching?.planningHint && (
          <div className="mb-4">
            <div
              className="text-[9px] uppercase tracking-wider mb-1 font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Planning Hint
            </div>
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {teaching.planningHint}
            </p>
          </div>
        )}

        {/* Checklist */}
        {teaching?.planningChecklist && teaching.planningChecklist.length > 0 && (
          <div className="mb-4">
            <div
              className="text-[9px] uppercase tracking-wider mb-2 font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Checklist
            </div>
            <div className="flex flex-col gap-1.5">
              {teaching.planningChecklist.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[10px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span
                    className="mt-0.5 text-[9px] shrink-0"
                    style={{ color: 'var(--accent-blue)' }}
                  >
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end pt-3" style={{ borderTop: '1px solid var(--chrome-border-light)' }}>
          <button
            onClick={onSkip}
            className="btn-sm btn-ghost text-[10px]"
            style={{ padding: '5px 12px' }}
          >
            Skip — Start Planning
          </button>
          <button
            onClick={onNext}
            className="btn-sm btn-primary text-[10px] font-medium"
            style={{ padding: '5px 14px' }}
          >
            Next — Learn Parameters
          </button>
        </div>
      </div>
    </div>
  );
}
