'use client';

import { useEffect, useState } from 'react';
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { MOCK_PATIENT } from '@/features/workstation/lib/mockData';
import type { CaseId } from '@/features/workstation/types/mri';

const CASE_LABELS: Record<CaseId, string> = {
  brain: 'Brain MRI',
  cspine: 'Cervical Spine MRI',
  tspine: 'Thoracic Spine MRI',
  lspine: 'Lumbar Spine MRI',
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkstationTopBar() {
  const phase = useWorkstationStore((s) => s.phase);
  const regionId = useWorkstationStore((s) => s.regionId);
  const caseId = useWorkstationStore((s) => s.caseId);
  const protocols = useWorkstationStore((s) => s.addedProtocols);
  const examStartTime = useWorkstationStore((s) => s.examStartTime);
  const confirmProtocols = useWorkstationStore((s) => s.confirmProtocols);
  const startSurvey = useWorkstationStore((s) => s.startSurvey);
  const goBack = useWorkstationStore((s) => s.goBackToRegionSelect);
  const resetExam = useWorkstationStore((s) => s.resetExam);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!examStartTime) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - examStartTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [examStartTime]);

  const displayTime = examStartTime ? elapsed : 0;

  const canConfirm = phase === 'exam-setup' && protocols.length > 0;
  const canSurvey = phase === 'protocols-confirmed';
  const isSurveying = phase === 'survey-running';

  return (
    <div
      className="flex items-center h-10 px-3 gap-4 select-none shrink-0"
      style={{
        background: 'var(--toolbar-gradient)',
        borderBottom: '1px solid var(--chrome-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: 'var(--accent-blue)',
            boxShadow: 'var(--glow-blue)',
          }}
        />
        <span
          className="text-[10px] font-semibold tracking-[0.15em] uppercase"
          style={{ color: 'var(--text-primary)' }}
        >
          MedAssist
        </span>
      </div>

      <div className="w-px h-4" style={{ background: 'var(--chrome-border)' }} />

      <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {MOCK_PATIENT.name}
      </span>

      <div className="w-px h-4" style={{ background: 'var(--chrome-border)' }} />

      <span
        className="text-[10px] px-2 py-0.5 rounded"
        style={{
          background: 'var(--plan-orange-ghost)',
          color: 'var(--plan-orange)',
        }}
      >
        {caseId ? CASE_LABELS[caseId] : regionId ? `${regionId.charAt(0).toUpperCase() + regionId.slice(1)} MRI` : '---'}
      </span>

      <span
        className="text-[11px] tabular-nums"
        style={{
          color: examStartTime ? 'var(--text-primary)' : 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatTime(displayTime)}
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={goBack}
          className="px-2 py-1 rounded text-[9px] transition-colors cursor-pointer"
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--chrome-surface-hover)';
            e.currentTarget.style.borderColor = 'var(--chrome-border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          Change Region
        </button>

        {phase !== 'exam-setup' && (
          <button
            onClick={resetExam}
            className="px-2 py-1 rounded text-[9px] transition-colors cursor-pointer"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--fb-bad)';
              e.currentTarget.style.borderColor = 'rgba(248, 81, 73, 0.4)';
              e.currentTarget.style.background = 'rgba(248, 81, 73, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Reset
          </button>
        )}

        {(phase === 'exam-setup') && (
          <button
            onClick={confirmProtocols}
            disabled={!canConfirm}
            className="px-3 py-1 rounded text-[9px] transition-colors"
            style={{
              background: canConfirm ? 'var(--accent-blue-dim)' : 'transparent',
              border: `1px solid ${canConfirm ? 'rgba(37, 99, 235, 0.3)' : 'var(--chrome-border)'}`,
              color: canConfirm ? 'var(--accent-blue)' : 'var(--text-muted)',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              opacity: canConfirm ? 1 : 0.5,
            }}
          >
            Confirm Protocols
          </button>
        )}

        {(phase === 'protocols-confirmed' || phase === 'survey-running') && (
          <button
            onClick={startSurvey}
            disabled={!canSurvey || isSurveying}
            className="px-3 py-1 rounded text-[9px] font-medium transition-colors"
            style={{
              background: canSurvey ? 'var(--accent-blue)' : 'var(--chrome-surface-raised)',
              border: `1px solid ${canSurvey ? 'var(--accent-blue)' : 'var(--chrome-border)'}`,
              color: canSurvey ? '#ffffff' : 'var(--text-muted)',
              cursor: canSurvey ? 'pointer' : 'not-allowed',
              boxShadow: canSurvey ? 'var(--glow-blue)' : 'none',
            }}
          >
            {isSurveying ? 'Surveying...' : 'Survey / Scout'}
          </button>
        )}
      </div>
    </div>
  );
}
