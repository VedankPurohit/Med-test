'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import RegionSelector from '@/features/workstation/components/planning/RegionSelector';
import SpineSubRegionSelector from '@/features/workstation/components/planning/SpineSubRegionSelector';
import WorkstationLayout from '@/features/workstation/components/workstation/WorkstationLayout';

export default function HomePage() {
  const phase = useWorkstationStore((s) => s.phase);
  const selectRegion = useWorkstationStore((s) => s.selectRegion);
  const selectSubRegion = useWorkstationStore((s) => s.selectSubRegion);
  const goBack = useWorkstationStore((s) => s.goBackToRegionSelect);

  if (phase === 'region-select') return <RegionSelector onSelect={selectRegion} />;
  if (phase === 'spine-subregion') return <SpineSubRegionSelector onSelect={selectSubRegion} onBack={goBack} />;
  return <WorkstationLayout />;
}
