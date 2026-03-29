import type { RegionId } from '@/features/workstation/types/mri';

/** Simplified region config (no images) */
export interface RegionConfig {
  id: RegionId;
  displayName: string;
  description: string;
}

const BRAIN_REGION: RegionConfig = {
  id: 'brain',
  displayName: 'Brain',
  description:
    'Routine brain MRI with 8 sequences including T2, FLAIR, T1, DWI, SWI, and 3D MPRAGE.',
};

const SPINE_REGION: RegionConfig = {
  id: 'spine',
  displayName: 'Spine',
  description:
    'Cervical spine MRI with 5 sequences including sagittal T2, T1, STIR, and axial T2/T1.',
};

const EXTREMITY_REGION: RegionConfig = {
  id: 'extremity',
  displayName: 'Extremity',
  description:
    'Knee MRI with 5 sequences including sagittal PD, T2 FS, coronal PD, axial PD, and coronal T1.',
};

const REGION_MAP: ReadonlyMap<RegionId, RegionConfig> = new Map([
  [BRAIN_REGION.id, BRAIN_REGION],
  [SPINE_REGION.id, SPINE_REGION],
  [EXTREMITY_REGION.id, EXTREMITY_REGION],
]);

export function getRegion(id: RegionId): RegionConfig {
  const region = REGION_MAP.get(id);
  if (!region) {
    throw new Error(`Unknown region: "${id}"`);
  }
  return region;
}

export function getAllRegions(): RegionConfig[] {
  return Array.from(REGION_MAP.values());
}
