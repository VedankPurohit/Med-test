import { placementKey, type PlacementMap } from "@/features/planner/lib/protocolPlacements";
import { type PlannerScore } from "@/features/planner/types/planner";
import { resolveProtocol } from "@/features/workstation/lib/protocolRegistry";
import { type ProtocolListItem } from "@/features/workstation/types/workstation";

export type ProtocolSummaryEntry = {
  examCardProtocolId: string;
  label: string;
  status: ProtocolListItem["status"];
  mapped: boolean;
  plannerCaseId: string | null;
  plannerProtocolId: string | null;
  hasPlacement: boolean;
  scorePercent: number | null;
  pass: boolean | null;
  feedback: string[];
};

export type ExamSubmissionSummary = {
  generatedAt: string;
  totalProtocols: number;
  visitedProtocols: number;
  scoredProtocols: number;
  passedProtocols: number;
  averageScorePercent: number | null;
  allVisited: boolean;
  protocols: ProtocolSummaryEntry[];
};

export type BuildSubmissionSummaryRequest = {
  protocols: ProtocolListItem[];
  placements: PlacementMap;
};

export type BuildSubmissionSummaryResponse = {
  summary: ExamSubmissionSummary;
  allowSubmit: boolean;
  submitReason: "all-visited" | "blocked";
};

const getProtocolScore = (score: PlannerScore | null | undefined): number | null => {
  if (!score) {
    return null;
  }
  return score.finalScorePercent;
};

export const haveVisitedAllSelectedProtocols = (protocols: ProtocolListItem[]): boolean => {
  if (protocols.length === 0) {
    return false;
  }
  return protocols.every((protocol) => protocol.status !== "not_planned");
};

export const buildExamSubmissionSummary = (
  protocols: ProtocolListItem[],
  placements: PlacementMap
): ExamSubmissionSummary => {
  const entries: ProtocolSummaryEntry[] = protocols.map((protocol) => {
    const resolved = resolveProtocol(protocol.protocolId);
    if (!resolved) {
      return {
        examCardProtocolId: protocol.protocolId,
        label: protocol.label,
        status: protocol.status,
        mapped: false,
        plannerCaseId: null,
        plannerProtocolId: null,
        hasPlacement: false,
        scorePercent: null,
        pass: null,
        feedback: ["Protocol is not mapped to planner data."]
      };
    }

    const key = placementKey(resolved.caseId, resolved.protocolConfig.id);
    const saved = placements[key];
    const score = saved?.lastScore ?? null;
    return {
      examCardProtocolId: protocol.protocolId,
      label: protocol.label,
      status: protocol.status,
      mapped: true,
      plannerCaseId: resolved.caseId,
      plannerProtocolId: resolved.protocolConfig.id,
      hasPlacement: Boolean(saved),
      scorePercent: getProtocolScore(score),
      pass: score?.pass ?? null,
      feedback: score?.feedback ?? []
    };
  });

  const scoredEntries = entries.filter((entry) => entry.scorePercent !== null);
  const passedProtocols = entries.filter((entry) => entry.pass === true).length;
  const visitedProtocols = protocols.filter((protocol) => protocol.status !== "not_planned").length;

  const averageScorePercent = scoredEntries.length > 0
    ? Math.round(
      scoredEntries.reduce((sum, entry) => sum + (entry.scorePercent ?? 0), 0) /
      scoredEntries.length
    )
    : null;

  return {
    generatedAt: new Date().toISOString(),
    totalProtocols: protocols.length,
    visitedProtocols,
    scoredProtocols: scoredEntries.length,
    passedProtocols,
    averageScorePercent,
    allVisited: haveVisitedAllSelectedProtocols(protocols),
    protocols: entries
  };
};
