import { ConsensusTarget, ExpertAnnotation, ProtocolTarget, ProtocolTolerance } from "@/features/planner/types/planner";

const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const spread = (values: number[]): number => {
  if (values.length <= 1) {
    return 0;
  }
  const med = median(values);
  const deviations = values.map((entry) => Math.abs(entry - med));
  return median(deviations);
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

type ConsensusOptions = {
  minTolerance?: ProtocolTolerance;
  maxTolerance?: ProtocolTolerance;
  spreadFactor?: number;
};

const DEFAULT_MIN_TOLERANCE: ProtocolTolerance = { center: 0.12, size: 0.1, rotation: 8, param: 0.1 };
const DEFAULT_MAX_TOLERANCE: ProtocolTolerance = { center: 0.35, size: 0.35, rotation: 25, param: 0.35 };

export const buildConsensusTarget = (
  annotations: ExpertAnnotation[],
  options: ConsensusOptions = {}
): ConsensusTarget => {
  if (annotations.length === 0) {
    throw new Error("Cannot build consensus target without annotations.");
  }

  const minTolerance = options.minTolerance ?? DEFAULT_MIN_TOLERANCE;
  const maxTolerance = options.maxTolerance ?? DEFAULT_MAX_TOLERANCE;
  const spreadFactor = options.spreadFactor ?? 2;

  const allParamKeys = new Set<string>();
  for (const annotation of annotations) {
    for (const key of Object.keys(annotation.target.params)) {
      allParamKeys.add(key);
    }
  }

  const target: ProtocolTarget = {
    center: {
      x: median(annotations.map((entry) => entry.target.center.x)),
      y: median(annotations.map((entry) => entry.target.center.y)),
      z: median(annotations.map((entry) => entry.target.center.z))
    },
    size: {
      x: median(annotations.map((entry) => entry.target.size.x)),
      y: median(annotations.map((entry) => entry.target.size.y)),
      z: median(annotations.map((entry) => entry.target.size.z))
    },
    rotation: {
      rx: median(annotations.map((entry) => entry.target.rotation.rx)),
      ry: median(annotations.map((entry) => entry.target.rotation.ry)),
      rz: median(annotations.map((entry) => entry.target.rotation.rz))
    },
    params: {}
  };

  for (const key of allParamKeys) {
    target.params[key] = median(
      annotations.map((entry) => {
        const value = entry.target.params[key];
        return Number.isFinite(value) ? value : 0;
      })
    );
  }

  const centerSpread =
    (spread(annotations.map((entry) => entry.target.center.x)) +
      spread(annotations.map((entry) => entry.target.center.y)) +
      spread(annotations.map((entry) => entry.target.center.z))) /
    3;

  const sizeSpread =
    (spread(annotations.map((entry) => entry.target.size.x)) +
      spread(annotations.map((entry) => entry.target.size.y)) +
      spread(annotations.map((entry) => entry.target.size.z))) /
    3;

  const rotationSpread =
    (spread(annotations.map((entry) => entry.target.rotation.rx)) +
      spread(annotations.map((entry) => entry.target.rotation.ry)) +
      spread(annotations.map((entry) => entry.target.rotation.rz))) /
    3;

  const paramSpreadValues: number[] = [];
  for (const key of allParamKeys) {
    paramSpreadValues.push(
      spread(
        annotations.map((entry) => {
          const value = entry.target.params[key];
          return Number.isFinite(value) ? value : 0;
        })
      )
    );
  }
  const paramSpread = median(paramSpreadValues);

  const tolerances: ProtocolTolerance = {
    center: clamp(centerSpread * spreadFactor, minTolerance.center, maxTolerance.center),
    size: clamp(sizeSpread * spreadFactor, minTolerance.size, maxTolerance.size),
    rotation: clamp(rotationSpread * spreadFactor, minTolerance.rotation, maxTolerance.rotation),
    param: clamp(paramSpread * spreadFactor, minTolerance.param, maxTolerance.param)
  };

  return {
    method: "median",
    sourceAnnotationIds: annotations.map((entry) => entry.id),
    target,
    tolerances
  };
};

