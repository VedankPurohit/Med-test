'use client';

import type { TeachingRenderProps } from '@/features/guidance/types/guidance';
import { formatParameterValue, getParameterOptions } from '@/features/guidance/lib/parameterDisplay';

function InlineTeachingRender({ protocol, params, onParamChange, onAccept, onSkip }: TeachingRenderProps) {
  const highlights = protocol.teaching?.parameterHighlights ?? [];

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--chrome-surface)',
        border: '1px solid var(--chrome-border)',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--accent-blue)' }}
      >
        Parameter Highlights — {protocol.label}
      </div>

      {highlights.length === 0 ? (
        <p
          className="text-[10px] mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          No parameter highlights configured for this protocol.
        </p>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {highlights.map((h) => {
            const spec = protocol.parameterSpecs.find((s) => s.key === h.key);
            const targetValue = protocol.target.params[h.key] ?? 0;
            const currentValue = params[h.key] ?? targetValue;
            const options = getParameterOptions(h.key);

            return (
              <div
                key={h.key}
                className="rounded px-3 py-2"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--chrome-border)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {spec?.label ?? h.key}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--accent-blue)',
                    }}
                  >
                    Target: {formatParameterValue(h.key, targetValue, spec)}
                  </span>
                </div>
                <p
                  className="text-[10px] leading-relaxed mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {h.explanation}
                </p>
                <div className="flex items-center gap-2">
                  {options ? (
                    <select
                      value={currentValue}
                      onChange={(e) => onParamChange(h.key, Number(e.target.value))}
                      className="w-[130px] px-2 py-1 rounded text-[10px]"
                      style={{
                        background: 'var(--chrome-surface)',
                        border: '1px solid var(--chrome-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {options.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={currentValue}
                      min={spec?.min}
                      max={spec?.max}
                      step={spec?.step ?? 1}
                      onChange={(e) => onParamChange(h.key, Number(e.target.value))}
                      className="w-[90px] px-2 py-1 rounded text-[10px]"
                      style={{
                        background: 'var(--chrome-surface)',
                        border: '1px solid var(--chrome-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    />
                  )}
                  {spec?.unit && (
                    <span
                      className="text-[9px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {spec.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
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
          Skip
        </button>
        <button
          onClick={onAccept}
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
          Accept
        </button>
      </div>
    </div>
  );
}

export const InlineTeachingStrategy = {
  id: 'inline' as const,
  label: 'Inline',
  render: InlineTeachingRender,
};
