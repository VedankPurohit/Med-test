import { CASES } from "@/features/planner/data/planner-config";
import { ContributionProtocolEntry } from "@/features/contribution/types";

export type ExistingProtocolCatalogEntry = {
  key: string;
  caseId: string;
  caseLabel: string;
  protocolId: string;
  protocolLabel: string;
  protocol: ContributionProtocolEntry;
};

export const EXISTING_PROTOCOL_CATALOG: ExistingProtocolCatalogEntry[] = CASES.flatMap((caseConfig) =>
  caseConfig.protocols.map((protocol) => ({
    key: `${caseConfig.id}:${protocol.id}`,
    caseId: caseConfig.id,
    caseLabel: caseConfig.label,
    protocolId: protocol.id,
    protocolLabel: protocol.label,
    protocol: {
      id: protocol.id,
      label: protocol.label,
      origin: "existing" as const,
      sourcePlannerCaseId: caseConfig.id,
      sourcePlannerProtocolId: protocol.id,
      parameterSpecs: protocol.parameterSpecs,
      parameterValues: { ...protocol.initial.params },
      notes: protocol.clinicalNotes?.join(" ")
    }
  }))
);

export const cloneProtocolEntry = (entry: ContributionProtocolEntry): ContributionProtocolEntry => ({
  ...entry,
  parameterSpecs: entry.parameterSpecs.map((spec) => ({ ...spec })),
  parameterValues: { ...entry.parameterValues }
});
