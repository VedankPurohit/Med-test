export type ViewId = "axial" | "sagittal" | "coronal";
export type CaseId = "brain" | "spine";

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

export type PlannerParams = {
  TR: number;
  TE: number;
  FOV: number;
  Slices: number;
  SliceThickness: number;
  SliceGap: number;
};

export type ProtocolTarget = {
  center: Vector3;
  size: Vector3;
  rotation: Rotation3;
  params: PlannerParams;
};

export type ProtocolTolerance = {
  center: number;
  size: number;
  rotation: number;
  param: number;
};

export type ProtocolConfig = {
  id: string;
  label: string;
  target: ProtocolTarget;
  initial: ProtocolTarget;
  tolerances: ProtocolTolerance;
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
  timestamp: string;
  caseId: CaseId;
  protocolId: string;
  calibratedTargetUsed: boolean;
  finalScorePercent: number;
  pass: boolean;
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
    params: PlannerParams;
  };
};

export type UploadMap = Record<CaseId, Record<ViewId, string | null>>;
export type CalibrationMap = Record<string, ProtocolTarget>;

export type Point2 = { x: number; y: number };
