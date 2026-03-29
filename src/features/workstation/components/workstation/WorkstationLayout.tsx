'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import type { ViewType } from '@/features/workstation/types/mri';
import { usePlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';
import type { BoxRenderMode } from '@/features/planner/types/planner';
import WorkstationTopBar from './WorkstationTopBar';
import ProtocolSidebar from './ProtocolSidebar';
import ProtocolBrowser from './ProtocolBrowser';
import ScannerStatusBar from './ScannerStatusBar';
import BottomRightTabs from './BottomRightTabs';
import EmptyPanel from './EmptyPanel';
import PlanningCanvasPanel from './PlanningCanvasPanel';
import SurveyAnimation from './SurveyAnimation';
import ConfirmationDialog from './ConfirmationDialog';
import { MOCK_PATIENT } from '@/features/workstation/lib/mockData';
import { ORIENTATION_LABELS } from '@/features/workstation/types/mri';
import SequenceOrderPanel from '@/features/guidance/components/SequenceOrderPanel';
import { GuidedPlanningOverlay } from '@/features/guidance/components/GuidedPlanningOverlay';
import { GuidanceFlowOverlays } from '@/features/guidance/components/GuidanceFlowOverlays';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';

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

const RENDER_MODE_LABELS: Record<BoxRenderMode, string> = {
  flat2d: 'Flat 2D',
  cube3d: '3D Wire',
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
      <div className="panel-heading mb-2">
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
        <div>
          <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Study Type</div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {MOCK_PATIENT.studyType}
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Contrast</div>
            <div className="text-[10px]" style={{ color: MOCK_PATIENT.contrastRequired ? 'var(--fb-warn)' : 'var(--text-secondary)' }}>
              {MOCK_PATIENT.contrastRequired ? `Yes — ${MOCK_PATIENT.contrastAgent}` : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Canvas toolbar with render mode toggle and show target */
function CanvasToolbar({ bridge }: { bridge: ReturnType<typeof usePlannerBridge> }) {
  const { planner, boxRenderMode, setBoxRenderMode } = bridge;

  const toggleMode = () => {
    setBoxRenderMode(boxRenderMode === 'flat2d' ? 'cube3d' : 'flat2d');
  };

  return (
    <div
      className="flex items-center gap-3 px-2 py-0.5 shrink-0"
      style={{
        background: 'var(--chrome-surface)',
        borderBottom: '1px solid var(--chrome-border)',
      }}
    >
      <button
        onClick={toggleMode}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] cursor-pointer transition-colors"
        style={{
          background: 'var(--chrome-surface-raised)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--chrome-border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue)';
          e.currentTarget.style.color = 'var(--accent-blue)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--chrome-border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue)';
          e.currentTarget.style.color = 'var(--accent-blue)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--chrome-border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        {RENDER_MODE_LABELS[boxRenderMode]}
      </button>

      {bridge.resolved && (
        <label
          className="flex items-center gap-1 text-[8px] cursor-pointer select-none"
          style={{ color: 'var(--text-muted)' }}
        >
          <input
            type="checkbox"
            checked={planner.showTargetAlways}
            disabled={!(planner.canRevealTarget || planner.instructorMode)}
            onChange={(e) => planner.setShowTargetAlways(e.target.checked)}
            className="cursor-pointer"
            style={{ accentColor: 'var(--accent-blue)' }}
          />
          Show Target
        </label>
      )}

      <div className="flex-1" />

      <span className="text-[7px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Drag axial / sagittal to plan
      </span>
    </div>
  );
}

export default function WorkstationLayout() {
  const phase = useWorkstationStore((s) => s.phase);
  const startSurvey = useWorkstationStore((s) => s.startSurvey);
  const bridge = usePlannerBridge();
  const orderConfirmed = useGuidanceStore((s) => s.orderConfirmed);
  const setOrderConfirmed = useGuidanceStore((s) => s.setOrderConfirmed);

  const showCanvasPanels = bridge.isActive;
  const showBlackPanels = (phase === 'survey-complete' || phase === 'protocol-active') && !showCanvasPanels;
  const showSurvey = phase === 'survey-running';
  const showOrderPanel = phase === 'protocols-confirmed' && !orderConfirmed;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <WorkstationTopBar />

      <div className="flex-1 min-h-0 flex">
        <ProtocolSidebar />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Canvas toolbar (only when canvases are shown) */}
          {showCanvasPanels && <CanvasToolbar bridge={bridge} />}

          {/* Image panels row */}
          <div
            className="flex-1 min-h-0 flex gap-px p-px relative"
            style={{ background: 'var(--chrome-border)' }}
          >
            {showCanvasPanels ? (
              VIEWS.map((view) => (
                <PlanningCanvasPanel key={view} view={view} bridge={bridge} />
              ))
            ) : showBlackPanels ? (
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
            {showCanvasPanels && <GuidedPlanningOverlay />}
          </div>

          <ProtocolBrowser bridge={bridge} />
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
            <BottomRightTabs bridge={bridge} />
          </div>
        </div>
      </div>

      <ScannerStatusBar />
      <ConfirmationDialog />
      <SequenceOrderPanel
        open={showOrderPanel}
        onConfirm={() => {
          setOrderConfirmed(true);
          startSurvey();
        }}
      />
      {showCanvasPanels && <GuidanceFlowOverlays bridge={bridge} />}
    </div>
  );
}
