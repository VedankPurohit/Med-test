'use client';

import { useEffect, useRef } from 'react';
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';

const SURVEY_DURATION = 3000;
const PANEL_COUNT = 3;
const PANEL_WIDTH = 100 / PANEL_COUNT;

export default function SurveyAnimation() {
  const phase = useWorkstationStore((s) => s.phase);
  const surveyProgress = useWorkstationStore((s) => s.surveyProgress);
  const setSurveyProgress = useWorkstationStore((s) => s.setSurveyProgress);
  const completeSurvey = useWorkstationStore((s) => s.completeSurvey);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'survey-running') return;

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      if (!mountedRef.current) return;

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(100, (elapsed / SURVEY_DURATION) * 100);
      setSurveyProgress(progress);

      if (elapsed < SURVEY_DURATION) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        if (mountedRef.current) completeSurvey();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, setSurveyProgress, completeSurvey]);

  if (phase !== 'survey-running') return null;

  const activePanel = Math.min(
    PANEL_COUNT - 1,
    Math.floor((surveyProgress / 100) * PANEL_COUNT),
  );

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-30 px-4 py-2"
        style={{ background: 'var(--chrome-surface)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] uppercase tracking-wider animate-pulse-soft"
            style={{ color: 'var(--accent-blue)' }}
          >
            Surveying...
          </span>
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--track-bg)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${surveyProgress}%`,
                background: 'var(--accent-blue)',
                boxShadow: 'var(--glow-blue)',
                transition: 'width 100ms linear',
              }}
            />
          </div>
          <span
            className="text-[9px] tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {Math.round(surveyProgress)}%
          </span>
        </div>
      </div>

      {Array.from({ length: PANEL_COUNT }, (_, panelIndex) => {
        const isActive = panelIndex === activePanel;
        const isDone = panelIndex < activePanel;
        const panelStart = panelIndex * PANEL_WIDTH;
        const localProgress = ((surveyProgress - panelStart) / PANEL_WIDTH) * 100;

        return (
          <div
            key={`scan-panel-${panelIndex}`}
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              left: `${panelStart}%`,
              width: `${PANEL_WIDTH}%`,
            }}
          >
            {isActive && (
              <>
                <div
                  className="absolute w-full h-0.5"
                  style={{
                    top: `${Math.min(100, localProgress)}%`,
                    background: 'var(--accent-blue)',
                    boxShadow: '0 0 12px var(--accent-blue), 0 0 24px rgba(37, 99, 235, 0.3)',
                    opacity: 0.8,
                  }}
                />
                <div
                  className="absolute w-full"
                  style={{
                    top: 0,
                    height: `${Math.min(100, localProgress)}%`,
                    background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.02) 0%, rgba(37, 99, 235, 0.06) 100%)',
                  }}
                />
              </>
            )}
            {isDone && (
              <div
                className="absolute inset-0"
                style={{
                  background: 'rgba(37, 99, 235, 0.03)',
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
