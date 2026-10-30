import {
  CaseId,
  PlannerBox,
  PlannerParams,
  PlannerScore,
  ProtocolComponentWeights,
  ProtocolConfig,
  ProtocolPassGates,
  ProtocolTarget,
  ScoreFinding
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

const hasParam = (params: PlannerParams, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(params, key) && Number.isFinite(Number(params[key]));

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

const buildFeedback = (score: SingleTargetScore): string[] => {
  const issues: Array<{ score: number; text: string }> = [
    { score: score.componentScores.position, text: "Re-center the prescription box on target anatomy." },
    { score: score.componentScores.coverage, text: "Adjust coverage dimensions to match target anatomy span." },
    { score: score.componentScores.angulation, text: "Correct slice angulation using anatomical landmarks." },
    { score: score.componentScores.parameters, text: "Tune protocol parameters closer to target values." }
  ];

  const paramEntries = Object.entries(score.rawErrors.perParamRelative)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => ({ score: 1 - clamp(score.rawErrors.perParamRelative[key], 0, 1), text: `Refine parameter ${key}.` }));

  return [...issues, ...paramEntries]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((entry) => entry.text);
};

const positionDirectionHint = (
  score: SingleTargetScore,
  box: { center: { x: number; y: number; z: number } }
): string => {
  const dx = score.target.center.x - box.center.x;
  const dy = score.target.center.y - box.center.y;
  const dz = score.target.center.z - box.center.z;
  const parts: string[] = [];
  // Scale from normalised coordinates to mm (FOV ≈ 250mm)
  const scale = 250;
  if (Math.abs(dx) > 0.01) {
    parts.push(`${Math.round(Math.abs(dx) * scale)}mm ${dx > 0 ? "right" : "left"}`);
  }
  if (Math.abs(dy) > 0.01) {
    parts.push(`${Math.round(Math.abs(dy) * scale)}mm ${dy > 0 ? "anterior" : "posterior"}`);
  }
  if (Math.abs(dz) > 0.01) {
    parts.push(`${Math.round(Math.abs(dz) * scale)}mm ${dz > 0 ? "superior" : "inferior"}`);
  }
  return parts.length > 0 ? `Move box ${parts.join(", ")}.` : "Move the planning box closer to the anatomical center.";
};

const coverageHint = (score: SingleTargetScore): string => {
  const tx = Math.round(score.target.size.x * 250);
  const ty = Math.round(score.target.size.y * 250);
  const tz = Math.round(score.target.size.z * 250);
  return `Increase FOV to ${tx}\u00D7${ty}\u00D7${tz}mm.`;
};

const angulationHint = (
  score: SingleTargetScore,
  box: { rotation: { rx: number; ry: number; rz: number } }
): string => {
  const drx = angleDiff(box.rotation.rx, score.target.rotation.rx);
  const dry = angleDiff(box.rotation.ry, score.target.rotation.ry);
  const drz = angleDiff(box.rotation.rz, score.target.rotation.rz);
  // Use signed difference wrapped to shortest path for direction
  const wrapSigned = (d: number) => { let r = d % 360; if (r > 180) r -= 360; if (r <= -180) r += 360; return r; };
  const sRx = wrapSigned(score.target.rotation.rx - box.rotation.rx);
  const sRy = wrapSigned(score.target.rotation.ry - box.rotation.ry);
  const sRz = wrapSigned(score.target.rotation.rz - box.rotation.rz);
  const parts: string[] = [];
  if (drx > 1) {
    const dir = sRx > 0 ? "anteriorly" : "posteriorly";
    parts.push(`${Math.round(drx)}\u00B0 ${dir} (Rx)`);
  }
  if (dry > 1) {
    const dir = sRy > 0 ? "rightward" : "leftward";
    parts.push(`${Math.round(dry)}\u00B0 ${dir} (Ry)`);
  }
  if (drz > 1) {
    const dir = sRz > 0 ? "clockwise" : "counter-clockwise";
    parts.push(`${Math.round(drz)}\u00B0 ${dir} (Rz)`);
  }
  return parts.length > 0 ? `Rotate slices ${parts.join(", ")}.` : "Rotate slices to align with the anatomical landmark.";
};

const buildFindings = (
  protocol: ProtocolConfig,
  score: SingleTargetScore,
  pass: boolean,
  box?: PlannerBox,
  params?: PlannerParams
): ScoreFinding[] => {
  const findings: ScoreFinding[] = [];
  const hint = protocol.teaching?.planningHint;

  if (params && hasParam(params, "TR") && hasParam(params, "TE") && Number(params.TR) < Number(params.TE)) {
    findings.push({
      code: "timing_invalid_tr_te",
      severity: "error",
      title: "Invalid Timing",
      message: "TE cannot be greater than TR for this sequence.",
      suggestion: "Increase TR or reduce TE so the echo occurs within the repetition time.",
      relatedParameter: "TE"
    });
  }

  if (params && hasParam(params, "TR") && hasParam(params, "TI") && Number(params.TI) >= Number(params.TR)) {
    findings.push({
      code: "timing_invalid_ti",
      severity: "error",
      title: "Invalid Inversion Time",
      message: "TI must be shorter than TR for inversion-recovery timing.",
      suggestion: "Set TI below TR before scoring FLAIR or other inversion-recovery sequences.",
      relatedParameter: "TI"
    });
  }

  if (score.componentScores.position < 0.8) {
    const suggestion = box
      ? (hint ?? positionDirectionHint(score, box))
      : (hint ?? "Move the planning box closer to the anatomical center.");
    findings.push({
      code: "position_off",
      severity: "error",
      title: "Wrong Position",
      message: "Slices are not centered on target anatomy.",
      suggestion
    });
  }

  if (score.componentScores.coverage < 0.8) {
    findings.push({
      code: "fov_too_small",
      severity: "error",
      title: "FOV Too Small",
      message: "Anatomy is not fully covered by the planning volume.",
      suggestion: coverageHint(score)
    });
  }

  if (score.componentScores.angulation < 0.8) {
    findings.push({
      code: "angle_wrong",
      severity: "error",
      title: "Slice Angle Wrong",
      message: "Slices are not aligned to the expected anatomical plane.",
      suggestion: box ? angulationHint(score, box) : "Rotate slices to align with the anatomical landmark."
    });
  }

  const paramEntries = Object.entries(score.rawErrors.perParamRelative)
    .filter(([, err]) => err > 0.12)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  for (const [key, err] of paramEntries) {
    const highlight = protocol.teaching?.parameterHighlights?.find((h) => h.key === key);
    findings.push({
      code: `param_mismatch_${key.toLowerCase()}`,
      severity: "warning",
      title: `Parameter ${key} Off`,
      message: `${key} is ${Math.round(err * 100)}% away from target value.`,
      suggestion: highlight?.explanation,
      relatedParameter: key
    });
  }

  // Midline / symmetry checks — mutually exclusive (a protocol is either sagittal or axial oriented)
  if (box) {
    const labelLower = protocol.label.toLowerCase();
    const isSagittal = /\bsag/i.test(labelLower);
    const isAxial = !isSagittal && /\bax/i.test(labelLower);

    if (isSagittal) {
      const offMidline = Math.abs(box.center.x);
      if (offMidline > 0.04) {
        const mmOff = Math.round(offMidline * 250);
        findings.push({
          code: "midline_off",
          severity: offMidline > 0.1 ? "error" : "warning",
          title: "Midline Alignment",
          message: `Box center is ${mmOff}mm off midline.`,
          suggestion: `Shift box ${box.center.x > 0 ? "left" : "right"} to align with the interhemispheric fissure.`
        });
      }
    } else if (isAxial) {
      const asymmetry = Math.abs(box.center.x);
      if (asymmetry > 0.03) {
        const mmOff = Math.round(asymmetry * 250);
        findings.push({
          code: "symmetry_off",
          severity: asymmetry > 0.08 ? "error" : "warning",
          title: "Left-Right Symmetry",
          message: `Coverage is asymmetric: center offset ${mmOff}mm from midline.`,
          suggestion: `Center the box to ensure equal left-right brain coverage.`
        });
      }
    }
  }

  if (findings.length === 0) {
    findings.push({
      code: "planning_ready",
      severity: "info",
      title: "Planning Acceptable",
      message: pass
        ? "Planning meets all requirements."
        : "Planning is close but does not pass all gates."
    });
  }

  return findings.slice(0, 6);
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
    best.componentScores.angulation >= gates.angulationMin &&
    !(hasParam(params, "TR") && hasParam(params, "TE") && Number(params.TR) < Number(params.TE)) &&
    !(hasParam(params, "TR") && hasParam(params, "TI") && Number(params.TI) >= Number(params.TR));

  const findings = buildFindings(protocol, best, pass, box, params);

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
    feedback: buildFeedback(best),
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
