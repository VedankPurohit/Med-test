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
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sequence-info-title"
        className="relative w-[480px] rounded-lg p-5 animate-scale-in"
        style={{
          background: 'var(--chrome-surface)',
          border: '1px solid var(--chrome-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
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
            className="w-5 h-5 flex items-center justify-center rounded text-[11px] cursor-pointer transition-colors"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
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
        <div className="flex items-center gap-2 justify-end pt-2">
          <button
            onClick={onSkip}
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
            Skip — Start Planning
          </button>
          <button
            onClick={onNext}
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
            Next — Learn Parameters
          </button>
        </div>
      </div>
    </div>
  );
}
