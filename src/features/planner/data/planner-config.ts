import { BRAIN_PROTOCOLS } from "@/features/planner/data/protocols/brain";
import { CSPINE_PROTOCOLS } from "@/features/planner/data/protocols/cspine";
import { TSPINE_PROTOCOLS } from "@/features/planner/data/protocols/tspine";
import { LSPINE_PROTOCOLS } from "@/features/planner/data/protocols/lspine";
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
    protocols: BRAIN_PROTOCOLS
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
    protocols: CSPINE_PROTOCOLS
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
    protocols: TSPINE_PROTOCOLS
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
    protocols: LSPINE_PROTOCOLS
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
