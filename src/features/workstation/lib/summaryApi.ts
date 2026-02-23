import {
  BuildSubmissionSummaryRequest,
  BuildSubmissionSummaryResponse,
  buildExamSubmissionSummary,
  haveVisitedAllSelectedProtocols
} from "@/features/workstation/lib/examSummary";
import { ProtocolListItem } from "@/features/workstation/types/workstation";
import { PlacementMap } from "@/features/planner/lib/protocolPlacements";

type SubmissionApiErrorCode = "INVALID_PAYLOAD";

export type SubmissionApiError = {
  code: SubmissionApiErrorCode;
  message: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isProtocolStatus = (value: unknown): value is ProtocolListItem["status"] =>
  value === "pending" || value === "active" || value === "completed" || value === "skipped";

const isProtocolListItem = (value: unknown): value is ProtocolListItem =>
  isRecord(value) &&
  typeof value.protocolId === "string" &&
  typeof value.label === "string" &&
  typeof value.shortName === "string" &&
  typeof value.orientation === "string" &&
  typeof value.region === "string" &&
  isProtocolStatus(value.status);

const isPlacementScore = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  return (
    isRecord(value) &&
    typeof value.protocolId === "string" &&
    typeof value.caseId === "string" &&
    typeof value.finalScorePercent === "number" &&
    typeof value.pass === "boolean" &&
    Array.isArray(value.feedback)
  );
};

const isPlacementSnapshot = (value: unknown): boolean =>
  isRecord(value) &&
  (value.box === null || isRecord(value.box)) &&
  (value.params === null || isRecord(value.params)) &&
  isPlacementScore(value.lastScore);

const isPlacementMap = (value: unknown): value is PlacementMap =>
  isRecord(value) &&
  Object.values(value).every((entry) => isPlacementSnapshot(entry));

export const parseBuildSubmissionSummaryRequest = (
  payload: unknown
): { ok: true; value: BuildSubmissionSummaryRequest } | { ok: false; error: SubmissionApiError } => {
  if (!isRecord(payload)) {
    return {
      ok: false,
      error: { code: "INVALID_PAYLOAD", message: "Payload must be an object." }
    };
  }

  if (!Array.isArray(payload.protocols) || !payload.protocols.every(isProtocolListItem)) {
    return {
      ok: false,
      error: { code: "INVALID_PAYLOAD", message: "Payload protocols are invalid." }
    };
  }

  if (!isPlacementMap(payload.placements)) {
    return {
      ok: false,
      error: { code: "INVALID_PAYLOAD", message: "Payload placements are invalid." }
    };
  }

  return {
    ok: true,
    value: {
      protocols: payload.protocols,
      placements: payload.placements
    }
  };
};

export const buildSubmissionSummaryResponse = (
  request: BuildSubmissionSummaryRequest
): BuildSubmissionSummaryResponse => {
  const summary = buildExamSubmissionSummary(request.protocols, request.placements);
  const allowSubmit = haveVisitedAllSelectedProtocols(request.protocols);

  return {
    summary,
    allowSubmit,
    submitReason: allowSubmit ? "all-visited" : "blocked"
  };
};

