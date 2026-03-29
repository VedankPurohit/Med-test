"use client";

import { useGuidanceFlow } from "@/features/guidance/hooks/useGuidanceFlow";
import { SequenceInfoPopup } from "@/features/guidance/components/SequenceInfoPopup";
import { ParameterTeachingSlot } from "@/features/guidance/components/ParameterTeachingSlot";
import { ParameterQuizPanel } from "@/features/guidance/components/ParameterQuizPanel";
import type { PlannerBridge } from "@/features/workstation/hooks/usePlannerBridge";

/**
 * Renders the right guidance popup based on the current step in the
 * per-sequence guided flow. Sits at the layout level.
 *
 * Flow: show_target → info → parameters → quiz → planning
 */
export function GuidanceFlowOverlays({ bridge }: { bridge: PlannerBridge }) {
  const { activeProtocolId, currentStep, tipsEnabled, advanceStep, skipToPlanning } =
    useGuidanceFlow();
  const { planner, resolved } = bridge;

  if (!tipsEnabled || !activeProtocolId || !currentStep) return null;

  const protocol = resolved?.protocolConfig ?? null;
  if (!protocol) return null;

  // Step: show_target / info — show sequence info popup
  if (currentStep === "show_target" || currentStep === "info") {
    return (
      <SequenceInfoPopup
        open
        protocol={protocol}
        onNext={() => advanceStep("parameters")}
        onSkip={() => skipToPlanning()}
        onClose={() => skipToPlanning()}
      />
    );
  }

  // Step: parameters — show the teaching slot (popup or inline)
  if (currentStep === "parameters") {
    return (
      <ParameterTeachingSlot
        protocol={protocol}
        params={planner.params ?? {}}
        onParamChange={(key, value) => planner.changeParam(key, value)}
        onAccept={() => advanceStep("quiz")}
        onSkip={() => skipToPlanning()}
      />
    );
  }

  // Step: quiz — student fills params from memory
  if (currentStep === "quiz") {
    return (
      <ParameterQuizPanel
        open
        protocol={protocol}
        onComplete={() => advanceStep("planning")}
        onSkip={() => skipToPlanning()}
      />
    );
  }

  // Steps: planning, review, accepted, scanning — no overlay needed
  return null;
}
