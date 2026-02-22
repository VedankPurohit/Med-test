'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import RegionSelector from '@/features/workstation/components/planning/RegionSelector';
import WorkstationLayout from '@/features/workstation/components/workstation/WorkstationLayout';

export default function HomePage() {
  const phase = useWorkstationStore((s) => s.phase);
  const selectRegion = useWorkstationStore((s) => s.selectRegion);

  if (phase === 'region-select') return <RegionSelector onSelect={selectRegion} />;
  return <WorkstationLayout />;
}
