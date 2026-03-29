'use client';

import { getAllRegions, type RegionConfig } from '@/features/workstation/lib/regions';
import type { RegionId } from '@/features/workstation/types/mri';

interface RegionSelectorProps {
  onSelect: (regionId: RegionId) => void;
}

function RegionCard({
  region,
  onSelect,
}: {
  region: RegionConfig;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-3 px-8 py-8 rounded-lg transition-all duration-200 cursor-pointer"
      style={{
        background: 'var(--chrome-surface)',
        border: '1px solid var(--chrome-border)',
        minWidth: '220px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-blue)';
        e.currentTarget.style.background = 'var(--accent-blue-dim)';
        e.currentTarget.style.boxShadow = 'var(--glow-blue)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--chrome-border)';
        e.currentTarget.style.background = 'var(--chrome-surface)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--accent-blue-dim)' }}
      >
        <span
          className="text-[20px] font-bold"
          style={{ color: 'var(--accent-blue)' }}
        >
          {region.id === 'brain' ? 'B' : region.id === 'spine' ? 'S' : 'K'}
        </span>
      </div>

      <span
        className="text-[14px] font-semibold tracking-wide"
        style={{ color: 'var(--text-primary)' }}
      >
        {region.displayName}
      </span>

      <p
        className="text-[10px] leading-relaxed text-center max-w-[200px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {region.description}
      </p>

      <span
        className="text-[10px] tracking-wide uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--accent-blue)' }}
      >
        Select &rsaquo;
      </span>
    </button>
  );
}

export default function RegionSelector({ onSelect }: RegionSelectorProps) {
  const regions = getAllRegions();

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center gap-8 select-none"
      style={{
        background: 'radial-gradient(ellipse at center, var(--chrome-surface) 0%, var(--chrome-bg) 70%)',
      }}
    >
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: 'var(--accent-blue)',
              boxShadow: 'var(--glow-blue)',
            }}
          />
          <span
            className="text-[12px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            MedAssist
          </span>
        </div>
        <p
          className="text-[11px] tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          Select body region to begin
        </p>
      </div>

      <div className="flex gap-4">
        {regions.map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            onSelect={() => onSelect(region.id)}
          />
        ))}
      </div>

      <p
        className="text-[9px] tracking-wide"
        style={{ color: 'var(--chrome-border-bright)' }}
      >
        MRI workstation planning interface
      </p>
    </div>
  );
}
