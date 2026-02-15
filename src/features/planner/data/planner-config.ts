import { BRAIN_PROTOCOLS } from "@/features/planner/data/protocols/brain";
import { SPINE_PROTOCOLS } from "@/features/planner/data/protocols/spine";
import { CaseConfig, CaseId, ViewId } from "@/features/planner/types/planner";

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
    protocols: BRAIN_PROTOCOLS
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
    protocols: SPINE_PROTOCOLS
  }
];

export const CASE_MAP = Object.fromEntries(CASES.map((entry) => [entry.id, entry])) as Record<
  CaseId,
  CaseConfig
>;
