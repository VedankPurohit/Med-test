import {
  CaseId,
  PlannerBox,
  PlannerParams,
  PlannerScore,
  ProtocolComponentWeights,
  ProtocolConfig,
  ProtocolPassGates,
  ProtocolTarget
} from "@/features/planner/types/planner";
import { angleDiff, clamp } from "@/features/planner/lib/geometry";

const DEFAULT_COMPONENT_WEIGHTS: ProtocolComponentWeights = {
  position: 0.4,
  coverage: 0.25,
  angulation: 0.2,
  parameters: 0.15
};

const DEFAULT_PASS_GATES: ProtocolPassGates = {
  finalPercent: 75,
  positionMin: 0.55,
  coverageMin: 0.55,
  angulationMin: 0.45
};

type SingleTargetScore = {
  target: ProtocolTarget;
  componentScores: {
    position: number;
    coverage: number;
    angulation: number;
    parameters: number;
  };
  finalScore: number;
  rawErrors: {
    center: number;
    size: number;
    rotationDegreesMean: number;
    paramRelativeMean: number;
    perParamRelative: Record<string, number>;
  };
};

type ScoreFinding = PlannerScore["findings"][number];

const relativeDiff = (a: number, b: number): number => Math.abs(a - b) / Math.max(Math.abs(b), 1);
const scoreFromError = (error: number, tolerance: number): number => clamp(1 - error / tolerance, 0, 1);
const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const finiteOr = (value: number | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeComponentWeights = (protocol: ProtocolConfig): ProtocolComponentWeights => {
  const incoming = protocol.scoringProfile?.componentWeights;
  const weights: ProtocolComponentWeights = {
    position: finiteOr(incoming?.position, DEFAULT_COMPONENT_WEIGHTS.position),
    coverage: finiteOr(incoming?.coverage, DEFAULT_COMPONENT_WEIGHTS.coverage),
    angulation: finiteOr(incoming?.angulation, DEFAULT_COMPONENT_WEIGHTS.angulation),
    parameters: finiteOr(incoming?.parameters, DEFAULT_COMPONENT_WEIGHTS.parameters)
  };

  const total = weights.position + weights.coverage + weights.angulation + weights.parameters;
  if (total <= 0) {
    return DEFAULT_COMPONENT_WEIGHTS;
  }

  return {
    position: weights.position / total,
    coverage: weights.coverage / total,
    angulation: weights.angulation / total,
    parameters: weights.parameters / total
  };
};

const normalizePassGates = (protocol: ProtocolConfig): ProtocolPassGates => {
  const incoming = protocol.scoringProfile?.passGates;
  return {
    finalPercent: Math.round(finiteOr(incoming?.finalPercent, DEFAULT_PASS_GATES.finalPercent)),
    positionMin: finiteOr(incoming?.positionMin, DEFAULT_PASS_GATES.positionMin),
    coverageMin: finiteOr(incoming?.coverageMin, DEFAULT_PASS_GATES.coverageMin),
    angulationMin: finiteOr(incoming?.angulationMin, DEFAULT_PASS_GATES.angulationMin)
  };
};

const scoreAgainstTarget = (
  protocol: ProtocolConfig,
  box: PlannerBox,
  params: PlannerParams,
  target: ProtocolTarget
): SingleTargetScore => {
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

  const paramErrors: Record<string, number> = {};
  let weightedErrorSum = 0;
  let totalParamWeight = 0;

  for (const spec of protocol.parameterSpecs) {
    const key = String(spec.key);
    const attempt = finiteOr(params[key], 0);
    const expected = finiteOr(target.params[key], 0);
    const error = relativeDiff(attempt, expected);
    const weight = Math.max(0, finiteOr(spec.weight, 1));

    paramErrors[key] = error;
    weightedErrorSum += error * weight;
    totalParamWeight += weight;
  }

  if (totalParamWeight === 0) {
    for (const key of Object.keys(target.params)) {
      const attempt = finiteOr(params[key], 0);
      const expected = finiteOr(target.params[key], 0);
      const error = relativeDiff(attempt, expected);
      paramErrors[key] = error;
      weightedErrorSum += error;
      totalParamWeight += 1;
    }
  }

  const paramErr = totalParamWeight > 0 ? weightedErrorSum / totalParamWeight : 0;

  const componentScores = {
    position: scoreFromError(centerErr, protocol.tolerances.center),
    coverage: scoreFromError(sizeErr, protocol.tolerances.size),
    angulation: scoreFromError(rotationErr, protocol.tolerances.rotation),
    parameters: scoreFromError(paramErr, protocol.tolerances.param)
  };

  const weights = normalizeComponentWeights(protocol);
  const finalScore =
    componentScores.position * weights.position +
    componentScores.coverage * weights.coverage +
    componentScores.angulation * weights.angulation +
    componentScores.parameters * weights.parameters;

  return {
    target,
    componentScores,
    finalScore,
    rawErrors: {
      center: round(centerErr, 4),
      size: round(sizeErr, 4),
      rotationDegreesMean: round(rotationErr, 2),
      paramRelativeMean: round(paramErr, 4),
      perParamRelative: Object.fromEntries(
        Object.entries(paramErrors).map(([key, value]) => [key, round(value, 4)])
      )
    }
  };
};

const formatParamTarget = (value: number, unit: string | undefined): string =>
  unit ? `${value} ${unit}` : `${value}`;

const buildFindings = (protocol: ProtocolConfig, score: SingleTargetScore): ScoreFinding[] => {
  const findings: ScoreFinding[] = [];

  if (score.componentScores.position < 0.8) {
    findings.push({
      code: "coverage_off_center",
      severity: "error",
      title: "Off-center planning box",
      message: "The prescription box is not centered on the intended brain anatomy.",
      suggestion:
        protocol.teaching?.planningHint ??
        "Move the box closer to brain midline and scanner isocenter before rescoring."
    });
  }

  if (score.componentScores.coverage < 0.8) {
    findings.push({
      code: "coverage_too_small",
      severity: "error",
      title: "Coverage mismatch",
      message: "Current FOV or slice coverage does not span the full target anatomy.",
      suggestion: "Increase coverage and confirm vertex-to-posterior-fossa coverage without drifting into the neck."
    });
  }

  if (score.componentScores.angulation < 0.8) {
    findings.push({
      code: "angle_out_of_tolerance",
      severity: "error",
      title: "Angulation out of tolerance",
      message: "Slice angulation is not aligned with the expected brain reference plane.",
      suggestion:
        protocol.teaching?.planningHint ??
        "Rotate the slab to match the sequence-specific anatomical landmark."
    });
  }

  const paramFindings = Object.entries(score.rawErrors.perParamRelative)
    .filter(([, error]) => error > 0.12)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => {
      const spec = protocol.parameterSpecs.find((entry) => String(entry.key) === key);
      const targetValue = score.target.params[key];
      return {
        code: "parameter_value_mismatch",
        severity: "warning" as const,
        title: `${spec?.label ?? key} needs adjustment`,
        message: `${spec?.label ?? key} is away from the sequence target.`,
        suggestion:
          targetValue !== undefined
            ? `Aim for ${formatParamTarget(targetValue, spec?.unit)} for this sequence.`
            : "Refine the sequence parameter closer to the protocol target.",
        relatedParameter: key
      };
    });

  findings.push(...paramFindings);

  if (findings.length === 0) {
    findings.push({
      code: "planning_ready",
      severity: "warning",
      title: "Planning ready",
      message: "Planning and parameters are within the current training tolerances.",
      suggestion: "Accept this sequence and continue to the simulated scan."
    });
  }

  return findings.slice(0, 4);
};

const buildFeedback = (protocol: ProtocolConfig, findings: ScoreFinding[], passed: boolean): string[] => {
  if (passed) {
    return [
      "Planning accepted for this sequence.",
      protocol.teaching?.purpose ?? "Planning is within the current training tolerances.",
      "Run the sequence or continue to the next guided step."
    ];
  }

  return findings.slice(0, 3).map((entry) => entry.message);
};

export const computeScore = (
  protocol: ProtocolConfig,
  box: PlannerBox,
  params: PlannerParams,
  calibratedTargetUsed: boolean,
  caseId: CaseId
): PlannerScore => {
  const candidates = [protocol.target, ...(protocol.acceptedTargets ?? [])];

  const candidateScores = candidates.map((candidate) => scoreAgainstTarget(protocol, box, params, candidate));
  const bestIndex = candidateScores.reduce((best, current, index, all) => {
    if (all[best].finalScore >= current.finalScore) {
      return best;
    }
    return index;
  }, 0);

  const best = candidateScores[bestIndex];
  const gates = normalizePassGates(protocol);
  const finalPct = Math.round(best.finalScore * 100);
  const pass =
    finalPct >= gates.finalPercent &&
    best.componentScores.position >= gates.positionMin &&
    best.componentScores.coverage >= gates.coverageMin &&
    best.componentScores.angulation >= gates.angulationMin;
  const findings = buildFindings(protocol, best);

  return {
    scoreSchemaVersion: 2,
    timestamp: new Date().toISOString(),
    caseId,
    protocolId: protocol.id,
    calibratedTargetUsed,
    matchedTargetIndex: bestIndex,
    matchedTargetKind: bestIndex === 0 ? "primary" : "accepted",
    finalScorePercent: finalPct,
    pass,
    feedback: buildFeedback(protocol, findings, pass),
    findings,
    componentScores: {
      positionPercent: Math.round(best.componentScores.position * 100),
      coveragePercent: Math.round(best.componentScores.coverage * 100),
      angulationPercent: Math.round(best.componentScores.angulation * 100),
      parametersPercent: Math.round(best.componentScores.parameters * 100)
    },
    rawErrors: best.rawErrors,
    target: deepClone(best.target),
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

  const paramKeys = new Set([
    ...Object.keys(base.target.params),
    ...Object.keys(override.params ?? {}),
    ...base.parameterSpecs.map((entry) => String(entry.key))
  ]);

  const mergedParams: Record<string, number> = {};
  for (const key of paramKeys) {
    mergedParams[key] = finiteOr(override.params?.[key], finiteOr(base.target.params[key], 0));
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
    params: mergedParams
  };

  return {
    ...base,
    target
  };
};
