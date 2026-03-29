'use client';

import { useState, useEffect } from 'react';
import type { TeachingRenderProps } from '@/features/guidance/types/guidance';

function PopupTeachingRender({ protocol, params, onParamChange, onAccept, onSkip }: TeachingRenderProps) {
  const highlights = protocol.teaching?.parameterHighlights ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance when no highlights — must be in useEffect, not during render
  useEffect(() => {
    if (highlights.length === 0) {
      onAccept();
    }
  }, [highlights.length, onAccept]);

  if (highlights.length === 0) {
    return null;
  }

  const current = highlights[currentIndex];
  const spec = protocol.parameterSpecs.find((s) => s.key === current.key);
  const targetValue = protocol.target.params[current.key] ?? 0;
  const currentValue = params[current.key] ?? targetValue;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === highlights.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onSkip}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="param-teaching-title"
        className="relative w-[460px] rounded-lg p-5 animate-scale-in"
        style={{
          background: 'var(--chrome-surface)',
          border: '1px solid var(--chrome-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span
            id="param-teaching-title"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--accent-blue)' }}
          >
            Parameter Guide — {protocol.label}
          </span>
          <button
            onClick={onSkip}
            className="text-[10px] px-2 py-1 rounded cursor-pointer transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid var(--chrome-border)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--chrome-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Skip All
          </button>
        </div>

        {/* Progress */}
        <div
          className="text-[9px] mb-3 uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Parameter {currentIndex + 1} of {highlights.length}
        </div>

        {/* Parameter content */}
        <div
          className="rounded px-4 py-3 mb-4"
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--chrome-border)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className="text-[12px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {spec?.label ?? current.key}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--accent-blue)',
              }}
            >
              Target: {targetValue}{spec?.unit ? ` ${spec.unit}` : ''}
            </span>
          </div>

          <p
            className="text-[10px] leading-relaxed mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            {current.explanation}
          </p>

          <div className="flex items-center gap-2">
            <label
              className="text-[9px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Value
            </label>
            <input
              type="number"
              value={currentValue}
              min={spec?.min}
              max={spec?.max}
              step={spec?.step ?? 1}
              onChange={(e) => onParamChange(current.key, Number(e.target.value))}
              className="w-[100px] px-2 py-1 rounded text-[11px]"
              style={{
                background: 'var(--chrome-surface)',
                border: '1px solid var(--chrome-border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            />
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

        {/* Navigation */}
        <div className="flex items-center gap-2 justify-end">
          {!isFirst && (
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
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
              Previous
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
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
              Next Parameter
            </button>
          ) : (
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
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const PopupTeachingStrategy = {
  id: 'popup' as const,
  label: 'Popup',
  render: PopupTeachingRender,
};
