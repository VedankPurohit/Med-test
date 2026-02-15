import { CaseConfig, CaseId, PlannerParams, ProtocolTarget, ViewId } from "@/features/planner/types/planner";

const params = (
  TR: number,
  TE: number,
  FOV: number,
  Slices: number,
  SliceThickness: number,
  SliceGap: number
): PlannerParams => ({ TR, TE, FOV, Slices, SliceThickness, SliceGap });

const target = (
  center: ProtocolTarget["center"],
  size: ProtocolTarget["size"],
  rotation: ProtocolTarget["rotation"],
  p: PlannerParams
): ProtocolTarget => ({ center, size, rotation, params: p });

const localizerViews = (caseId: CaseId, set: string): Record<ViewId, string> => ({
  axial: `/localizers/${caseId}/${set}/axial.png`,
  sagittal: `/localizers/${caseId}/${set}/sagittal.png`,
  coronal: `/localizers/${caseId}/${set}/coronal.png`
});

export const CASES: CaseConfig[] = [
  {
    id: "brain",
    label: "Brain",
    localizerSets: [
      {
        id: "default",
        label: "Brain Default",
        views: localizerViews("brain", "default")
      }
    ],
    protocols: [
      {
        id: "brain_ax_t2",
        label: "Brain Axial T2",
        target: target(
          { x: 0.02, y: -0.06, z: 0.12 },
          { x: 0.95, y: 0.78, z: 0.55 },
          { rx: -6, ry: 2, rz: 10 },
          params(4200, 95, 220, 24, 5, 0.5)
        ),
        initial: target(
          { x: -0.24, y: 0.17, z: 0.34 },
          { x: 0.62, y: 0.56, z: 0.42 },
          { rx: 8, ry: -5, rz: -8 },
          params(3000, 70, 240, 18, 4, 1.2)
        ),
        tolerances: { center: 0.22, size: 0.21, rotation: 16, param: 0.22 }
      },
      {
        id: "brain_cor_flair",
        label: "Brain Coronal FLAIR",
        target: target(
          { x: 0.04, y: -0.02, z: 0.06 },
          { x: 0.86, y: 0.68, z: 0.75 },
          { rx: -12, ry: -4, rz: 2 },
          params(8500, 110, 230, 28, 4, 0.5)
        ),
        initial: target(
          { x: -0.15, y: 0.11, z: -0.24 },
          { x: 0.66, y: 0.6, z: 0.44 },
          { rx: 9, ry: 7, rz: 11 },
          params(6400, 85, 250, 20, 5, 1.0)
        ),
        tolerances: { center: 0.23, size: 0.2, rotation: 17, param: 0.22 }
      }
    ]
  },
  {
    id: "spine",
    label: "Spine",
    localizerSets: [
      {
        id: "default",
        label: "Spine Default",
        views: localizerViews("spine", "default")
      }
    ],
    protocols: [
      {
        id: "cspine_sag_t2",
        label: "C-Spine Sagittal T2",
        target: target(
          { x: -0.12, y: -0.08, z: 0.0 },
          { x: 0.62, y: 1.02, z: 0.58 },
          { rx: 14, ry: 8, rz: -4 },
          params(3000, 105, 260, 15, 3, 0.3)
        ),
        initial: target(
          { x: 0.2, y: 0.28, z: -0.24 },
          { x: 0.44, y: 0.68, z: 0.34 },
          { rx: -4, ry: -7, rz: 8 },
          params(2300, 70, 300, 12, 4, 1)
        ),
        tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 }
      },
      {
        id: "lspine_ax_t2",
        label: "L-Spine Axial T2",
        target: target(
          { x: 0.06, y: -0.14, z: -0.18 },
          { x: 0.76, y: 0.56, z: 0.44 },
          { rx: -8, ry: 3, rz: 12 },
          params(3500, 100, 210, 20, 4, 0.4)
        ),
        initial: target(
          { x: -0.22, y: 0.1, z: 0.18 },
          { x: 0.48, y: 0.38, z: 0.3 },
          { rx: 10, ry: -6, rz: -10 },
          params(2400, 75, 260, 14, 5, 1.2)
        ),
        tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.22 }
      }
    ]
  }
];

export const CASE_MAP = Object.fromEntries(CASES.map((entry) => [entry.id, entry])) as Record<
  CaseId,
  CaseConfig
>;
