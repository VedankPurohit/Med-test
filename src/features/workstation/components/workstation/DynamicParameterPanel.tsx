'use client';

import { useMemo, useCallback, useEffect } from 'react';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';
import type { ProtocolParameterSpec } from '@/features/planner/types/planner';
import { computeScanTime } from '@/features/planner/data/protocols/helpers';
import {
  axisToSliceOrientationCode,
  getSliceAxis,
  NORM_TO_MM,
} from '@/features/planner/lib/geometry';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';
import {
  PHASE_ENC_DIRECTIONS,
  FAT_SUPPRESSION_MODES,
  SLICE_ORIENTATIONS,
} from '@/features/planner/types/planner';

const TIMING_KEYS = new Set(['TR', 'TE', 'TI']);
const GEOMETRY_KEYS = new Set([
  'FOV', 'Slices', 'SliceThickness', 'SliceGap',
  'MatrixFreq', 'MatrixPhase', 'SliceOrientation',
]);
const ACQUISITION_KEYS = new Set(['NEX', 'Bandwidth', 'ETL', 'FlipAngle', 'PhaseEncDir', 'FatSuppression']);

function groupSpecs(specs: ProtocolParameterSpec[]) {
  const timing: ProtocolParameterSpec[] = [];
  const geometry: ProtocolParameterSpec[] = [];
  const acquisition: ProtocolParameterSpec[] = [];
  const other: ProtocolParameterSpec[] = [];

  for (const spec of specs) {
    const key = String(spec.key);
    if (key === 'ScanTime') continue; // computed, shown separately
    if (TIMING_KEYS.has(key)) timing.push(spec);
    else if (GEOMETRY_KEYS.has(key)) geometry.push(spec);
    else if (ACQUISITION_KEYS.has(key)) acquisition.push(spec);
    else other.push(spec);
  }

  return { timing, geometry, acquisition, other };
}

// Keys whose values drive the box's size on the canvas. Marked in the UI so
// the user immediately sees which inputs replace the old corner/edge handles.
const SIZE_DRIVING_KEYS = new Set(['FOV', 'Slices', 'SliceThickness', 'SliceGap']);

function ParamInput({
  spec,
  value,
  targetValue,
  tipsEnabled,
  protocolId,
  paramsSnapshot,
  onChange,
}: {
  spec: ProtocolParameterSpec;
  value: number;
  targetValue: number | undefined;
  tipsEnabled: boolean;
  protocolId: string | null;
  paramsSnapshot: Record<string, number>;
  onChange: (key: string, value: number) => void;
}) {
  const key = String(spec.key);
  const isSize = SIZE_DRIVING_KEYS.has(key);
  // Append a tiny ◆ marker on size-driving inputs so the user can spot the
  // box-size controls at a glance without reading every label.
  const baseLabel = spec.unit ? `${spec.label} (${spec.unit})` : spec.label;
  const label = isSize ? `${baseLabel} ◆` : baseLabel;

  // Special rendering for enum-like params
  if (key === 'SliceOrientation') {
    // Display value: explicit user choice if set, else the protocol's
    // natural default (so the dropdown always agrees with the live slice
    // axis even before the user has touched it).
    const explicit = paramsSnapshot.SliceOrientation;
    const displayCode = explicit !== undefined
      ? Math.round(Number(explicit))
      : axisToSliceOrientationCode(getSliceAxis(protocolId));
    return (
      <div>
        <div className="text-[8px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <select
          className="param-select w-full text-[10px] bg-transparent border-b px-0 py-1 outline-none transition-colors"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--chrome-border)' }}
          value={displayCode}
          onChange={(e) => onChange(key, Number(e.target.value))}
        >
          {SLICE_ORIENTATIONS.map((orient, i) => (
            <option key={orient} value={i}>{orient}</option>
          ))}
        </select>
      </div>
    );
  }

  if (key === 'PhaseEncDir') {
    return (
      <div>
        <div className="text-[8px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <select
          className="param-select w-full text-[10px] bg-transparent border-b px-0 py-1 outline-none transition-colors"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--chrome-border)' }}
          value={value}
          onChange={(e) => onChange(key, Number(e.target.value))}
        >
          {PHASE_ENC_DIRECTIONS.map((dir, i) => (
            <option key={dir} value={i}>{dir}</option>
          ))}
        </select>
      </div>
    );
  }

  if (key === 'FatSuppression') {
    return (
      <div>
        <div className="text-[8px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <select
          className="param-select w-full text-[10px] bg-transparent border-b px-0 py-1 outline-none transition-colors"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--chrome-border)' }}
          value={value}
          onChange={(e) => onChange(key, Number(e.target.value))}
        >
          {FAT_SUPPRESSION_MODES.map((mode, i) => (
            <option key={mode} value={i}>{mode}</option>
          ))}
        </select>
      </div>
    );
  }

  // Highlight if far from target
  const offTarget = tipsEnabled && targetValue !== undefined &&
    Math.abs(value - targetValue) / Math.max(Math.abs(targetValue), 1) > 0.15;

  return (
    <div>
      <div className="text-[8px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <input
        type="number"
        className="param-input w-full text-[10px] bg-transparent border-b px-0 py-1 outline-none transition-colors"
        style={{
          color: 'var(--text-secondary)',
          borderColor: offTarget ? 'var(--fb-warn)' : 'var(--chrome-border)',
        }}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        onChange={(e) => onChange(key, Number(e.target.value))}
      />
    </div>
  );
}

function ParamGroup({
  title,
  specs,
  params,
  targetParams,
  tipsEnabled,
  protocolId,
  onChange,
}: {
  title: string;
  specs: ProtocolParameterSpec[];
  params: Record<string, number>;
  targetParams: Record<string, number>;
  tipsEnabled: boolean;
  protocolId: string | null;
  onChange: (key: string, value: number) => void;
}) {
  if (specs.length === 0) return null;
  return (
    <div
      className="pb-1.5"
      style={{ borderBottom: '1px solid var(--chrome-border-light)' }}
    >
      <div
        className="section-label mb-1"
      >
        {title}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {specs.map((spec) => (
          <ParamInput
            key={String(spec.key)}
            spec={spec}
            value={params[String(spec.key)] ?? spec.min ?? 0}
            targetValue={targetParams[String(spec.key)]}
            tipsEnabled={tipsEnabled}
            protocolId={protocolId}
            paramsSnapshot={params}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

export default function DynamicParameterPanel({ bridge }: { bridge: PlannerBridge }) {
  const { planner, resolved } = bridge;
  const protocol = planner.currentProtocol;
  const tipsEnabled = useGuidanceStore((s) => s.tipsEnabled);

  const groups = useMemo(
    () => protocol ? groupSpecs(protocol.parameterSpecs) : { timing: [], geometry: [], acquisition: [], other: [] },
    [protocol]
  );
  const params = planner.params ?? {};
  const scanTime = useMemo(() => computeScanTime(params), [params]);
  const handleChange = useCallback(
    (key: string, value: number) => planner.changeParam(key, value),
    [planner]
  );

  // Parameter-driven sizing. Box dimensions on the canvas are no longer
  // editable via UI handles — they're derived from the geometry parameters:
  //   slice-axis length (mm) = Slices * SliceThickness + (Slices - 1) * SliceGap
  //   in-plane width  (mm)   = FOV
  // We watch the *clamped* params (changeParam clamps against spec.min/max
  // before storing), then push the resulting size through changeSize. This
  // fires on every param change *and* on protocol switch, which is the
  // intended contract: params are the source of truth for box size.
  const protocolId = planner.protocolId;
  const changeSize = planner.changeSize;
  useEffect(() => {
    if (!protocolId) return;
    // Pass params so an explicit SliceOrientation override (LR/AP/HF) wins
    // over the protocol-id default. When the user flips orientation, this
    // effect re-runs and reassigns slice-vs-FOV roles across all 3 axes.
    const sliceAxis = getSliceAxis(protocolId, params);

    const slices = Number(params.Slices ?? 0);
    const thickness = Number(params.SliceThickness ?? 0);
    const gap = Number(params.SliceGap ?? 0);
    const fov = Number(params.FOV ?? 0);

    const sliceLengthMm = slices * thickness + Math.max(0, slices - 1) * gap;
    if (sliceLengthMm > 0) {
      changeSize(sliceAxis, sliceLengthMm / NORM_TO_MM);
    }
    if (fov > 0) {
      const fovNorm = fov / NORM_TO_MM;
      (['x', 'y', 'z'] as const).forEach((ax) => {
        if (ax !== sliceAxis) changeSize(ax, fovNorm);
      });
    }
    // We intentionally depend only on the primitive param values + protocolId
    // so the effect doesn't loop on identity-unstable references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    protocolId,
    changeSize,
    params.Slices,
    params.SliceThickness,
    params.SliceGap,
    params.FOV,
    params.SliceOrientation,
  ]);

  if (!protocol || !resolved) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            SCAN PARAMETERS
          </div>
          <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
            Select a protocol to view parameters
          </div>
        </div>
      </div>
    );
  }

  const targetParams = protocol.target.params;

  // Live box dimensions, in mm, for the explainer header above the Geometry
  // column. The slice axis comes from the same getSliceAxis call the sizing
  // effect uses, so the displayed length always matches the canvas.
  const sliceAxis = protocolId ? getSliceAxis(protocolId, params) : 'z';
  const sliceLengthMm = Math.round(((planner.box?.size[sliceAxis] ?? 0)) * NORM_TO_MM);
  const inPlaneAxis = (['x', 'y', 'z'] as const).find((ax) => ax !== sliceAxis) ?? 'x';
  const inPlaneFovMm = Math.round((planner.box?.size[inPlaneAxis] ?? 0) * NORM_TO_MM);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <span className="panel-heading">
          Scan Parameters
        </span>
        <span className="text-[10px] font-semibold ml-auto" style={{ color: 'var(--accent-blue)' }}>
          {protocol.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1.5">
        {/* Scan Time + Coverage in mm */}
        <div className="flex items-center gap-3 mb-1.5">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{ background: 'var(--accent-blue-dim)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <span className="text-[7px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Time</span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--accent-blue)' }}>
              {scanTime < 60
                ? `${scanTime.toFixed(1)}s`
                : `${Math.floor(scanTime / 60)}:${String(Math.round(scanTime % 60)).padStart(2, '0')}`}
            </span>
          </div>
          <div className="text-[7px]" style={{ color: 'var(--text-muted)' }}>
            Coverage: <span style={{ color: 'var(--text-secondary)' }}>
              {Math.round((planner.box?.size.x ?? 0.5) * NORM_TO_MM)}&times;{Math.round((planner.box?.size.y ?? 0.5) * NORM_TO_MM)}&times;{Math.round((planner.box?.size.z ?? 0.5) * NORM_TO_MM)}mm
            </span>
          </div>
        </div>

        {/* Two-column: GEOMETRY | CONTRAST */}
        <div className="flex gap-3 mb-1.5">
          <div className="flex-1 min-w-0">
            {/* Box-size explainer — calls out *which* parameters change the
                box on the canvas (since rotate/move are now the only gestural
                edits, the size has to come from somewhere visible). The ◆
                marker is repeated next to each size-driving input below. */}
            <div
              className="mb-1.5 px-2 py-1 rounded"
              style={{
                background: 'var(--accent-blue-dim)',
                border: '1px solid rgba(37,99,235,0.2)',
              }}
            >
              <div
                className="text-[7px] uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Box size ◆ <span style={{ textTransform: 'none' }}>(edit values below)</span>
              </div>
              <div className="text-[9px] tabular-nums mt-0.5" style={{ color: 'var(--accent-blue)' }}>
                Length&nbsp;
                <span style={{ color: 'var(--text-secondary)' }}>{sliceLengthMm}mm</span>
                <span style={{ color: 'var(--text-muted)' }}> · {sliceAxis.toUpperCase()}-axis</span>
                {' · '}
                FOV&nbsp;
                <span style={{ color: 'var(--text-secondary)' }}>{inPlaneFovMm}mm</span>
                <span style={{ color: 'var(--text-muted)' }}> · in-plane</span>
              </div>
              <div className="text-[7px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Length = Slices × Thickness (+ Gap) · In-plane = FOV
              </div>
            </div>
            <ParamGroup title="Geometry" specs={groups.geometry} params={params} targetParams={targetParams} tipsEnabled={tipsEnabled} protocolId={protocolId} onChange={handleChange} />
          </div>
          <div className="flex-1 min-w-0">
            <ParamGroup title="Contrast" specs={[...groups.timing, ...groups.acquisition, ...groups.other]} params={params} targetParams={targetParams} tipsEnabled={tipsEnabled} protocolId={protocolId} onChange={handleChange} />
          </div>
        </div>

        {/* Coverage + Angulation sliders intentionally removed. Box position
            and rotation are gestural-only (drag / rotate ring on the canvas);
            box size is derived from Slices, SliceThickness, SliceGap, and
            FOV in the Geometry group above. */}
      </div>
    </div>
  );
}
