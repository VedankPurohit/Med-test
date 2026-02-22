/** Body region for protocol grouping */
export type RegionId = 'brain' | 'spine';

/** Anatomical view type */
export type ViewType = 'sagittal' | 'coronal' | 'axial';

/** Orientation label positions per view */
export interface OrientationLabels {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

/** Orientation labels for each view */
export const ORIENTATION_LABELS: Record<ViewType, OrientationLabels> = {
  sagittal: { top: 'H', bottom: 'F', left: 'A', right: 'P' },
  coronal:  { top: 'H', bottom: 'F', left: 'R', right: 'L' },
  axial:    { top: 'A', bottom: 'P', left: 'R', right: 'L' },
};
