"use client";

import { useMemo } from "react";
import { useGuidanceStore } from "@/features/guidance/stores/useGuidanceStore";
import { computeLiveFeedback } from "@/features/guidance/lib/liveFeedback";
import type {
  PlannerBox,
  ProtocolTarget,
  ProtocolTolerance,
} from "@/features/planner/types/planner";

interface LiveFeedbackOverlayProps {
  box: PlannerBox | null;
  target: ProtocolTarget | null;
  tolerances: ProtocolTolerance | null;
}

export function LiveFeedbackOverlay({
  box,
  target,
  tolerances,
}: LiveFeedbackOverlayProps) {
  const tipsEnabled = useGuidanceStore((s) => s.tipsEnabled);

  const hints = useMemo(() => {
    if (!box || !target || !tolerances) return [];
    return computeLiveFeedback(box, target, tolerances);
  }, [box, target, tolerances]);

  if (!tipsEnabled || hints.length === 0) return null;

  return (
    <div
      style={{
        padding: "4px 8px",
        borderTop: "1px solid var(--chrome-border)",
        background: "var(--chrome-surface)",
      }}
    >
      <div
        style={{
          fontSize: 7,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 2,
        }}
      >
        Live Guidance
      </div>
      {hints.map((hint, i) => (
        <div
          key={i}
          style={{
            fontSize: 9,
            color: hint.includes("good")
              ? "var(--fb-good)"
              : "var(--plan-orange)",
            lineHeight: 1.4,
          }}
        >
          {hint}
        </div>
      ))}
    </div>
  );
}
