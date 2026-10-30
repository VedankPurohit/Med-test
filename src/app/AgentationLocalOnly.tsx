"use client";

import { Agentation } from "agentation";
import AgentationErrorBoundary from "@/app/AgentationErrorBoundary";

export default function AgentationLocalOnly() {
  return (
    <AgentationErrorBoundary>
      <Agentation />
    </AgentationErrorBoundary>
  );
}
