import {
  PlannerParams,
  ProtocolConfig,
  ProtocolParameterSpec,
  ProtocolTarget,
  ProtocolTolerance,
  STANDARD_PARAMETER_KEYS,
  EXTENDED_PARAMETER_KEYS
} from "@/features/planner/types/planner";

export const DEFAULT_PARAMETER_SPECS: ProtocolParameterSpec[] = [
  { key: "TR", label: "TR", unit: "ms", min: 0, step: 1, weight: 1 },
  { key: "TE", label: "TE", unit: "ms", min: 0, step: 1, weight: 1 },
  { key: "FOV", label: "FOV", unit: "mm", min: 0, step: 1, weight: 1 },
  { key: "Slices", label: "Slices", min: 1, step: 1, integer: true, weight: 1 },
  { key: "SliceThickness", label: "Slice Thickness", unit: "mm", min: 0, step: 0.1, weight: 1 },
  { key: "SliceGap", label: "Slice Gap", unit: "mm", min: 0, step: 0.1, weight: 1 },
  // Slice orientation: 0=LR (x), 1=AP (y), 2=HF (z). weight 0 keeps it out
  // of scoring (orientation is a structural choice, not a graded value).
  { key: "SliceOrientation", label: "Slice Orientation", min: 0, max: 2, step: 1, integer: true, weight: 0 }
];

export const EXTENDED_PARAMETER_SPECS: ProtocolParameterSpec[] = [
  ...DEFAULT_PARAMETER_SPECS,
  { key: "FlipAngle", label: "Flip Angle", unit: "deg", min: 1, max: 180, step: 1, integer: true, weight: 0.5 },
  { key: "MatrixFreq", label: "Matrix Freq", min: 64, max: 1024, step: 64, integer: true, weight: 0.3 },
  { key: "MatrixPhase", label: "Matrix Phase", min: 64, max: 1024, step: 32, integer: true, weight: 0.3 },
  { key: "NEX", label: "NEX", min: 1, max: 8, step: 1, integer: true, weight: 0.4 },
  { key: "Bandwidth", label: "Bandwidth", unit: "Hz/px", min: 50, max: 2500, step: 10, weight: 0.3 },
  { key: "ETL", label: "ETL", min: 1, max: 256, step: 1, integer: true, weight: 0.3 },
  { key: "PhaseEncDir", label: "Phase Enc Dir", min: 0, max: 5, step: 1, integer: true, weight: 0.2 },
  { key: "FatSuppression", label: "Fat Suppression", min: 0, max: 4, step: 1, integer: true, weight: 0.3 }
];

/** TI parameter spec for inversion-recovery sequences (FLAIR, STIR) */
export const TI_PARAMETER_SPEC: ProtocolParameterSpec =
  { key: "TI", label: "TI", unit: "ms", min: 0, step: 1, weight: 1 };

/** Extended specs + TI for inversion-recovery protocols */
export const IR_PARAMETER_SPECS: ProtocolParameterSpec[] = [
  ...EXTENDED_PARAMETER_SPECS,
  TI_PARAMETER_SPEC
];

export const makeParams = (
  TR: number,
  TE: number,
  FOV: number,
  Slices: number,
  SliceThickness: number,
  SliceGap: number
): PlannerParams => ({ TR, TE, FOV, Slices, SliceThickness, SliceGap });

export const makeFullParams = (
  TR: number, TE: number, FOV: number, Slices: number,
  SliceThickness: number, SliceGap: number,
  FlipAngle: number, MatrixFreq: number, MatrixPhase: number,
  NEX: number, Bandwidth: number, ETL: number,
  PhaseEncDir: number, FatSuppression: number
): PlannerParams => ({
  TR, TE, FOV, Slices, SliceThickness, SliceGap,
  FlipAngle, MatrixFreq, MatrixPhase, NEX, Bandwidth, ETL,
  PhaseEncDir, FatSuppression
});

export const pickParams = (
  params: PlannerParams,
  specs: ProtocolParameterSpec[]
): PlannerParams => {
  const selected: PlannerParams = {};
  for (const spec of specs) {
    const key = String(spec.key);
    if (params[key] !== undefined) {
      selected[key] = params[key];
    }
  }
  return selected;
};

/** Compute scan time in seconds: (TR * PhaseSteps * NEX) / (ETL * 1000) */
export const computeScanTime = (params: PlannerParams): number => {
  const tr = params.TR || 1;
  const phase = params.MatrixPhase || 256;
  const nex = params.NEX || 1;
  const etl = params.ETL || 1;
  return (tr * phase * nex) / (etl * 1000);
};

export const makeTarget = (
  center: ProtocolTarget["center"],
  size: ProtocolTarget["size"],
  rotation: ProtocolTarget["rotation"],
  params: PlannerParams
): ProtocolTarget => ({ center, size, rotation, params });

const normalizeParameterSpecs = (
  target: ProtocolTarget,
  parameterSpecs?: ProtocolParameterSpec[]
): ProtocolParameterSpec[] => {
  const specs = parameterSpecs && parameterSpecs.length > 0 ? parameterSpecs : DEFAULT_PARAMETER_SPECS;
  const indexed = new Map(specs.map((spec) => [spec.key, spec]));

  for (const key of Object.keys(target.params)) {
    if (!indexed.has(key)) {
      indexed.set(key, {
        key,
        label: key,
        min: 0,
        step: 1,
        weight: 1
      });
    }
  }

  return [...indexed.values()];
};

export const makeProtocol = (
  input: Omit<ProtocolConfig, "tolerances" | "parameterSpecs"> & {
    tolerances?: ProtocolTolerance;
    parameterSpecs?: ProtocolParameterSpec[];
  }
): ProtocolConfig => ({
  ...input,
  tolerances: input.tolerances ?? { center: 0.22, size: 0.2, rotation: 16, param: 0.22 },
  parameterSpecs: normalizeParameterSpecs(input.target, input.parameterSpecs)
});

export const hasStandardParamKey = (value: string): boolean => {
  return (STANDARD_PARAMETER_KEYS as readonly string[]).includes(value);
};

export const hasExtendedParamKey = (value: string): boolean => {
  return (EXTENDED_PARAMETER_KEYS as readonly string[]).includes(value);
};
