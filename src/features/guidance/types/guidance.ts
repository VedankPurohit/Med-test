import type { ProtocolConfig, PlannerParams } from "@/features/planner/types/planner";

/** Steps in the per-sequence guided flow */
export type GuidanceStepId =
  | "show_target"
  | "info"
  | "parameters"
  | "quiz"
  | "planning";

/** Props passed to any teaching strategy renderer */
export type TeachingRenderProps = {
  protocol: ProtocolConfig;
  params: PlannerParams;
  onParamChange: (key: string, value: number) => void;
  onAccept: () => void;
  onSkip: () => void;
};

/** Interface for swappable teaching strategies */
export type TeachingStrategy = {
  id: string;
  label: string;
  render: (props: TeachingRenderProps) => React.ReactNode;
};

/** Result of sequence order validation */
export type OrderValidationResult = {
  valid: boolean;
  hint?: string;
};
