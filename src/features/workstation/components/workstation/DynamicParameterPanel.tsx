'use client';

import { useMemo, useCallback } from 'react';
import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';
import type { ProtocolParameterSpec } from '@/features/planner/types/planner';
import { computeScanTime } from '@/features/planner/data/protocols/helpers';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';
import {
  PHASE_ENC_DIRECTIONS,
  FAT_SUPPRESSION_MODES,
} from '@/features/planner/types/planner';

const TIMING_KEYS = new Set(['TR', 'TE', 'TI']);
const GEOMETRY_KEYS = new Set(['FOV', 'Slices', 'SliceThickness', 'SliceGap', 'MatrixFreq', 'MatrixPhase']);
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

function ParamInput({
  spec,
  value,
  targetValue,
  tipsEnabled,
  onChange,
}: {
  spec: ProtocolParameterSpec;
  value: number;
  targetValue: number | undefined;
  tipsEnabled: boolean;
  onChange: (key: string, value: number) => void;
}) {
  const key = String(spec.key);
  const label = spec.unit ? `${spec.label} (${spec.unit})` : spec.label;

  // Special rendering for enum-like params
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
  onChange,
}: {
  title: string;
  specs: ProtocolParameterSpec[];
  params: Record<string, number>;
  targetParams: Record<string, number>;
  tipsEnabled: boolean;
  onChange: (key: string, value: number) => void;
}) {
  if (specs.length === 0) return null;
  return (
    <div
      className="pb-2.5"
      style={{ borderBottom: '1px solid var(--chrome-border-light)' }}
    >
      <div
        className="section-label mb-1.5"
      >
        {title}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {specs.map((spec) => (
          <ParamInput
            key={String(spec.key)}
            spec={spec}
            value={params[String(spec.key)] ?? spec.min ?? 0}
            targetValue={targetParams[String(spec.key)]}
            tipsEnabled={tipsEnabled}
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <span className="panel-heading">
          Scan Parameters
        </span>
        <span className="text-[10px] font-semibold ml-auto" style={{ color: 'var(--accent-blue)' }}>
          {protocol.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3">
        {/* Computed Scan Time */}
        <div
          className="flex items-center justify-between px-2.5 py-1.5 rounded"
          style={{ background: 'var(--accent-blue-dim)', border: '1px solid rgba(37,99,235,0.2)' }}
        >
          <span className="text-[8px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
            Scan Time
          </span>
          <span className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--accent-blue)', fontVariantNumeric: 'tabular-nums' }}>
            {scanTime < 60
              ? `${scanTime.toFixed(1)}s`
              : `${Math.floor(scanTime / 60)}:${String(Math.round(scanTime % 60)).padStart(2, '0')}`}
          </span>
        </div>

        {/* Grouped parameters */}
        <ParamGroup title="Timing" specs={groups.timing} params={params} targetParams={targetParams} tipsEnabled={tipsEnabled} onChange={handleChange} />
        <ParamGroup title="Geometry" specs={groups.geometry} params={params} targetParams={targetParams} tipsEnabled={tipsEnabled} onChange={handleChange} />
        <ParamGroup title="Acquisition" specs={groups.acquisition} params={params} targetParams={targetParams} tipsEnabled={tipsEnabled} onChange={handleChange} />
        <ParamGroup title="Other" specs={groups.other} params={params} targetParams={targetParams} tipsEnabled={tipsEnabled} onChange={handleChange} />

        {/* Coverage sliders */}
        <div>
          <div className="section-label mb-1.5">
            Coverage
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <label key={axis} className="text-[8px] block" style={{ color: 'var(--text-muted)' }}>
                <span className="flex justify-between mb-0.5">
                  <span>{axis.toUpperCase()}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {(planner.box?.size[axis] ?? 0.5).toFixed(2)}
                  </span>
                </span>
                <input
                  type="range" min="0.2" max="1.8" step="0.01"
                  value={planner.box?.size[axis] ?? 0.5}
                  onChange={(e) => planner.changeSize(axis, Number(e.target.value))}
                  className="w-full"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Angulation sliders */}
        <div>
          <div className="section-label mb-1.5">
            Angulation
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { axis: 'rx' as const, label: 'Sag' },
              { axis: 'ry' as const, label: 'Cor' },
              { axis: 'rz' as const, label: 'Ax' },
            ]).map(({ axis, label }) => (
              <label key={axis} className="text-[8px] block" style={{ color: 'var(--text-muted)' }}>
                <span className="flex justify-between mb-0.5">
                  <span>{label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {(planner.box?.rotation[axis] ?? 0).toFixed(0)}°
                  </span>
                </span>
                <input
                  type="range" min="-45" max="45" step="1"
                  value={planner.box?.rotation[axis] ?? 0}
                  onChange={(e) => planner.changeRotation(axis, Number(e.target.value))}
                  className="w-full"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
