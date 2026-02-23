import { BoxRenderMode, ParameterSet, PlannerBox, ProtocolParameterSpec, ViewId } from "@/features/planner/types/planner";

export const CONTRIBUTION_ANATOMY_TYPES = [
  "brain",
  "cspine",
  "tspine",
  "lspine",
  "spine",
  "leg",
  "knee",
  "hip",
  "other"
] as const;

export type ContributionAnatomyType = (typeof CONTRIBUTION_ANATOMY_TYPES)[number];
export type ContributionProtocolOrigin = "existing" | "custom";

export type ContributionAnatomy = {
  primaryType: ContributionAnatomyType;
  customTypeText?: string;
};

export type ContributionImageInput = {
  // Keep both forms: dataUrl powers immediate canvas preview, bytes power ZIP/binary export.
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  bytes: Uint8Array;
};

export type ContributionProtocolEntry = {
  id: string;
  label: string;
  origin: ContributionProtocolOrigin;
  sourcePlannerCaseId?: string;
  sourcePlannerProtocolId?: string;
  parameterSpecs: ProtocolParameterSpec[];
  parameterValues: ParameterSet;
  notes?: string;
};

export type ContributionPlacement = {
  box: PlannerBox;
  params: ParameterSet;
  boxRenderMode: BoxRenderMode;
};

export type ContributionPlacementMap = Record<string, ContributionPlacement | null>;

export type ContributionDraft = {
  createdAt: string;
  anatomy: ContributionAnatomy;
  views: Record<ViewId, ContributionImageInput | null>;
  protocols: ContributionProtocolEntry[];
  placements: ContributionPlacementMap;
};

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  code: string;
  message: string;
  field: string;
  severity: ValidationSeverity;
};

export type ContributionManifestProtocol = {
  id: string;
  label: string;
  origin: ContributionProtocolOrigin;
  sourcePlannerCaseId?: string;
  sourcePlannerProtocolId?: string;
  notes?: string;
  parameterSpecs: ProtocolParameterSpec[];
  parameterValues: ParameterSet;
  placementZipPath: string;
  placement: ContributionPlacement;
};

export type ContributionManifestView = {
  viewId: ViewId;
  zipPath: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type ContributionManifestV1 = {
  schemaVersion: 1;
  createdAt: string;
  sourceAppVersion: string;
  anatomy: ContributionAnatomy;
  views: Record<ViewId, ContributionManifestView>;
  protocols: ContributionManifestProtocol[];
  exportMeta: {
    protocolCount: number;
    viewCount: number;
  };
};

export type ContributionExportPayload = {
  createdAt: string;
  sourceAppVersion: string;
  phiAttestation: boolean;
  anatomy: ContributionAnatomy;
  protocols: ContributionProtocolEntry[];
  placements: ContributionPlacementMap;
};

export type ContributionExportErrorCode =
  | "BAD_MULTIPART"
  | "MISSING_PAYLOAD"
  | "INVALID_PAYLOAD"
  | "MISSING_VIEW_FILE"
  | "INVALID_VIEW_FILE"
  | "VIEW_FILE_TOO_LARGE"
  | "TOTAL_FILE_SIZE_TOO_LARGE"
  | "PHI_ATTESTATION_REQUIRED"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "EXPORT_FAILED";

export type ContributionExportError = {
  code: ContributionExportErrorCode;
  message: string;
  details?: unknown;
};

export const DEFAULT_BOX: PlannerBox = {
  center: { x: 0, y: 0, z: 0 },
  size: { x: 0.6, y: 0.6, z: 0.6 },
  rotation: { rx: 0, ry: 0, rz: 0 }
};

export const emptyViews = (): Record<ViewId, ContributionImageInput | null> => ({
  axial: null,
  sagittal: null,
  coronal: null
});

export const emptyDraft = (): ContributionDraft => ({
  createdAt: new Date().toISOString(),
  anatomy: { primaryType: "brain" },
  views: emptyViews(),
  protocols: [],
  placements: {}
});
