import { CASE_MAP } from "@/features/planner/data/planner-config";
import { computeScore, withFallbackTarget } from "@/features/planner/lib/scoring";
import {
  PlannerBox,
  PlannerParams,
  PlannerScore,
  PlannerScoreRequest,
  PlannerScoreResponse,
  ProtocolConfig,
  ProtocolTarget,
  Vector3
} from "@/features/planner/types/planner";

type ApiErrorCode =
  | "INVALID_PAYLOAD"
  | "UNKNOWN_CASE"
  | "UNKNOWN_PROTOCOL"
  | "INVALID_BOX"
  | "INVALID_PARAMS";

export type ScoreApiError = {
  code: ApiErrorCode;
  message: string;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isVector3 = (value: unknown): value is Vector3 =>
  typeof value === "object" &&
  value !== null &&
  isFiniteNumber((value as Vector3).x) &&
  isFiniteNumber((value as Vector3).y) &&
  isFiniteNumber((value as Vector3).z);

const isPlannerBox = (value: unknown): value is PlannerBox =>
  typeof value === "object" &&
  value !== null &&
  isVector3((value as PlannerBox).center) &&
  isVector3((value as PlannerBox).size) &&
  typeof (value as PlannerBox).rotation === "object" &&
  (value as PlannerBox).rotation !== null &&
  isFiniteNumber((value as PlannerBox).rotation.rx) &&
  isFiniteNumber((value as PlannerBox).rotation.ry) &&
  isFiniteNumber((value as PlannerBox).rotation.rz);

const isParamsRecord = (value: unknown): value is PlannerParams =>
  typeof value === "object" &&
  value !== null &&
  Object.values(value as Record<string, unknown>).every((entry) => isFiniteNumber(entry));

const isProtocolTarget = (value: unknown): value is ProtocolTarget =>
  typeof value === "object" &&
  value !== null &&
  isVector3((value as ProtocolTarget).center) &&
  isVector3((value as ProtocolTarget).size) &&
  typeof (value as ProtocolTarget).rotation === "object" &&
  (value as ProtocolTarget).rotation !== null &&
  isFiniteNumber((value as ProtocolTarget).rotation.rx) &&
  isFiniteNumber((value as ProtocolTarget).rotation.ry) &&
  isFiniteNumber((value as ProtocolTarget).rotation.rz) &&
  isParamsRecord((value as ProtocolTarget).params);

export const parsePlannerScorePayload = (
  payload: unknown
): { ok: true; value: PlannerScoreRequest } | { ok: false; error: ScoreApiError } => {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      error: { code: "INVALID_PAYLOAD", message: "Payload must be an object." }
    };
  }

  const data = payload as Partial<PlannerScoreRequest>;
  if (typeof data.caseId !== "string" || typeof data.protocolId !== "string") {
    return {
      ok: false,
      error: { code: "INVALID_PAYLOAD", message: "Missing caseId or protocolId." }
    };
  }

  if (!isPlannerBox(data.box)) {
    return {
      ok: false,
      error: { code: "INVALID_BOX", message: "Invalid planner box payload." }
    };
  }

  if (!isParamsRecord(data.params)) {
    return {
      ok: false,
      error: { code: "INVALID_PARAMS", message: "Invalid planner parameters payload." }
    };
  }

  if (data.calibrationTarget !== undefined && !isProtocolTarget(data.calibrationTarget)) {
    return {
      ok: false,
      error: { code: "INVALID_PAYLOAD", message: "Invalid calibration target payload." }
    };
  }

  return {
    ok: true,
    value: {
      caseId: data.caseId,
      protocolId: data.protocolId,
      box: data.box,
      params: data.params,
      calibrationTarget: data.calibrationTarget,
      instructorMode: Boolean(data.instructorMode)
    }
  };
};

const findProtocol = (caseId: string, protocolId: string): ProtocolConfig | null => {
  if (!(caseId in CASE_MAP)) {
    return null;
  }
  const caseConfig = CASE_MAP[caseId as keyof typeof CASE_MAP];
  return caseConfig.protocols.find((protocol) => protocol.id === protocolId) ?? null;
};

export const scorePlannerRequest = (
  request: PlannerScoreRequest
): { ok: true; data: PlannerScoreResponse } | { ok: false; error: ScoreApiError } => {
  const caseConfig = CASE_MAP[request.caseId];
  if (!caseConfig) {
    return {
      ok: false,
      error: { code: "UNKNOWN_CASE", message: `Unknown case '${request.caseId}'.` }
    };
  }

  const protocol = findProtocol(request.caseId, request.protocolId);
  if (!protocol) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_PROTOCOL",
        message: `Unknown protocol '${request.protocolId}' for case '${request.caseId}'.`
      }
    };
  }

  const protocolWithCalibration = request.calibrationTarget
    ? withFallbackTarget(protocol, request.calibrationTarget)
    : protocol;

  const score: PlannerScore = computeScore(
    protocolWithCalibration,
    request.box,
    request.params,
    Boolean(request.calibrationTarget),
    request.caseId
  );

  return {
    ok: true,
    data: {
      score,
      // Reveal policy is server-owned: reveal after score; instructors can always reveal.
      revealTarget: true,
      revealReason: request.instructorMode ? "instructor" : "scored"
    }
  };
};

