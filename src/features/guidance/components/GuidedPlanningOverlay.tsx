'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';

/**
 * Controls the "show correct planning" overlay timing.
 * The actual target box rendering is handled by LocalizerCanvas's
 * existing `showTarget` prop — this component just manages the
 * timer and toggle state.
 */
export function GuidedPlanningOverlay() {
  const showCorrectPlanning = useGuidanceStore((s) => s.showCorrectPlanning);
  const timerSeconds = useGuidanceStore((s) => s.correctPlanningTimerSeconds);
  const hideCorrectOverlay = useGuidanceStore((s) => s.hideCorrectOverlay);
  const showCorrectOverlay = useGuidanceStore((s) => s.showCorrectOverlay);
  const tipsEnabled = useGuidanceStore((s) => s.tipsEnabled);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide after timer
  useEffect(() => {
    if (showCorrectPlanning && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        hideCorrectOverlay();
      }, timerSeconds * 1000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showCorrectPlanning, timerSeconds, hideCorrectOverlay]);

  const handleToggle = useCallback(() => {
    if (showCorrectPlanning) {
      hideCorrectOverlay();
    } else {
      showCorrectOverlay();
    }
  }, [showCorrectPlanning, hideCorrectOverlay, showCorrectOverlay]);

  if (!tipsEnabled) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 4,
        right: 8,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <button
        onClick={handleToggle}
        style={{
          fontSize: 10,
          padding: '3px 8px',
          border: '1px solid var(--chrome-border)',
          borderRadius: 3,
          backgroundColor: showCorrectPlanning
            ? 'var(--accent-blue)'
            : 'var(--chrome-surface)',
          color: showCorrectPlanning ? '#fff' : 'var(--text-muted)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
      >
        {showCorrectPlanning ? 'Hide Planning' : 'Show Planning'}
      </button>
      {showCorrectPlanning && (
        <span
          style={{
            fontSize: 9,
            color: 'var(--text-muted)',
          }}
        >
          Auto-hides in {timerSeconds}s
        </span>
      )}
    </div>
  );
}
