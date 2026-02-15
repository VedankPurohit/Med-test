import {
  PlannerBox,
  PlannerParams,
  PlannerScore,
  ProtocolConfig,
  ProtocolTarget
} from "@/features/planner/types/planner";
import { angleDiff, clamp } from "@/features/planner/lib/geometry";

const relativeDiff = (a: number, b: number): number => Math.abs(a - b) / Math.max(Math.abs(b), 1);
const scoreFromError = (error: number, tolerance: number): number => clamp(1 - error / tolerance, 0, 1);
const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const computeScore = (
  protocol: ProtocolConfig,
  box: PlannerBox,
  params: PlannerParams,
  calibratedTargetUsed: boolean,
  caseId: "brain" | "spine"
): PlannerScore => {
  const target = protocol.target;

  const centerErr =
    (Math.abs(box.center.x - target.center.x) +
      Math.abs(box.center.y - target.center.y) +
      Math.abs(box.center.z - target.center.z)) /
    3;

  const sizeErr =
    (Math.abs(box.size.x - target.size.x) +
      Math.abs(box.size.y - target.size.y) +
      Math.abs(box.size.z - target.size.z)) /
    3;

  const rotationErr =
    (angleDiff(box.rotation.rx, target.rotation.rx) +
      angleDiff(box.rotation.ry, target.rotation.ry) +
      angleDiff(box.rotation.rz, target.rotation.rz)) /
    3;

  const paramErrs = {
    TR: relativeDiff(params.TR, target.params.TR),
    TE: relativeDiff(params.TE, target.params.TE),
    FOV: relativeDiff(params.FOV, target.params.FOV),
    Slices: relativeDiff(params.Slices, target.params.Slices),
    SliceThickness: relativeDiff(params.SliceThickness, target.params.SliceThickness),
    SliceGap: relativeDiff(params.SliceGap, target.params.SliceGap)
  };

  const paramErr =
    Object.values(paramErrs).reduce((sum, value) => sum + value, 0) / Object.values(paramErrs).length;

  const centerScore = scoreFromError(centerErr, protocol.tolerances.center);
  const sizeScore = scoreFromError(sizeErr, protocol.tolerances.size);
  const rotationScore = scoreFromError(rotationErr, protocol.tolerances.rotation);
  const paramScore = scoreFromError(paramErr, protocol.tolerances.param);

  const finalScore = centerScore * 0.4 + sizeScore * 0.25 + rotationScore * 0.2 + paramScore * 0.15;
  const finalPct = Math.round(finalScore * 100);

  const pass = finalPct >= 75 && centerScore > 0.55 && sizeScore > 0.55 && rotationScore > 0.45;

  return {
    timestamp: new Date().toISOString(),
    caseId,
    protocolId: protocol.id,
    calibratedTargetUsed,
    finalScorePercent: finalPct,
    pass,
    componentScores: {
      positionPercent: Math.round(centerScore * 100),
      coveragePercent: Math.round(sizeScore * 100),
      angulationPercent: Math.round(rotationScore * 100),
      parametersPercent: Math.round(paramScore * 100)
    },
    rawErrors: {
      center: round(centerErr, 4),
      size: round(sizeErr, 4),
      rotationDegreesMean: round(rotationErr, 2),
      paramRelativeMean: round(paramErr, 4),
      perParamRelative: Object.fromEntries(
        Object.entries(paramErrs).map(([key, value]) => [key, round(value, 4)])
      )
    },
    target: deepClone(target),
    attempt: {
      box: deepClone(box),
      params: deepClone(params)
    }
  };
};

export const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const withFallbackTarget = (base: ProtocolConfig, override: ProtocolTarget | undefined): ProtocolConfig => {
  if (!override) {
    return base;
  }

  const target = {
    center: {
      x: finiteOr(override.center?.x, base.target.center.x),
      y: finiteOr(override.center?.y, base.target.center.y),
      z: finiteOr(override.center?.z, base.target.center.z)
    },
    size: {
      x: finiteOr(override.size?.x, base.target.size.x),
      y: finiteOr(override.size?.y, base.target.size.y),
      z: finiteOr(override.size?.z, base.target.size.z)
    },
    rotation: {
      rx: finiteOr(override.rotation?.rx, base.target.rotation.rx),
      ry: finiteOr(override.rotation?.ry, base.target.rotation.ry),
      rz: finiteOr(override.rotation?.rz, base.target.rotation.rz)
    },
    params: {
      TR: finiteOr(override.params?.TR, base.target.params.TR),
      TE: finiteOr(override.params?.TE, base.target.params.TE),
      FOV: finiteOr(override.params?.FOV, base.target.params.FOV),
      Slices: finiteOr(override.params?.Slices, base.target.params.Slices),
      SliceThickness: finiteOr(
        override.params?.SliceThickness,
        base.target.params.SliceThickness
      ),
      SliceGap: finiteOr(override.params?.SliceGap, base.target.params.SliceGap)
    }
  };

  return {
    ...base,
    target
  };
};

const finiteOr = (value: number | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
