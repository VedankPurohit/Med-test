import { BRAIN_PROTOCOLS } from "@/features/planner/data/protocols/brain";
import { CSPINE_PROTOCOLS } from "@/features/planner/data/protocols/cspine";
import { TSPINE_PROTOCOLS } from "@/features/planner/data/protocols/tspine";
import { LSPINE_PROTOCOLS } from "@/features/planner/data/protocols/lspine";
import { KNEE_PROTOCOLS } from "@/features/planner/data/protocols/knee";
import { validateProtocolConfig } from "@/features/planner/lib/validation";
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
        label: "Clinical - Basal Ganglia Level",
        views: localizerViews("brain", "default")
      },
      {
        id: "clinical-high",
        label: "Clinical - Centrum Semiovale",
        views: localizerViews("brain", "clinical-high")
      },
      {
        id: "clinical-low",
        label: "Clinical - Posterior Fossa",
        views: localizerViews("brain", "clinical-low")
      }
    ],
    protocols: BRAIN_PROTOCOLS,
    // Real single-patient T1 (Chris Rorden / niivue-images, CC BY-NC 4.0).
    // Replaces the MNI152 averaged atlas template, which looked synthetic due to
    // population averaging blurring out individual anatomical variation.
    volumeUrl: "/volumes/brain/brain_t1.nii.gz"
  },
  {
    id: "cspine",
    label: "Cervical Spine",
    localizerSets: [
      {
        id: "default",
        label: "Cervical Spine Default",
        views: localizerViews("cspine", "default")
      }
    ],
    protocols: CSPINE_PROTOCOLS,
    volumeUrl: "/volumes/cspine/cspine_t2.nii.gz"
  },
  {
    id: "tspine",
    label: "Thoracic Spine",
    localizerSets: [
      {
        id: "default",
        label: "Thoracic Spine Default",
        views: localizerViews("tspine", "default")
      }
    ],
    protocols: TSPINE_PROTOCOLS,
    volumeUrl: "/volumes/tspine/tspine_t2.nii.gz"
  },
  {
    id: "lspine",
    label: "Lumbar Spine",
    localizerSets: [
      {
        id: "default",
        label: "Lumbar Spine Default",
        views: localizerViews("lspine", "default")
      }
    ],
    protocols: LSPINE_PROTOCOLS,
    volumeUrl: "/volumes/lspine/lspine_t2.nii.gz"
  },
  {
    id: "knee",
    label: "Knee",
    localizerSets: [
      {
        id: "default",
        label: "Knee Default",
        views: localizerViews("knee", "default")
      }
    ],
    protocols: KNEE_PROTOCOLS,
    volumeUrl: "/volumes/knee/knee_t2.nii.gz"
  }
];

const protocolConfigErrors = CASES.flatMap((caseConfig) =>
  caseConfig.protocols.flatMap((protocol) =>
    validateProtocolConfig(protocol).map((error) => `${caseConfig.id}/${protocol.id}: ${error}`)
  )
);

if (protocolConfigErrors.length > 0) {
  throw new Error(`Invalid planner protocol configuration:\n${protocolConfigErrors.join("\n")}`);
}

export const CASE_MAP = Object.fromEntries(CASES.map((entry) => [entry.id, entry])) as Record<
  CaseId,
  CaseConfig
>;
