'use client';

import { useEffect, useState } from 'react';
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import RegionSelector from '@/features/workstation/components/planning/RegionSelector';
import SpineSubRegionSelector from '@/features/workstation/components/planning/SpineSubRegionSelector';
import WorkstationLayout from '@/features/workstation/components/workstation/WorkstationLayout';

function MobileWarning() {
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
  }, []);

  if (!isMobile || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#0d1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 8 }}>
          Desktop Recommended
        </div>
        <p style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.6, marginBottom: 20 }}>
          MedAssist is designed for desktop screens (1024px+). The MRI planning interface requires
          precise mouse interactions that work best on a larger display.
        </p>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: '8px 24px',
            fontSize: 11,
            background: 'rgba(37, 99, 235, 0.12)',
            color: '#58a6ff',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const phase = useWorkstationStore((s) => s.phase);
  const selectRegion = useWorkstationStore((s) => s.selectRegion);
  const selectSubRegion = useWorkstationStore((s) => s.selectSubRegion);
  const goBack = useWorkstationStore((s) => s.goBackToRegionSelect);

  return (
    <>
      <MobileWarning />
      {phase === 'region-select' ? (
        <RegionSelector onSelect={selectRegion} />
      ) : phase === 'spine-subregion' ? (
        <SpineSubRegionSelector onSelect={selectSubRegion} onBack={goBack} />
      ) : (
        <WorkstationLayout />
      )}
    </>
  );
}
