'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import type { ViewType } from '@/features/workstation/types/mri';
import WorkstationTopBar from './WorkstationTopBar';
import ProtocolSidebar from './ProtocolSidebar';
import ProtocolBrowser from './ProtocolBrowser';
import ScannerStatusBar from './ScannerStatusBar';
import BottomRightTabs from './BottomRightTabs';
import EmptyPanel from './EmptyPanel';
import SurveyAnimation from './SurveyAnimation';
import ConfirmationDialog from './ConfirmationDialog';
import { MOCK_PATIENT } from '@/features/workstation/lib/mockData';
import { ORIENTATION_LABELS } from '@/features/workstation/types/mri';

const VIEWS: ViewType[] = ['sagittal', 'coronal', 'axial'];
const VIEW_LABELS: Record<ViewType, string> = {
  sagittal: 'SAGITTAL',
  coronal: 'CORONAL',
  axial: 'AXIAL',
};
const AXIS_COLORS: Record<string, string> = {
  A: 'var(--axis-ap)',
  P: 'var(--axis-ap)',
  R: 'var(--axis-rl)',
  L: 'var(--axis-rl)',
  H: 'var(--axis-fh)',
  F: 'var(--axis-fh)',
};

/** Black panel shown after survey (no images loaded — mock only) */
function BlackPanel({ view }: { view: ViewType }) {
  const labels = ORIENTATION_LABELS[view];

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden animate-fade-in"
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
    >
      {/* View label header */}
      <div
        className="flex items-center gap-2 px-2 py-1 text-[9px] tracking-[0.15em] uppercase shrink-0"
        style={{
          background: 'var(--chrome-surface)',
          borderBottom: '1px solid var(--chrome-border)',
          color: 'var(--text-secondary)',
        }}
      >
        {VIEW_LABELS[view]}
      </div>

      {/* Black panel content */}
      <div className="flex-1 relative min-h-0">
        {/* Orientation labels */}
        {Object.entries(labels).map(([position, label]) => (
          <span
            key={position}
            className="absolute text-[12px] font-bold z-10"
            style={{
              color: AXIS_COLORS[label],
              textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
              ...(position === 'top' ? { top: 8, left: '50%', transform: 'translateX(-50%)' } :
                position === 'bottom' ? { bottom: 8, left: '50%', transform: 'translateX(-50%)' } :
                position === 'left' ? { left: 8, top: '50%', transform: 'translateY(-50%)' } :
                { right: 8, top: '50%', transform: 'translateY(-50%)' }),
            }}
          >
            {label}
          </span>
        ))}

        {/* Scanline overlay */}
        <div className="panel-scanline absolute inset-0 z-10" />
      </div>
    </div>
  );
}

/** Patient info in the right panel */
function PatientInfoSection() {
  return (
    <div className="p-3" style={{ borderBottom: '1px solid var(--chrome-border)' }}>
      <div
        className="text-[8px] uppercase tracking-[0.2em] mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Patient Information
      </div>
      <div className="space-y-1.5">
        <div>
          <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Name</div>
          <div className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {MOCK_PATIENT.name}
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>DOB</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {MOCK_PATIENT.dob}
            </div>
          </div>
          <div>
            <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Gender</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {MOCK_PATIENT.gender}
            </div>
          </div>
          <div>
            <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Age</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {MOCK_PATIENT.age}Y
            </div>
          </div>
        </div>
        <div>
          <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Weight</div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {MOCK_PATIENT.weight}
          </div>
        </div>
        <div>
          <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Patient ID</div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {MOCK_PATIENT.id}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkstationLayout() {
  const phase = useWorkstationStore((s) => s.phase);

  const showBlackPanels = phase === 'survey-complete' || phase === 'protocol-active';
  const showSurvey = phase === 'survey-running';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <WorkstationTopBar />

      <div className="flex-1 min-h-0 flex">
        <ProtocolSidebar />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Image panels row */}
          <div
            className="flex-1 min-h-0 flex gap-px p-px relative"
            style={{ background: 'var(--chrome-border)' }}
          >
            {showBlackPanels ? (
              VIEWS.map((view) => (
                <BlackPanel key={view} view={view} />
              ))
            ) : (
              VIEWS.map((view) => (
                <EmptyPanel
                  key={view}
                  view={view}
                  showScanAnimation={showSurvey}
                />
              ))
            )}

            {showSurvey && <SurveyAnimation />}
          </div>

          <ProtocolBrowser />
        </div>

        {/* Right Panel */}
        <div
          className="flex flex-col shrink-0"
          style={{
            width: 240,
            background: 'var(--chrome-surface)',
            borderLeft: '1px solid var(--chrome-border)',
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            <PatientInfoSection />
          </div>
          <div
            className="shrink-0"
            style={{
              height: 220,
              borderTop: '1px solid var(--chrome-border)',
            }}
          >
            <BottomRightTabs />
          </div>
        </div>
      </div>

      <ScannerStatusBar />
      <ConfirmationDialog />
    </div>
  );
}
