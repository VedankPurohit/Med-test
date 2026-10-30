'use client';

import type { PlannerBridge } from '@/features/workstation/hooks/usePlannerBridge';

export default function DynamicParameterPanel({ bridge }: { bridge: PlannerBridge }) {
  const { planner, resolved } = bridge;
  const protocol = planner.currentProtocol;
  const highlights = new Map((protocol?.teaching?.parameterHighlights ?? []).map((entry) => [String(entry.key), entry.explanation]));

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <span
          className="text-[8px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Scan Parameters
        </span>
        <span
          className="text-[10px] font-medium ml-auto"
          style={{ color: 'var(--accent-blue)' }}
        >
          {protocol.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        <div
          className="rounded px-2 py-2"
          style={{ background: 'var(--chrome-surface-raised)', border: '1px solid var(--chrome-border)' }}
        >
          <div className="text-[8px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            Sequence Purpose
          </div>
          <div className="text-[9px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            {protocol.teaching?.purpose ?? "Adjust planning and parameters for the active sequence."}
          </div>
          <div className="text-[8px] mt-2 uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            Planning Hint
          </div>
          <div className="text-[9px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            {protocol.teaching?.planningHint ?? "Use the three orthogonal views to center and angle the slab correctly."}
          </div>
        </div>

        {/* Protocol parameters from parameterSpecs */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {protocol.parameterSpecs.map((spec) => {
            const key = String(spec.key);
            const value = planner.params?.[key] ?? spec.min ?? 0;
            const label = spec.unit ? `${spec.label} (${spec.unit})` : spec.label;
            const targetValue = protocol.target.params[key];
            const explanation = highlights.get(key);
            return (
              <div key={key}>
                <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </div>
                <input
                  type="number"
                  className="w-full text-[10px] bg-transparent border-b px-0 py-0.5 outline-none"
                  style={{
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--chrome-border)',
                  }}
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={value}
                  onChange={(e) => planner.changeParam(key, Number(e.target.value))}
                />
                {targetValue !== undefined && (
                  <div className="text-[7px] mt-0.5" style={{ color: 'var(--chrome-border-bright)' }}>
                    Target: {targetValue}{spec.unit ? ` ${spec.unit}` : ""}
                  </div>
                )}
                {explanation && (
                  <div className="text-[7px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coverage sliders */}
        <div>
          <div
            className="text-[8px] uppercase tracking-[0.15em] mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
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
                  type="range"
                  min="0.2"
                  max="1.8"
                  step="0.01"
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
          <div
            className="text-[8px] uppercase tracking-[0.15em] mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
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
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
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
