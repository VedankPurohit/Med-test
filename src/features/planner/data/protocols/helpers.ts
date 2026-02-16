import {
  PlannerParams,
  ProtocolConfig,
  ProtocolParameterSpec,
  ProtocolTarget,
  ProtocolTolerance,
  STANDARD_PARAMETER_KEYS
} from "@/features/planner/types/planner";

export const DEFAULT_PARAMETER_SPECS: ProtocolParameterSpec[] = [
  { key: "TR", label: "TR", unit: "ms", min: 0, step: 1, weight: 1 },
  { key: "TE", label: "TE", unit: "ms", min: 0, step: 1, weight: 1 },
  { key: "FOV", label: "FOV", unit: "mm", min: 0, step: 1, weight: 1 },
  { key: "Slices", label: "Slices", min: 1, step: 1, integer: true, weight: 1 },
  { key: "SliceThickness", label: "Slice Thickness", unit: "mm", min: 0, step: 0.1, weight: 1 },
  { key: "SliceGap", label: "Slice Gap", unit: "mm", min: 0, step: 0.1, weight: 1 }
];

export const makeParams = (
  TR: number,
  TE: number,
  FOV: number,
  Slices: number,
  SliceThickness: number,
  SliceGap: number
): PlannerParams => ({ TR, TE, FOV, Slices, SliceThickness, SliceGap });

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
