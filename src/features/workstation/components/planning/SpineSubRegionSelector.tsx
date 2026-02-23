'use client';

import type { CaseId } from '@/features/workstation/types/mri';

interface SubRegionOption {
  caseId: CaseId;
  displayName: string;
  abbreviation: string;
  description: string;
}

const SPINE_SUBREGIONS: SubRegionOption[] = [
  {
    caseId: 'cspine',
    displayName: 'Cervical Spine',
    abbreviation: 'C',
    description: 'C-spine sagittal and axial sequences for cervical pathology.',
  },
  {
    caseId: 'tspine',
    displayName: 'Thoracic Spine',
    abbreviation: 'T',
    description: 'Thoracic spine sagittal and axial sequences for dorsal pathology.',
  },
  {
    caseId: 'lspine',
    displayName: 'Lumbar Spine',
    abbreviation: 'L',
    description: 'Lumbar spine sagittal, axial, and coronal sequences.',
  },
];

interface SpineSubRegionSelectorProps {
  onSelect: (caseId: CaseId) => void;
  onBack: () => void;
}

export default function SpineSubRegionSelector({ onSelect, onBack }: SpineSubRegionSelectorProps) {
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
            Spine Region
          </span>
        </div>
        <p
          className="text-[11px] tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          Select spine sub-region to continue
        </p>
      </div>

      <div className="flex gap-4">
        {SPINE_SUBREGIONS.map((option) => (
          <button
            key={option.caseId}
            onClick={() => onSelect(option.caseId)}
            className="group relative flex flex-col items-center gap-3 px-8 py-8 rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              background: 'var(--chrome-surface)',
              border: '1px solid var(--chrome-border)',
              minWidth: '200px',
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
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.background = 'var(--accent-blue-dim)';
              e.currentTarget.style.boxShadow = 'var(--glow-blue)';
            }}
            onBlur={(e) => {
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
                {option.abbreviation}
              </span>
            </div>

            <span
              className="text-[14px] font-semibold tracking-wide"
              style={{ color: 'var(--text-primary)' }}
            >
              {option.displayName}
            </span>

            <p
              className="text-[10px] leading-relaxed text-center max-w-[180px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {option.description}
            </p>

            <span
              className="text-[10px] tracking-wide uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--accent-blue)' }}
            >
              Select &rsaquo;
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="text-[10px] tracking-wide cursor-pointer transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        &lsaquo; Back to region select
      </button>
    </div>
  );
}
