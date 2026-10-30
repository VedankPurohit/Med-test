export type ViewId = "axial" | "sagittal" | "coronal";
export type CaseId = "brain" | "cspine" | "tspine" | "lspine";
export type BoxRenderMode = "flat2d" | "cube3d";

export const STANDARD_PARAMETER_KEYS = [
  "TR",
  "TE",
  "FOV",
  "Slices",
  "SliceThickness",
  "SliceGap"
] as const;

export type StandardParameterKey = (typeof STANDARD_PARAMETER_KEYS)[number];
export type ParameterKey = StandardParameterKey | (string & {});

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Rotation3 = {
  rx: number;
  ry: number;
  rz: number;
};

export type PlannerBox = {
  center: Vector3;
  size: Vector3;
  rotation: Rotation3;
};

export type ParameterSet = Record<string, number>;
export type PlannerParams = ParameterSet;

export type ProtocolTarget = {
  center: Vector3;
  size: Vector3;
  rotation: Rotation3;
  params: ParameterSet;
};

export type ProtocolTolerance = {
  center: number;
  size: number;
  rotation: number;
  param: number;
};

export type ProtocolParameterSpec = {
  key: ParameterKey;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  weight?: number;
};

export type ProtocolTeachingHighlight = {
  key: ParameterKey;
  explanation: string;
};

export type ProtocolTeachingContent = {
  purpose: string;
  planningHint: string;
  planningChecklist?: string[];
  parameterHighlights?: ProtocolTeachingHighlight[];
};

export type ProtocolComponentWeights = {
  position: number;
  coverage: number;
  angulation: number;
  parameters: number;
};

export type ProtocolPassGates = {
  finalPercent: number;
  positionMin: number;
  coverageMin: number;
  angulationMin: number;
};

export type ProtocolScoringProfile = {
  componentWeights?: Partial<ProtocolComponentWeights>;
  passGates?: Partial<ProtocolPassGates>;
};

export type ProtocolInteractionRules = {
  editableViews?: ViewId[];
  centerBounds?: { min: number; max: number };
  sizeBounds?: { min: number; max: number };
  rotationBounds?: { min: number; max: number };
};

export type ProtocolConfig = {
  id: string;
  label: string;
  target: ProtocolTarget;
  acceptedTargets?: ProtocolTarget[];
  initial: ProtocolTarget;
  tolerances: ProtocolTolerance;
  parameterSpecs: ProtocolParameterSpec[];
  workflowOrder?: number;
  scoringProfile?: ProtocolScoringProfile;
  interactionRules?: ProtocolInteractionRules;
  teaching?: ProtocolTeachingContent;
  clinicalNotes?: string[];
};

export type LocalizerSet = {
  id: string;
  label: string;
  views: Record<ViewId, string>;
};

export type CaseConfig = {
  id: CaseId;
  label: string;
  protocols: ProtocolConfig[];
  localizerSets: LocalizerSet[];
};

export type PlannerScore = {
  scoreSchemaVersion: 2;
  timestamp: string;
  caseId: CaseId;
  protocolId: string;
  calibratedTargetUsed: boolean;
  matchedTargetIndex: number;
  matchedTargetKind: "primary" | "accepted";
  finalScorePercent: number;
  pass: boolean;
  feedback: string[];
  findings: Array<{
    code: string;
    severity: "error" | "warning";
    title: string;
    message: string;
    suggestion?: string;
    relatedParameter?: string;
  }>;
  componentScores: {
    positionPercent: number;
    coveragePercent: number;
    angulationPercent: number;
    parametersPercent: number;
  };
  rawErrors: {
    center: number;
    size: number;
    rotationDegreesMean: number;
    paramRelativeMean: number;
    perParamRelative: Record<string, number>;
  };
  target: ProtocolTarget;
  attempt: {
    box: PlannerBox;
    params: ParameterSet;
  };
};

export type PlannerScoreRequest = {
  caseId: CaseId;
  protocolId: string;
  box: PlannerBox;
  params: ParameterSet;
  calibrationTarget?: ProtocolTarget;
  instructorMode?: boolean;
};

export type PlannerScoreResponse = {
  score: PlannerScore;
  revealTarget: boolean;
  revealReason: "scored" | "instructor";
};

export type UploadMap = Record<CaseId, Record<ViewId, string | null>>;
export type CalibrationMap = Record<string, ProtocolTarget>;

export type Point2 = { x: number; y: number };

export type HandleId =
  | { kind: "corner"; index: 0 | 1 | 2 | 3 }
  | { kind: "edge"; index: 0 | 1 | 2 | 3 }
  | { kind: "rotate" }
  | { kind: "move" };

export type ExpertRole = "radiologist" | "technologist";

export type ExpertAnnotation = {
  id: string;
  caseId: CaseId;
  protocolId: string;
  raterId: string;
  role: ExpertRole;
  createdAt: string;
  target: ProtocolTarget;
  note?: string;
};

export type ConsensusTarget = {
  method: "median";
  sourceAnnotationIds: string[];
  target: ProtocolTarget;
  tolerances: ProtocolTolerance;
};
